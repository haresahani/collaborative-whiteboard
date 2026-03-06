/**
 * Collab socket hook matching docs/protocol.md.
 * Connects to Socket.IO server, joins board, sends ops/cursor, receives broadcast/snapshot/presence.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { User } from "@/types/whiteboard";
import type {
  OpPayloadData,
  OpBroadcastPayload,
  SnapshotSyncPayload,
  PresenceUpdatePayload,
  AckPayload,
  ErrorPayload,
} from "@/types/protocol";
import { PROTOCOL_VERSION } from "@/types/protocol";
import { elementToOpPayload, elementUpdatesToOpPayload } from "@/lib/ops";
import type { DrawingElement } from "@/types/whiteboard";

const CURSOR_THROTTLE_MS = 50; // ~20 updates/sec
const STROKE_CHUNK_THROTTLE_MS = 80; // ~12 updates/sec
const TRANSFORM_THROTTLE_MS = 100; // ~10 updates/sec during drag during draw

export interface UseCollabSocketOptions {
  url: string;
  boardId: string;
  user: User | null;
  token?: string; // JWT for auth (optional until backend supports)
  onOpBroadcast: (op: OpBroadcastPayload) => void;
  onSnapshotSync: (payload: SnapshotSyncPayload) => void;
  onPresenceUpdate?: (payload: PresenceUpdatePayload) => void;
  onAck?: (payload: AckPayload) => void;
  onExportReady?: (exportId: string, url: string) => void;
  onError?: (code: string, message: string) => void;
}

export interface UseCollabSocketReturn {
  isConnected: boolean;
  error: string | null;
  sendOp: (payload: OpPayloadData) => void;
  sendElement: (element: DrawingElement) => void;
  sendElementTransform: (
    id: string,
    elementType: DrawingElement["type"],
    updates: Partial<DrawingElement>,
  ) => void;
  sendDeleteElement: (id: string, elementType: DrawingElement["type"]) => void;
  sendCursor: (x: number, y: number) => void;
  sendCursorThrottled: (x: number, y: number) => void;
  sendStrokeChunk: (strokeId: string, points: Array<[number, number]>) => void;
}

export function useCollabSocket({
  url,
  boardId,
  user,
  token,
  onOpBroadcast,
  onSnapshotSync,
  onPresenceUpdate,
  onAck,
  onExportReady,
  onError,
}: UseCollabSocketOptions): UseCollabSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const opIdCounterRef = useRef(0);
  const lastCursorSendRef = useRef(0);
  const lastChunkSendRef = useRef(0);
  const lastTransformSendRef = useRef<Record<string, number>>({});

  // Store callbacks in refs to avoid reconnect loop when parent re-renders
  const onOpBroadcastRef = useRef(onOpBroadcast);
  const onSnapshotSyncRef = useRef(onSnapshotSync);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);
  const onAckRef = useRef(onAck);
  const onExportReadyRef = useRef(onExportReady);
  const onErrorRef = useRef(onError);
  onOpBroadcastRef.current = onOpBroadcast;
  onSnapshotSyncRef.current = onSnapshotSync;
  onPresenceUpdateRef.current = onPresenceUpdate;
  onAckRef.current = onAck ?? (() => {});
  onExportReadyRef.current = onExportReady ?? (() => {});
  onErrorRef.current = onError ?? (() => {});

  const nextOpId = useCallback(() => {
    opIdCounterRef.current += 1;
    return `${user?.id ?? "anon"}:${opIdCounterRef.current}`;
  }, [user?.id]);

  useEffect(() => {
    if (!user || !url) return;

    // Socket.IO expects HTTP URL; convert ws:// to http:// if needed
    const socketUrl = url.replace(/^ws:\/\//, "http://");
    const socket = io(socketUrl, {
      query: { boardId, userId: user.id },
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      socket.emit("join", {
        type: "join",
        boardId,
        userId: user.id,
        protocolVersion: PROTOCOL_VERSION,
      } satisfies {
        type: "join";
        boardId: string;
        userId: string;
        protocolVersion: string;
      });
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setError("Disconnected by server");
      }
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    socket.on("op.broadcast", (payload: OpBroadcastPayload) => {
      onOpBroadcastRef.current(payload);
    });

    socket.on("snapshot.sync", (payload: SnapshotSyncPayload) => {
      onSnapshotSyncRef.current(payload);
    });

    socket.on("presence.update", (payload: PresenceUpdatePayload) => {
      onPresenceUpdateRef.current?.(payload);
    });

    socket.on("ack", (payload: AckPayload) => {
      onAckRef.current?.(payload);
    });

    socket.on("export.ready", (payload: { exportId: string; url: string }) => {
      onExportReadyRef.current?.(payload.exportId, payload.url);
    });

    socket.on("error", (payload: ErrorPayload) => {
      onErrorRef.current?.(payload.code, payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, boardId, user?.id, token]);

  const sendOp = useCallback(
    (payload: OpPayloadData) => {
      if (!socketRef.current?.connected || !user) return;
      const opId = nextOpId();
      socketRef.current.emit("op", {
        type: "op",
        boardId,
        opId,
        payload,
      });
    },
    [boardId, user, nextOpId],
  );

  const sendElement = useCallback(
    (element: DrawingElement) => {
      if (!user) return;
      const payload = elementToOpPayload(element, nextOpId(), user.id);
      if (payload) sendOp(payload);
    },
    [user, nextOpId, sendOp],
  );

  const sendElementTransform = useCallback(
    (
      id: string,
      elementType: DrawingElement["type"],
      updates: Partial<DrawingElement>,
    ) => {
      if (!user) return;
      const payload = elementUpdatesToOpPayload(
        id,
        elementType,
        updates,
        user.id,
      );
      if (!payload) return;
      const now = Date.now();
      const last = lastTransformSendRef.current[id] ?? 0;
      if (now - last < TRANSFORM_THROTTLE_MS) return;
      lastTransformSendRef.current[id] = now;
      sendOp(payload);
    },
    [user, sendOp],
  );

  const sendDeleteElement = useCallback(
    (id: string, elementType: DrawingElement["type"]) => {
      if (!user) return;
      const type =
        elementType === "path"
          ? "stroke.delete"
          : elementType === "sticky-note"
            ? "note.delete"
            : ["rectangle", "circle", "line", "text"].includes(elementType)
              ? "shape.delete"
              : null;
      if (!type) return;
      const dataKey =
        type === "stroke.delete"
          ? "strokeId"
          : type === "note.delete"
            ? "noteId"
            : "shapeId";
      sendOp({ type, data: { [dataKey]: id } });
    },
    [user, sendOp],
  );

  const sendCursor = useCallback(
    (x: number, y: number) => {
      if (!socketRef.current?.connected || !user) return;
      socketRef.current.emit("cursor.update", {
        type: "cursor.update",
        boardId,
        userId: user.id,
        x,
        y,
      });
    },
    [boardId, user],
  );

  const sendCursorThrottled = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastCursorSendRef.current < CURSOR_THROTTLE_MS) return;
      lastCursorSendRef.current = now;
      sendCursor(x, y);
    },
    [sendCursor],
  );

  const sendStrokeChunk = useCallback(
    (strokeId: string, points: Array<[number, number]>) => {
      if (!socketRef.current?.connected || !user) return;
      const now = Date.now();
      if (now - lastChunkSendRef.current < STROKE_CHUNK_THROTTLE_MS) return;
      lastChunkSendRef.current = now;
      const opId = nextOpId();
      socketRef.current.emit("op", {
        type: "op",
        boardId,
        opId,
        payload: {
          type: "stroke.chunk",
          data: { strokeId, points },
        },
      });
    },
    [boardId, user, nextOpId],
  );

  return {
    isConnected,
    error,
    sendOp,
    sendElement,
    sendElementTransform,
    sendDeleteElement,
    sendCursor,
    sendCursorThrottled,
    sendStrokeChunk,
  };
}
