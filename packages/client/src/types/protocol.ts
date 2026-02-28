/**
 * Protocol types matching docs/protocol.md
 * Real-time event schemas for client-server communication.
 */

export const PROTOCOL_VERSION = "1.0.0";

// --- Client → Server ---

export interface JoinPayload {
  type: "join";
  boardId: string;
  userId: string;
  protocolVersion?: string;
}

export interface OpPayload {
  type: "op";
  boardId: string;
  opId: string; // "<userId>:<localCounter>"
  payload: OpPayloadData;
}

export interface OpPayloadData {
  type:
    | "stroke.add"
    | "stroke.delete"
    | "stroke.chunk" // Optional: live streaming during draw
    | "shape.add"
    | "shape.transform"
    | "shape.delete"
    | "note.add"
    | "note.update"
    | "note.delete"
    | "text.add"
    | "text.update";
  data: Record<string, unknown>;
}

export interface CursorUpdatePayload {
  type: "cursor.update";
  boardId: string;
  userId: string;
  x: number;
  y: number;
}

// --- Server → Client ---

export interface OpBroadcastPayload {
  type: "op.broadcast";
  boardId: string;
  opId: string;
  serverSeq: number;
  payload: OpPayloadData;
}

export interface AckPayload {
  type: "ack";
  opId: string;
  serverSeq: number;
}

export interface PresenceUpdatePayload {
  type: "presence.update";
  boardId: string;
  users: Array<{
    userId: string;
    x: number;
    y: number;
    color?: string;
  }>;
}

export interface SnapshotSyncPayload {
  type: "snapshot.sync";
  boardId: string;
  snapshot: {
    snapshotId: string;
    data: SnapshotData;
  };
  ops: Array<{
    opId: string;
    serverSeq: number;
    payload: OpPayloadData;
  }>;
}

export interface SnapshotData {
  elements?: Array<Record<string, unknown>>;
  version?: number;
}

export interface ExportReadyPayload {
  type: "export.ready";
  boardId: string;
  exportId: string;
  url: string;
}

export interface ErrorPayload {
  type: "error";
  code: string;
  message: string;
}
