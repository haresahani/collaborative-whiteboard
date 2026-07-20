import { io, Socket } from "socket.io-client";
import { getBoardJoinToken } from "./auth";
import type { StrokeElement } from "../features/whiteboard/models/element";

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

  async connect(
    boardId: string,
    onRemoteStroke: (stroke: RemoteStrokeData) => void,
  ) {
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
      });

      this.socket.on(
        "op.stroke.broadcast",
        (payload: StrokeBroadcastPayload) => {
          console.log("[Socket] Received remote stroke:", payload);
          onRemoteStroke(payload.stroke);
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

    const opId = crypto.randomUUID();

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
