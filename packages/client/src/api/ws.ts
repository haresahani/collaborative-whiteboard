/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";
import { getStoredToken, getBoardJoinToken } from "./auth";
import { yjsService } from "../features/whiteboard/services/yjsService";
import type {
  Element,
  StrokeElement,
} from "../features/whiteboard/models/element";
import { useBoardStore } from "../features/whiteboard/store/boardStore";
import {
  deserializeSnapshot,
  type SnapshotElementGroups,
} from "../features/whiteboard/utils/snapshotStorage";
import {
  applyOperation,
  replayOperations,
  type ISharedElement,
  encodeOpBatch,
  decodeOpBatch,
  encodeCursorBatch,
  decodeCursorBatch,
} from "shared";
import {
  useCollaborationStore,
  type ChatMessage,
} from "../features/whiteboard/store/collaborationStore";

// Inline accent mapper — deterministic color per userId
const ACCENT_PALETTE = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6",
];
function getUserAccent(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

// Inline chat message validator
const chatSendSchema = {
  safeParse(data: { message: string; messageId: string }) {
    if (!data.message || data.message.trim().length === 0) {
      return { success: false as const, error: { errors: [{ message: "Message cannot be empty" }] } };
    }
    if (data.message.length > 2000) {
      return { success: false as const, error: { errors: [{ message: "Message too long" }] } };
    }
    return { success: true as const, data };
  },
};

export interface RemoteStrokeData {
  points: [number, number][];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

type StrokeBroadcastPayload = {
  boardId: string;
  opId: string;
  userId: string;
  stroke: RemoteStrokeData;
  serverTs: number;
};

interface AckResponse {
  ok: boolean;
  opId?: string;
  error?: string;
}

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("[Socket] Failed to decode JWT:", err);
    return null;
  }
}

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;
  private myUserId: string | null = null;
  private heartbeatIntervalId: number | null = null;
  private isConnecting = false;

  private pendingOpsQueue: any[] = [];
  private pendingCursorsQueue: any[] = [];
  private batchTimerId: number | null = null;
  private readonly MAX_BATCH_SIZE = 20;
  private readonly BATCH_INTERVAL_MS = 50;

  async connect(boardId: string) {
    if (this.socket && this.currentBoardId === boardId) {
      return;
    }

    if (this.isConnecting && this.currentBoardId === boardId) {
      return;
    }

    this.isConnecting = true;
    this.currentBoardId = boardId;

    if (this.socket) {
      this.disconnect();
    }

    try {
      const joinToken = await getBoardJoinToken(boardId);

      // Abort if disconnect() was called during token retrieval
      if (!this.isConnecting || this.currentBoardId !== boardId) {
        return;
      }

      const claims = decodeJwt(joinToken);
      if (claims) {
        this.myUserId = claims.userId;
      }

      const socketUrl = (import.meta.env.VITE_SOCKET_URL as string) || undefined;
      this.socket = io(socketUrl, {
        auth: {
          token: joinToken,
        },
        transports: ["websocket", "polling"],
      });

      this.isConnecting = false;

      this.socket.on("connect", () => {
        console.log(`[Socket] Connected to Socket.IO for board: ${boardId}`);
        // Request the server to load current state and join the board room
        this.socket?.emit("join.board", { boardId });

        // Start periodic presence heartbeat immediately, then every 10 seconds
        this.socket?.emit("presence.heartbeat");
        if (this.heartbeatIntervalId !== null) {
          window.clearInterval(this.heartbeatIntervalId);
        }
        this.heartbeatIntervalId = window.setInterval(() => {
          if (this.socket?.connected) {
            this.socket.emit("presence.heartbeat");
          }
        }, 10000);

        this.startBatching();
      });

      // Handle the initial board sync payload (snapshot + oplogs tail)
      this.socket.on(
        "board.init",
        async (data: {
          snapshot?: { snapshotJson?: SnapshotElementGroups };
          oplogs: unknown[];
          title?: string;
        }) => {
          console.log("[Socket] Received board.init:", data);
          const snapshotElements = deserializeSnapshot(
            data.snapshot?.snapshotJson,
          );
          const finalElements = replayOperations(
            snapshotElements as unknown as ISharedElement[],
            data.oplogs as unknown as import("shared").IOp[],
          ) as unknown as Element[];
          useBoardStore.getState().setElements(finalElements);

          if (data.title) {
            window.dispatchEvent(new CustomEvent("board:title:sync", { detail: { title: data.title } }));
          }

          // Initialize collaborative Yjs state
          try {
            const authToken = getStoredToken();
            const headers: Record<string, string> = {};
            if (authToken) {
              headers["Authorization"] = `Bearer ${authToken}`;
            }
            const yjsRes = await fetch(`/api/boards/${boardId}/yjs-state`, { headers });
            if (yjsRes.ok) {
              const arrayBuffer = await yjsRes.arrayBuffer();
              yjsService.initBoard(boardId, new Uint8Array(arrayBuffer));
            } else {
              yjsService.initBoard(boardId);
            }
          } catch {
            yjsService.initBoard(boardId);
          }
        },
      );

      // Handle live title changes
      this.socket.on("board.title.broadcast", (data: { boardId: string; title: string }) => {
        if (data.title) {
          window.dispatchEvent(new CustomEvent("board:title:sync", { detail: { title: data.title } }));
        }
      });

      // Handle general operational broadcasts
      this.socket.on("op.broadcast", (op: unknown) => {
        console.log("[Socket] Received op.broadcast:", op);
        const currentElements = useBoardStore.getState().elements;
        const newElements = applyOperation(
          currentElements as unknown as ISharedElement[],
          op as import("shared").IOp,
        ) as unknown as Element[];
        useBoardStore.getState().setElements(newElements);
      });

      // Handle binary / JSON op.batch broadcasts
      this.socket.on("op.batch", (raw: unknown) => {
        try {
          const ops =
            raw instanceof ArrayBuffer || raw instanceof Uint8Array
              ? decodeOpBatch(raw)
              : Array.isArray(raw)
                ? raw
                : (raw as any)?.ops || [];

          let currentElements = useBoardStore.getState().elements;
          for (const op of ops) {
            currentElements = applyOperation(
              currentElements as unknown as ISharedElement[],
              op as import("shared").IOp,
            ) as unknown as Element[];
          }
          useBoardStore.getState().setElements(currentElements);
        } catch (err) {
          console.error("[Socket] Failed to process incoming op.batch:", err);
        }
      });

      // Handle binary / JSON cursor.batch broadcasts
      this.socket.on("cursor.batch", (raw: unknown) => {
        try {
          const cursors =
            raw instanceof ArrayBuffer || raw instanceof Uint8Array
              ? decodeCursorBatch(raw)
              : Array.isArray(raw)
                ? raw
                : (raw as any)?.cursors || [];

          for (const c of cursors) {
            if (c.userId === this.myUserId) continue;
            useCollaborationStore.getState().updateCursor(c.userId!, {
              userId: c.userId!,
              displayName: c.displayName || "Anonymous",
              accent: getUserAccent(c.userId!),
              x: c.x,
              y: c.y,
              previewElement: c.previewElement,
              erasedIds: c.erasedIds,
              tool: c.tool,
            });
          }
        } catch (err) {
          console.error(
            "[Socket] Failed to process incoming cursor.batch:",
            err,
          );
        }
      });

      // Handle Yjs updates & awareness broadcasts
      this.socket.on("yjs.update", (data: { update: unknown }) => {
        if (!data?.update) return;
        const raw = data.update;
        const arr = new Uint8Array(
          Array.isArray(raw)
            ? (raw as number[])
            : typeof raw === "string"
              ? Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
              : (raw as ArrayBuffer),
        );
        yjsService.applyRemoteUpdate(arr);
      });

      this.socket.on("yjs.awareness", (data: { update: unknown }) => {
        if (!data?.update) return;
        const raw = data.update;
        const arr = new Uint8Array(
          Array.isArray(raw)
            ? (raw as number[])
            : typeof raw === "string"
              ? Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
              : (raw as ArrayBuffer),
        );
        yjsService.applyRemoteAwareness(arr);
      });

      // Handle legacy/specific stroke commits (mapping to standard op for the reducer)
      this.socket.on(
        "op.stroke.broadcast",
        (payload: StrokeBroadcastPayload) => {
          if (payload.userId === this.myUserId) return;
          console.log("[Socket] Received op.stroke.broadcast:", payload);
          const op: import("shared").IOp = {
            opId: payload.opId,
            boardId: payload.boardId,
            type: "stroke.commit" as const,
            payload: { stroke: payload.stroke } as unknown as Record<
              string,
              unknown
            >,
            actorId: payload.userId,
            lamport: 0,
            createdAt: new Date(payload.serverTs || Date.now()).toISOString(),
          };
          const currentElements = useBoardStore.getState().elements;
          const newElements = applyOperation(
            currentElements as unknown as ISharedElement[],
            op,
          ) as unknown as Element[];
          useBoardStore.getState().setElements(newElements);
        },
      );

      // Handle single op broadcast (rectangle, ellipse, pen, text, delete, etc.)
      this.socket.on("op.broadcast", (op: import("shared").IOp) => {
        if (!op || op.actorId === this.myUserId) return;
        console.log("[Socket] Received op.broadcast:", op);
        const currentElements = useBoardStore.getState().elements;
        const newElements = applyOperation(
          currentElements as unknown as ISharedElement[],
          op,
        ) as unknown as Element[];
        useBoardStore.getState().setElements(newElements);
      });

      // Handle batched ops broadcast
      this.socket.on("op.batch", (raw: unknown) => {
        try {
          const ops: import("shared").IOp[] =
            raw instanceof ArrayBuffer || raw instanceof Uint8Array || Buffer.isBuffer(raw)
              ? decodeOpBatch(raw as ArrayBuffer)
              : Array.isArray(raw)
                ? raw
                : (raw as any)?.ops || [];

          let currentElements = useBoardStore.getState().elements as unknown as ISharedElement[];
          let changed = false;
          for (const op of ops) {
            if (op.actorId === this.myUserId) continue;
            currentElements = applyOperation(currentElements, op);
            changed = true;
          }
          if (changed) {
            useBoardStore.getState().setElements(currentElements as unknown as Element[]);
          }
        } catch (err) {
          console.error("[Socket] Failed to process incoming op.batch:", err);
        }
      });

      // --- Presence listeners ---
      this.socket.on("presence.list", (users: any[]) => {
        const mapped = users.map((u) => ({
          userId: u.userId,
          displayName: u.displayName,
          accent: getUserAccent(u.userId),
        }));
        useCollaborationStore.getState().setActiveUsers(mapped);
      });

      // --- Cursor listeners ---
      this.socket.on("cursor.broadcast", (data: any) => {
        if (data.userId === this.myUserId) return;
        useCollaborationStore.getState().updateCursor(data.userId, {
          userId: data.userId,
          displayName: data.displayName,
          accent: getUserAccent(data.userId),
          x: data.x,
          y: data.y,
          previewElement: data.previewElement,
          erasedIds: data.erasedIds,
          tool: data.tool,
        });
      });

      // --- Chat listeners ---
      this.socket.on("chat.history", (messages: any[]) => {
        const normalized = (messages || []).map((m) => ({
          id: String(m.id || m._id || m.messageId || Math.random()),
          userId: String(m.userId || ""),
          displayName: String(m.displayName || "Anonymous"),
          message: String(m.message || ""),
          timestamp: String(m.timestamp || m.createdAt || new Date().toISOString()),
        }));
        useCollaborationStore.getState().setChatMessages(normalized);
      });

      this.socket.on("chat.broadcast", (raw: any) => {
        const message: ChatMessage = {
          id: String(raw.id || raw._id || raw.messageId || Math.random()),
          userId: String(raw.userId || ""),
          displayName: String(raw.displayName || "Anonymous"),
          message: String(raw.message || ""),
          timestamp: String(raw.timestamp || raw.createdAt || new Date().toISOString()),
        };
        useCollaborationStore.getState().addChatMessage(message);
      });

      this.socket.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err.message);
      });

      this.socket.on("disconnect", () => {
        this.flushBatches();
      });
    } catch (err) {
      this.isConnecting = false;
      this.currentBoardId = null;
      console.error("[Socket] Failed to connect:", err);
    }
  }

  private startBatching() {
    if (this.batchTimerId !== null) return;
    this.batchTimerId = window.setInterval(() => {
      this.flushBatches();
    }, this.BATCH_INTERVAL_MS);

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("beforeunload", this.handleBeforeUnload);
    }
  }

  private stopBatching() {
    if (this.batchTimerId !== null) {
      window.clearInterval(this.batchTimerId);
      this.batchTimerId = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
    }
    this.flushBatches();
  }

  private handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.hidden) {
      this.flushBatches();
    }
  };

  private handleBeforeUnload = () => {
    this.flushBatches();
  };

  public flushBatches() {
    if (!this.socket || !this.socket.connected) return;

    if (this.pendingOpsQueue.length > 0) {
      const opsToFlush = [...this.pendingOpsQueue];
      this.pendingOpsQueue = [];
      const encoded = encodeOpBatch(opsToFlush);
      this.socket.emit("op.batch", encoded);
    }

    if (this.pendingCursorsQueue.length > 0) {
      const cursorsToFlush = [...this.pendingCursorsQueue];
      this.pendingCursorsQueue = [];
      // Collapse cursor moves to the last write per user before sending
      const collapsed = cursorsToFlush.slice(-1);
      const encoded = encodeCursorBatch(collapsed);
      this.socket.emit("cursor.batch", encoded);
    }
  }

  disconnect() {
    this.stopBatching();
    this.isConnecting = false;
    this.currentBoardId = null;
    this.myUserId = null;

    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useCollaborationStore.getState().clearCursors();
    }
  }

  getUserId(): string | null {
    return this.myUserId;
  }

  emitBoardTitleUpdate(boardId: string, title: string) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit("board.title.update", { boardId, title });
  }

  emitYjsUpdate(boardId: string, update: Uint8Array) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit("yjs.update", { boardId, update: Array.from(update) });
  }

  emitYjsAwareness(boardId: string, update: Uint8Array) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit("yjs.awareness", { boardId, update: Array.from(update) });
  }

  emitStroke(stroke: StrokeElement) {
    if (!this.socket || !this.socket.connected) {
      console.warn("[Socket] Cannot emit stroke: socket is disconnected");
      return;
    }

    const opId = stroke.id || crypto.randomUUID();

    const payload = {
      opId,
      stroke: {
        points: stroke.points.map((p) => [p.x, p.y] as [number, number]),
        color: stroke.style.strokeColor || "#000000",
        width: stroke.style.strokeWidth || 2,
        tool: "pen" as const,
      },
    };

    this.socket.emit("op.stroke.commit", payload, (ack?: AckResponse) => {
      if (!ack?.ok) {
        console.error("[Socket] Stroke commit ack failed:", ack?.error);
      } else {
        console.log("[Socket] Stroke commit ack success opId:", ack.opId);
      }
    });
  }

  // --- Collaboration Emitters ---
  emitCursor(
    x: number,
    y: number,
    previewElement?: any,
    erasedIds?: string[],
    tool?: string,
  ) {
    if (!this.socket || !this.socket.connected) return;
    const cursorData = { x, y, previewElement, erasedIds, tool };
    this.pendingCursorsQueue.push(cursorData);
    if (this.pendingCursorsQueue.length >= this.MAX_BATCH_SIZE) {
      this.flushBatches();
    }
  }

  sendCursorMove(
    x: number,
    y: number,
    previewElement?: any,
    erasedIds?: string[],
    tool?: string,
  ) {
    this.emitCursor(x, y, previewElement, erasedIds, tool);
  }

  sendChatMessage(message: string): { ok: boolean; error?: string } {
    if (!this.socket || !this.socket.connected) {
      return { ok: false, error: "Socket is disconnected" };
    }

    const messageId = crypto.randomUUID();
    const parsed = chatSendSchema.safeParse({ message, messageId });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.errors[0]?.message || "Invalid message format",
      };
    }

    this.socket.emit("chat.send", {
      message: parsed.data.message,
      messageId: parsed.data.messageId,
    });
    return { ok: true };
  }

  emitOp(
    type:
      | "element.create"
      | "element.update"
      | "element.delete"
      | "op.undo"
      | "op.redo"
      | "stroke.finalize"
      | "stroke.point",
    payload: Record<string, unknown>,
  ): Promise<{ ok: boolean; opId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        console.warn("[Socket] Cannot emit op: socket is disconnected");
        resolve({ ok: false, error: "SOCKET_DISCONNECTED" });
        return;
      }

      const opId = (payload.id ||
        payload.opId ||
        crypto.randomUUID()) as string;

      const opItem = {
        opId,
        type,
        payload,
      };

      this.pendingOpsQueue.push(opItem);
      if (this.pendingOpsQueue.length >= this.MAX_BATCH_SIZE) {
        this.flushBatches();
      }

      resolve({ ok: true, opId });
    });
  }
}

export const socketService = new SocketService();
