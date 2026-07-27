import type { IOp } from "shared";

const buffers = new Map<string, IOp[]>();
const MAX_BUFFER_SIZE = 200;

export function pushRecentOp(boardId: string, op: IOp): void {
  let buf = buffers.get(boardId);
  if (!buf) {
    buf = [];
    buffers.set(boardId, buf);
  }
  buf.push(op);
  if (buf.length > MAX_BUFFER_SIZE) {
    buf.shift(); // Evict oldest (ring-buffer style)
  }
}

export function getRecentOps(boardId: string, afterLamport: number): IOp[] {
  const buf = buffers.get(boardId) || [];
  return buf.filter((op) => op.lamport > afterLamport);
}

export function clearRecentOpsBuffer(boardId?: string): void {
  if (boardId) {
    buffers.delete(boardId);
  } else {
    buffers.clear();
  }
}
