import type { Server, Socket } from "socket.io";
import { z } from "zod";
import {
  OpSchema,
  type IOp,
  cursorMoveSchema,
  cursorBatchSchema,
  chatSendSchema,
  decodeOpBatch,
  decodeCursorBatch,
  encodeOpBatch,
  encodeCursorBatch,
  decodeBinaryPayload,
} from "shared";
import { Oplog, Snapshot } from "shared/models";
import { enqueueOp } from "../services/oplogQueue";
import { getNextLamport } from "../utils/lamport";
import { pushRecentOp, getRecentOps } from "../utils/recentOpsBuffer";
import { PresenceService } from "../services/presence";
import { Chat } from "../models/chat";

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
  const { userId, boardId, displayName } = socket.data as {
    userId: string;
    boardId: string;
    displayName: string;
  };

  void socket.join(roomName(boardId));
  console.log(
    `[socket] user ${userId} (${displayName}) joined room ${roomName(boardId)}`,
  );

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

      try {
        await PresenceService.updatePresence(
          boardId,
          userId,
          displayName,
          socket.id,
        );
        const activeUsers = await PresenceService.getActiveUsers(boardId);
        io.to(roomName(boardId)).emit("presence.list", activeUsers);

        const chatHistory = await Chat.find({ boardId })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        socket.emit("chat.history", chatHistory.reverse());
      } catch (presenceErr) {
        console.error(
          `[socket] join.board presence/chat init failed:`,
          presenceErr,
        );
      }

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

      // Asynchronously enqueue for worker persistence (bypass for ephemeral stroke.point)
      if (op.type !== "stroke.point") {
        await enqueueOp(op);
      }
      void ack?.({ ok: true, opId: op.opId });
    } catch (err) {
      console.error(`[socket] failed to process op commit:`, err);
      void ack?.({ ok: false, error: "PERSISTENCE_FAILED" });
    }
  });

  // 1b. Batched op handler with MessagePack binary payload support
  socket.on(
    "op.batch",
    async (
      raw: unknown,
      ack?: (res: { ok: boolean; count?: number; error?: string }) => void,
    ) => {
      try {
        let rawOps: unknown[] = [];
        if (
          raw instanceof ArrayBuffer ||
          raw instanceof Uint8Array ||
          Buffer.isBuffer(raw)
        ) {
          rawOps = decodeOpBatch(raw as ArrayBuffer);
        } else if (Array.isArray(raw)) {
          rawOps = raw;
        } else if (
          typeof raw === "object" &&
          raw !== null &&
          "ops" in raw &&
          Array.isArray((raw as { ops: unknown[] }).ops)
        ) {
          rawOps = (raw as { ops: unknown[] }).ops;
        }

        const processedOps: IOp[] = [];
        for (const item of rawOps) {
          const nextLamport = await getNextLamport(boardId);
          const enriched =
            typeof item === "object" && item !== null
              ? {
                  ...item,
                  boardId,
                  actorId: userId,
                  createdAt: new Date().toISOString(),
                  lamport: nextLamport,
                }
              : item;

          const parsed = OpSchema.safeParse(enriched);
          if (parsed.success) {
            const op = parsed.data;
            pushRecentOp(boardId, op);
            if (op.type !== "stroke.point") {
              await enqueueOp(op);
            }
            processedOps.push(op);
          }
        }

        if (processedOps.length > 0) {
          const encoded = encodeOpBatch(processedOps);
          socket.to(roomName(boardId)).emit("op.batch", encoded);
        }

        void ack?.({ ok: true, count: processedOps.length });
      } catch (err) {
        console.error("[socket] op.batch handling failed:", err);
        void ack?.({ ok: false, error: "BATCH_PROCESSING_FAILED" });
      }
    },
  );

  // 1c. Batched cursor handler with MessagePack binary support & per-user collapsing
  socket.on("cursor.batch", (raw: unknown) => {
    try {
      let rawCursors: (import("shared").CursorMove & {
        userId?: string;
        displayName?: string;
      })[] = [];
      if (
        raw instanceof ArrayBuffer ||
        raw instanceof Uint8Array ||
        Buffer.isBuffer(raw)
      ) {
        rawCursors = decodeCursorBatch(raw as ArrayBuffer);
      } else if (Array.isArray(raw)) {
        rawCursors = raw as (import("shared").CursorMove & {
          userId?: string;
          displayName?: string;
        })[];
      } else if (
        typeof raw === "object" &&
        raw !== null &&
        "cursors" in raw &&
        Array.isArray(
          (
            raw as {
              cursors: (import("shared").CursorMove & {
                userId?: string;
                displayName?: string;
              })[];
            }
          ).cursors,
        )
      ) {
        rawCursors = (
          raw as {
            cursors: (import("shared").CursorMove & {
              userId?: string;
              displayName?: string;
            })[];
          }
        ).cursors;
      }

      const latestByUser = new Map<
        string,
        import("shared").CursorMove & { userId?: string; displayName?: string }
      >();
      for (const item of rawCursors) {
        const targetUserId = item.userId || userId;
        const targetDisplayName = item.displayName || displayName;
        latestByUser.set(targetUserId, {
          ...item,
          userId: targetUserId,
          displayName: targetDisplayName,
        });
      }

      const collapsed = Array.from(latestByUser.values());
      if (collapsed.length > 0) {
        const encoded = encodeCursorBatch(collapsed);
        socket.to(roomName(boardId)).emit("cursor.batch", encoded);
      }
    } catch (err) {
      console.error("[socket] cursor.batch handling failed:", err);
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

  socket.on("presence.heartbeat", async () => {
    try {
      await PresenceService.updatePresence(
        boardId,
        userId,
        displayName,
        socket.id,
      );
      const activeUsers = await PresenceService.getActiveUsers(boardId);
      io.to(roomName(boardId)).emit("presence.list", activeUsers);
    } catch (err) {
      console.error("[socket] Failed to process presence heartbeat:", err);
    }
  });

  socket.on("cursor.move", (raw: unknown) => {
    try {
      // Rate limit: max 50 events/sec per socket
      const now = Date.now();
      socket.data.lastCursorTime = socket.data.lastCursorTime || 0;
      if (now - socket.data.lastCursorTime < 20) {
        return;
      }
      socket.data.lastCursorTime = now;

      const parsed = cursorMoveSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(
          "[socket] cursorMoveSchema validation failed:",
          parsed.error.format(),
        );
        return;
      }

      const { x, y, previewElement, erasedIds, tool } = parsed.data;
      console.log(
        `[socket] cursor.move relay: user=${userId} (${displayName}) x=${x} y=${y} hasPreview=${!!previewElement} erasedCount=${erasedIds?.length || 0} tool=${tool || "none"}`,
      );

      // Broadcast to other clients only
      socket.to(roomName(boardId)).emit("cursor.broadcast", {
        userId,
        displayName,
        x,
        y,
        previewElement,
        erasedIds,
        tool,
      });
    } catch (err) {
      console.error("[socket] Cursor move error:", err);
    }
  });

  socket.on("chat.send", async (raw: unknown) => {
    try {
      // Rate limit: max 2 messages/sec per socket
      const now = Date.now();
      socket.data.lastChatTime = socket.data.lastChatTime || 0;
      if (now - socket.data.lastChatTime < 500) {
        socket.emit("protocol:error", {
          code: "RATE_LIMIT_EXCEEDED",
          message: "You are sending messages too fast",
        });
        return;
      }
      socket.data.lastChatTime = now;

      const parsed = chatSendSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit("protocol:error", {
          code: "INVALID_PAYLOAD",
          message: parsed.error.errors[0]?.message || "Invalid chat message",
        });
        return;
      }

      const { message, messageId } = parsed.data;

      let chatMessage;
      try {
        chatMessage = await Chat.create({
          boardId,
          userId,
          displayName,
          message,
          messageId,
          createdAt: new Date(),
        });
      } catch (err: unknown) {
        const error = err as { code?: number };
        if (error && error.code === 11000) {
          console.warn(
            `[socket] Duplicate chat message ignored: messageId=${messageId}`,
          );
          return;
        }
        throw err;
      }

      // Emit to all clients (including sender) to ensure authoritative ID and time
      io.to(roomName(boardId)).emit("chat.broadcast", chatMessage);
    } catch (err) {
      console.error("[socket] Chat send error:", err);
      socket.emit("protocol:error", {
        code: "SERVER_ERROR",
        message: "Failed to persist chat message",
      });
    }
  });

  socket.on(
    "yjs.update",
    async (data: { update: unknown }, ack?: (res: { ok: boolean }) => void) => {
      try {
        const nextLamport = await getNextLamport(boardId);
        const op: IOp = {
          opId: crypto.randomUUID(),
          boardId,
          type: "sticky.textUpdate",
          payload: { update: data.update },
          actorId: userId,
          lamport: nextLamport,
          createdAt: new Date().toISOString(),
        };

        pushRecentOp(boardId, op);
        socket
          .to(roomName(boardId))
          .emit("yjs.update", { update: data.update });
        await enqueueOp(op);
        void ack?.({ ok: true });
      } catch (err) {
        console.error("[socket] yjs.update handler error:", err);
        void ack?.({ ok: false });
      }
    },
  );

  socket.on("yjs.awareness", (data: { update: unknown }) => {
    socket.to(roomName(boardId)).emit("yjs.awareness", { update: data.update });
  });

  socket.on("disconnect", async (reason) => {
    console.log(
      `[socket] user ${userId} (${displayName}) disconnected from board ${boardId}: ${reason}`,
    );
    try {
      socket
        .to(roomName(boardId))
        .emit("yjs.awareness.remove", { userId, socketId: socket.id });
      await PresenceService.removePresence(
        boardId,
        userId,
        displayName,
        socket.id,
      );
      const activeUsers = await PresenceService.getActiveUsers(boardId);
      io.to(roomName(boardId)).emit("presence.list", activeUsers);
    } catch (err) {
      console.error("[socket] Failed to remove presence on disconnect:", err);
    }
  });
}
