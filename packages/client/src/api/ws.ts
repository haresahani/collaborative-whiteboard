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

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;

  async connect(boardId: string) {
    if (this.socket && this.currentBoardId === boardId) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      const joinToken = await getBoardJoinToken(boardId);

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

      this.socket.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err.message);
      });
    } catch (err) {
      console.error("[Socket] Failed to connect:", err);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
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
}

export const socketService = new SocketService();
