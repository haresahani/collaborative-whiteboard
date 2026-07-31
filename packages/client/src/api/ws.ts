/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";
import { getBoardJoinToken } from "./auth";
import type {
  Element,
  StrokeElement,
} from "../features/whiteboard/models/element";
import { useBoardStore } from "../features/whiteboard/store/boardStore";
import {
  deserializeSnapshot,
  type SnapshotElementGroups,
} from "../features/whiteboard/utils/snapshotStorage";
import { applyOperation, replayOperations, type ISharedElement } from "@shared/oplog";
import {
  useCollaborationStore,
  type ChatMessage,
} from "../features/whiteboard/store/collaborationStore";
import { getUserAccent } from "@shared/utils/accent";
import { chatSendSchema } from "@shared/schemas/collab";

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

  async connect(boardId: string) {
    if (this.socket && this.currentBoardId === boardId) {
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    try {
      const joinToken = await getBoardJoinToken(boardId);
      const claims = decodeJwt(joinToken);
      if (claims) {
        this.myUserId = claims.userId;
      }

      this.currentBoardId = boardId;

      this.socket = io({
        auth: {
          token: joinToken,
        },
      });

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
      });

      // Handle the initial board sync payload (snapshot + oplogs tail)
      this.socket.on(
        "board.init",
        (data: {
          snapshot?: { snapshotJson?: SnapshotElementGroups };
          oplogs: unknown[];
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
        },
      );

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

      // Handle legacy/specific stroke commits (mapping to standard op for the reducer)
      this.socket.on(
        "op.stroke.broadcast",
        (payload: StrokeBroadcastPayload) => {
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
        console.log("[socket] cursor.broadcast received:", {
          userId: data.userId,
          displayName: data.displayName,
          hasPreview: !!data.previewElement,
          previewElement: data.previewElement,
          erasedCount: data.erasedIds?.length || 0,
          tool: data.tool,
        });
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
        useCollaborationStore.getState().setChatMessages(messages);
      });

      this.socket.on("chat.broadcast", (message: ChatMessage) => {
        useCollaborationStore.getState().addChatMessage(message);
      });

      this.socket.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err.message);
      });
    } catch (err) {
      console.error("[Socket] Failed to connect:", err);
    }
  }

  disconnect() {
    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
      this.myUserId = null;
      useCollaborationStore.getState().clearCursors();
    }
  }

  getUserId(): string | null {
    return this.myUserId;
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
  emitCursor(x: number, y: number, previewElement?: any, erasedIds?: string[], tool?: string) {
    if (!this.socket || !this.socket.connected) return;
    console.log("[socket] emitting cursor.move:", { x, y, hasPreview: !!previewElement, previewElement, erasedCount: erasedIds?.length || 0, tool });
    this.socket.emit("cursor.move", { x, y, previewElement, erasedIds, tool });
  }

  private throttledCursorEmit = this.throttle((x: number, y: number, previewElement?: any, erasedIds?: string[], tool?: string) => {
    this.emitCursor(x, y, previewElement, erasedIds, tool);
  }, 50);

  sendCursorMove(x: number, y: number, previewElement?: any, erasedIds?: string[], tool?: string) {
    this.throttledCursorEmit(x, y, previewElement, erasedIds, tool);
  }

  sendChatMessage(message: string): { ok: boolean; error?: string } {
    if (!this.socket || !this.socket.connected) {
      return { ok: false, error: "Socket is disconnected" };
    }

    const parsed = chatSendSchema.safeParse({ message });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.errors[0]?.message || "Invalid message format",
      };
    }

    this.socket.emit("chat.send", { message: parsed.data.message });
    return { ok: true };
  }

  emitOp(type: "element.create" | "element.update" | "element.delete", payload: Record<string, unknown>) {
    if (!this.socket || !this.socket.connected) {
      console.warn("[Socket] Cannot emit op: socket is disconnected");
      return;
    }

    const opId = crypto.randomUUID();

    const payloadWithId = {
      opId,
      type,
      payload,
    };

    console.log("[Socket] Emitting op.commit:", payloadWithId);
    this.socket.emit("op.commit", payloadWithId, (ack?: { ok: boolean; error?: string }) => {
      if (!ack?.ok) {
        console.error("[Socket] Op commit ack failed:", ack?.error);
      } else {
        console.log("[Socket] Op commit ack success:", ack);
      }
    });
  }

  // Self-contained throttle helper to avoid external dependencies/types issues
  private throttle<T extends (...args: any[]) => void>(fn: T, limit: number): T {
    let inThrottle = false;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        window.setTimeout(() => (inThrottle = false), limit);
      }
    } as unknown as T;
  }
}

export const socketService = new SocketService();
