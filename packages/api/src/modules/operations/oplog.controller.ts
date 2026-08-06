import mongoose from "mongoose";
import { Request, Response } from "express";
import { Oplog } from "./oplog.model";
import { Asset } from "../asset/asset.model";
import { assertBoardAccess } from "../board/board.access";

export const appendOperation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId ?? req.params.id;
    const { type, payload, opId, actorId, lamport } = req.body;

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

    // VALIDATION LAYER (CRITICAL)
    if (type === "element.insert") {
      const element = payload?.element;

      if (!element) {
        return res.status(400).json({
          success: false,
          message: "Missing element payload",
        });
      }

      // IMAGE / ATTACHMENT VALIDATION
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

        const asset = await Asset.findById(assetId).lean();

        if (!asset) {
          return res.status(404).json({
            success: false,
            message: "Asset not found",
          });
        }

        // Ensure asset belongs to board
        if (asset.boardId.toString() !== boardId) {
          return res.status(403).json({
            success: false,
            message: "Asset does not belong to this board",
          });
        }

        // MOST IMPORTANT CHECK
        if (asset.status !== "ready") {
          return res.status(400).json({
            success: false,
            message: "Asset is not ready",
          });
        }
      }
    }

    // OPTIMIZED LAMPORT CALCULATION:
    // If lamport is provided by client, skip database findOne roundtrip completely.
    // Otherwise, fetch latest lamport using .lean() for zero object overhead.
    let nextLamport = 1;
    if (typeof lamport !== "number") {
      const lastOp = await Oplog.findOne({ boardId })
        .sort({ lamport: -1 })
        .select("lamport")
        .lean();
      nextLamport = lastOp ? (lastOp as { lamport: number }).lamport + 1 : 1;
    }

    const operation = await Oplog.create({
      boardId,
      opId:
        opId ||
        `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: type || "element.create",
      payload: payload || {},
      actorId: actorId || userId,
      lamport: typeof lamport === "number" ? lamport : nextLamport,
      createdAt: new Date(),
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
