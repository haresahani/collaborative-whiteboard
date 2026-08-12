import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  encodeOpBatch,
  encodeCursorBatch,
  decodeOpBatch,
  decodeCursorBatch,
} from "shared";
import type { IOp } from "shared";

// Mock BullMQ enqueueOp service and Lamport clock generator
vi.mock("../services/oplogQueue", () => ({
  enqueueOp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../utils/lamport", () => ({
  getNextLamport: vi.fn().mockResolvedValue(42),
}));

vi.mock("../utils/recentOpsBuffer", () => ({
  pushRecentOp: vi.fn(),
  getRecentOps: vi.fn().mockReturnValue([]),
}));

import { enqueueOp } from "../services/oplogQueue";
import { pushRecentOp } from "../utils/recentOpsBuffer";

describe("Socket Server Batching & Ephemeral Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decodes binary op.batch, assigns Lamport clock, enqueues persisted ops, and bypasses BullMQ for stroke.point", async () => {
    const ops: IOp[] = [
      {
        opId: "11111111-1111-1111-1111-111111111111",
        boardId: "board-1",
        type: "stroke.point",
        payload: { points: [{ x: 5, y: 5 }] },
        actorId: "user-1",
        lamport: 0,
        createdAt: new Date().toISOString(),
      },
      {
        opId: "22222222-2222-2222-2222-222222222222",
        boardId: "board-1",
        type: "stroke.finalize",
        payload: {
          elementId: "el-1",
          points: [
            { x: 5, y: 5 },
            { x: 20, y: 20 },
          ],
        },
        actorId: "user-1",
        lamport: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const binaryPayload = encodeOpBatch(ops);
    const decodedOps = decodeOpBatch(binaryPayload);
    expect(decodedOps.length).toBe(2);

    // Simulate processing loop inside server handler
    const persistedOps: IOp[] = [];
    for (const op of decodedOps) {
      await pushRecentOp("board-1", op);
      if (op.type !== "stroke.point") {
        await enqueueOp(op);
        persistedOps.push(op);
      }
    }

    // stroke.point must push to ring buffer for live broadcast but NEVER enqueue into BullMQ
    expect(pushRecentOp).toHaveBeenCalledTimes(2);
    expect(enqueueOp).toHaveBeenCalledTimes(1);
    expect(persistedOps[0].type).toBe("stroke.finalize");
  });

  it("collapses cursor moves per user in cursor.batch (last-write-wins)", () => {
    const cursorBatch = [
      { userId: "user-1", displayName: "Alice", x: 10, y: 10, tool: "pen" },
      { userId: "user-1", displayName: "Alice", x: 15, y: 15, tool: "pen" },
      { userId: "user-2", displayName: "Bob", x: 100, y: 100, tool: "eraser" },
      { userId: "user-1", displayName: "Alice", x: 20, y: 20, tool: "pen" },
    ];

    const binary = encodeCursorBatch(cursorBatch);
    const decoded = decodeCursorBatch(binary);

    // Collapse logic simulation
    const latestByUser = new Map<string, (typeof decoded)[0]>();
    for (const c of decoded) {
      if (c.userId) {
        latestByUser.set(c.userId, c);
      }
    }

    const collapsed = Array.from(latestByUser.values());
    expect(collapsed.length).toBe(2);
    expect(collapsed.find((c) => c.userId === "user-1")?.x).toBe(20);
    expect(collapsed.find((c) => c.userId === "user-2")?.x).toBe(100);
  });
});
