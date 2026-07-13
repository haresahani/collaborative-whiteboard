import mongoose from "mongoose";
import { Request, Response } from "express";
import { Oplog } from "./oplog.model";
import { Asset } from "../asset/asset.model";
import { assertBoardAccess } from "../board/board.access";

export const appendOperation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId ?? req.params.id;
    const { type, payload, opId } = req.body;

    if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const board = await assertBoardAccess(boardId, userId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    //VALIDATION LAYER (CRITICAL)
    if (type === "element.insert") {
      const element = payload?.element;

      if (!element) {
        return res.status(400).json({
          success: false,
          message: "Missing element payload",
        });
      }

      //IMAGE / ATTACHMENT VALIDATION
      if (element.type === "image" || element.type === "attachment") {
        const assetId = element.assetId;

        if (!assetId) {
          return res.status(400).json({
            success: false,
            message: "Missing assetId for element",
          });
        }

        if (
          typeof assetId !== "string" ||
          !mongoose.Types.ObjectId.isValid(assetId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid asset ID",
          });
        }

        const asset = await Asset.findById(assetId);

        if (!asset) {
          return res.status(404).json({
            success: false,
            message: "Asset not found",
          });
        }

        //Ensure asset belongs to board
        if (asset.boardId.toString() !== boardId) {
          return res.status(403).json({
            success: false,
            message: "Asset does not belong to this board",
          });
        }

        //MOST IMPORTANT CHECK
        if (asset.status !== "ready") {
          return res.status(400).json({
            success: false,
            message: "Asset is not ready",
          });
        }
      }
    }

    //Normal operation append
    const lastOp = await Oplog.findOne({ boardId })
      .sort({ seq: -1 })
      .select("seq");

    const nextSeq = lastOp ? lastOp.seq + 1 : 1;

    const operation = await Oplog.create({
      boardId,
      seq: nextSeq,
      clientId: userId,
      opId,
      type,
      payload,
    });

    res.json({
      success: true,
      data: operation,
    });
  } catch (error) {
    console.error("Append operation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to append operation",
    });
  }
};
