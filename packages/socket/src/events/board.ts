// packages/socket/src/events/board.ts
import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { OpSchema, type IOp, Oplog, Snapshot } from "shared";
import { enqueueOp } from "../services/oplogQueue";
import { getNextLamport } from "../utils/lamport";
import { pushRecentOp, getRecentOps } from "../utils/recentOpsBuffer";

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

  // join.board handler: fetches snapshot + oplogs tail and sends board.init
  socket.on("join.board", async (data: { boardId: string }) => {
    try {
      const targetBoardId = data.boardId;
      if (targetBoardId !== boardId) {
        console.warn(
          `[socket] User ${userId} attempted to join board ${targetBoardId} but JWT token is scoped to ${boardId}`,
        );
        socket.emit("protocol:error", {
          code: "UNAUTHORIZED",
          message: "JWT boardScope mismatch",
        });
        socket.disconnect();
        return;
      }

      // Join room first to guarantee no missed real-time broadcasts
      void socket.join(roomName(boardId));

      // Fetch latest snapshot
      const latestSnapshot = await Snapshot.findOne({ boardId })
        .sort({ opIndex: -1 })
        .lean();

      let snapshotVersion = 0;
      let snapshotJson = { strokes: [], shapes: [], notes: [] };

      if (latestSnapshot) {
        snapshotVersion = latestSnapshot.opIndex;
        snapshotJson = latestSnapshot.snapshotJson || snapshotJson;
      }

      // Fetch persisted oplogs from MongoDB after snapshotVersion
      const dbOplogs = await Oplog.find({
        boardId,
        lamport: { $gt: snapshotVersion },
      })
        .sort({ lamport: 1 })
        .lean();

      // Fetch recent unpersisted oplogs from buffer
      const bufferedOps = getRecentOps(boardId, snapshotVersion);

      // Merge and deduplicate by opId
      const opMap = new Map<string, IOp>();
      for (const op of dbOplogs) {
        opMap.set(op.opId, op);
      }
      for (const op of bufferedOps) {
        opMap.set(op.opId, op);
      }

      // Sort deterministically by (lamport, opId)
      const mergedOps = Array.from(opMap.values()).sort((a, b) => {
        if (a.lamport !== b.lamport) {
          return a.lamport - b.lamport;
        }
        return a.opId.localeCompare(b.opId);
      });

      // Send board.init
      socket.emit("board.init", {
        snapshot: {
          version: snapshotVersion,
          snapshotJson,
        },
        oplogs: mergedOps,
      });

      console.log(
        `[socket] join.board success: user=${userId} board=${boardId} snapshotVersion=${snapshotVersion} opsCount=${mergedOps.length}`,
      );
    } catch (err) {
      console.error(
        `[socket] join.board error for user ${userId} on board ${boardId}:`,
        err,
      );
      socket.emit("protocol:error", {
        code: "SERVER_ERROR",
        message: "Failed to initialize board state",
      });
    }
  });

  // 1. Generic op.commit handler (Step 5 core)
  socket.on("op.commit", async (raw: unknown, ack?: OpCommitAck) => {
    try {
      const nextLamport = await getNextLamport(boardId);

      // Fill in server-known context and assign authoritative lamport
      const enriched =
        typeof raw === "object" && raw !== null
          ? {
              ...raw,
              boardId,
              actorId: userId,
              createdAt: new Date().toISOString(),
              lamport: nextLamport,
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
        `[socket] op commit opId=${op.opId} type=${op.type} board=${op.boardId} user=${op.actorId} lamport=${op.lamport}`,
      );

      // Cache in in-memory ring buffer
      pushRecentOp(boardId, op);

      // Broadcast first for low latency
      socket.to(roomName(boardId)).emit("op.broadcast", op);

      // Asynchronously enqueue for worker persistence
      await enqueueOp(op);
      void ack?.({ ok: true, opId: op.opId });
    } catch (err) {
      console.error(`[socket] failed to process op commit:`, err);
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

    try {
      const nextLamport = await getNextLamport(boardId);

      console.log(
        `[socket] stroke commit opId=${opId} board=${boardId} user=${userId} lamport=${nextLamport}`,
      );

      // Enqueue as a standard Op
      const op: IOp = {
        opId,
        boardId,
        type: "stroke.commit",
        payload: { stroke },
        actorId: userId,
        lamport: nextLamport,
        createdAt: new Date().toISOString(),
      };

      // Cache in in-memory ring buffer
      pushRecentOp(boardId, op);

      // Broadcast specific stroke event
      socket.to(roomName(boardId)).emit("op.stroke.broadcast", {
        boardId,
        opId,
        userId,
        stroke,
        serverTs: Date.now(),
      });

      await enqueueOp(op);
      void ack?.({ ok: true, opId });
    } catch (err) {
      console.error(`[socket] failed to process stroke commit ${opId}:`, err);
      void ack?.({ ok: false, error: "PERSISTENCE_FAILED" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[socket] user ${userId} disconnected from board ${boardId}: ${reason}`,
    );
  });
}
