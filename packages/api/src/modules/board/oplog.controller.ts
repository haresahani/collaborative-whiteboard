import { Request, Response } from "express";
import { Oplog } from "./oplog.model";

export const appendOperation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    // const { boardId } = req.params;
    const boardId = req.params.id;
    const { type, payload, opId } = req.body;

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
