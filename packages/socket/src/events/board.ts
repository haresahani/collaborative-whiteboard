// packages/socket/src/events/board.ts
import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { OpSchema, type IOp } from "shared";
import { enqueueOp } from "../services/oplogQueue";

const StrokeCommitSchema = z.object({
  opId: z.string().uuid(),
  stroke: z.object({
    points: z
      .array(z.tuple([z.number(), z.number()]))
      .min(1)
      .max(5000),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    width: z.number().min(1).max(64),
    tool: z.enum(["pen", "eraser"]),
  }),
});

type StrokeCommitAck = (response: {
  ok: boolean;
  opId?: string;
  error?: string;
}) => void;

type OpCommitAck = (response: {
  ok: boolean;
  opId?: string;
  error?: string;
}) => void;

function roomName(boardId: string): string {
  return `board:${boardId}`;
}

export function registerBoardHandlers(io: Server, socket: Socket) {
  const { userId, boardId } = socket.data as {
    userId: string;
    boardId: string;
  };

  void socket.join(roomName(boardId));
  console.log(`[socket] user ${userId} joined room ${roomName(boardId)}`);

  // 1. Generic op.commit handler (Step 5 core)
  socket.on("op.commit", async (raw: unknown, ack?: OpCommitAck) => {
    // Fill in server-known context if missing in raw payload
    const enriched =
      typeof raw === "object" && raw !== null
        ? {
            boardId,
            actorId: userId,
            createdAt: new Date().toISOString(),
            ...raw,
          }
        : raw;

    const parsed = OpSchema.safeParse(enriched);

    if (!parsed.success) {
      console.warn(
        `[socket] invalid op payload from ${userId}:`,
        parsed.error.issues,
      );
      void ack?.({ ok: false, error: "INVALID_PAYLOAD" });
      return;
    }

    const op = parsed.data;

    console.log(
      `[socket] op commit opId=${op.opId} type=${op.type} board=${op.boardId} user=${op.actorId}`,
    );

    // Broadcast first for low latency
    socket.to(roomName(boardId)).emit("op.broadcast", op);

    // Asynchronously enqueue for worker persistence
    try {
      await enqueueOp(op);
      void ack?.({ ok: true, opId: op.opId });
    } catch (err) {
      console.error(`[socket] failed to enqueue op ${op.opId}:`, err);
      void ack?.({ ok: false, error: "PERSISTENCE_FAILED" });
    }
  });

  // 2. Legacy/specific stroke.commit handler (kept for compatibility/robustness)
  socket.on("op.stroke.commit", async (raw: unknown, ack?: StrokeCommitAck) => {
    const parsed = StrokeCommitSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn(
        `[socket] invalid stroke payload from ${userId}:`,
        parsed.error.issues,
      );
      void ack?.({ ok: false, error: "INVALID_PAYLOAD" });
      return;
    }

    const { opId, stroke } = parsed.data;

    console.log(
      `[socket] stroke commit opId=${opId} board=${boardId} user=${userId}`,
    );

    // Broadcast specific stroke event
    socket.to(roomName(boardId)).emit("op.stroke.broadcast", {
      boardId,
      opId,
      userId,
      stroke,
      serverTs: Date.now(),
    });

    // Enqueue as a standard Op
    const op: IOp = {
      opId,
      boardId,
      type: "stroke.commit",
      payload: { stroke },
      actorId: userId,
      lamport: 0, // default logical clock for legacy/fallback
      createdAt: new Date().toISOString(),
    };

    try {
      await enqueueOp(op);
      void ack?.({ ok: true, opId });
    } catch (err) {
      console.error(`[socket] failed to enqueue stroke op ${opId}:`, err);
      void ack?.({ ok: false, error: "PERSISTENCE_FAILED" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[socket] user ${userId} disconnected from board ${boardId}: ${reason}`,
    );
  });
}
