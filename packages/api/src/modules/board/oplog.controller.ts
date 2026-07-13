import { Request, Response } from "express";
import { Oplog } from "./oplog.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

/** POST /api/boards/:id/operations — Append an operation to the board's oplog. */
export const appendOperation = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
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

    ApiResponse.success(res, operation);
  },
);
