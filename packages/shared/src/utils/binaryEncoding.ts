import { encode, decode } from "@msgpack/msgpack";
import type { IOp } from "../oplog";
import type { CursorMove } from "../schemas/collab";

/**
 * Serializes arbitrary JavaScript data into a MessagePack Uint8Array buffer.
 */
export function encodeBinaryPayload(data: unknown): Uint8Array {
  return encode(data);
}

/**
 * Deserializes a MessagePack buffer (ArrayBuffer or Uint8Array) into a typed object.
 */
export function decodeBinaryPayload<T = unknown>(
  buffer: ArrayBuffer | Uint8Array,
): T {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return decode(bytes) as T;
}

/**
 * Encodes a list of Ops into a MessagePack binary buffer.
 */
export function encodeOpBatch(ops: IOp[]): Uint8Array {
  return encodeBinaryPayload({ type: "op.batch", ops });
}

/**
 * Decodes a MessagePack binary buffer into a list of Ops.
 */
export function decodeOpBatch(buffer: ArrayBuffer | Uint8Array): IOp[] {
  const payload = decodeBinaryPayload<{ type?: string; ops?: IOp[] }>(buffer);
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload?.ops || [];
}

/**
 * Encodes a batch of cursor moves into a MessagePack binary buffer.
 */
export function encodeCursorBatch(
  cursors: (CursorMove & { userId?: string; displayName?: string })[],
): Uint8Array {
  return encodeBinaryPayload({ type: "cursor.batch", cursors });
}

/**
 * Decodes a MessagePack binary buffer into a batch of cursor moves.
 */
export function decodeCursorBatch(
  buffer: ArrayBuffer | Uint8Array,
): (CursorMove & { userId?: string; displayName?: string })[] {
  const payload = decodeBinaryPayload<{
    type?: string;
    cursors?: (CursorMove & { userId?: string; displayName?: string })[];
  }>(buffer);
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload?.cursors || [];
}
