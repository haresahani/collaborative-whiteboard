/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tryCompact } from "../src/compaction";
import { Oplog, Snapshot } from "shared/models";
import { redisConnection } from "../src/config/redis";
import mongoose from "mongoose";

// Mock ioredis
vi.mock("ioredis", () => {
  return {
    default: class MockRedis {
      private store = new Map<string, string>();
      constructor() {}
      on() {}
      quit() {
        return Promise.resolve();
      }
      set(key: string, value: string, px: string, ttl: number, nx: string) {
        if (nx === "NX" && this.store.has(key)) {
          return Promise.resolve(null);
        }
        this.store.set(key, value);
        return Promise.resolve("OK");
      }
      del(key: string) {
        this.store.delete(key);
        return Promise.resolve(1);
      }
    },
  };
});

// Mock mongoose models
vi.mock("shared/models", async () => {
  const actual = await vi.importActual<any>("shared/models");
  return {
    ...actual,
    Oplog: {
      find: vi.fn(),
    },
    Snapshot: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
  };
});

// Mock board collection
vi.mock("mongoose", async () => {
  const actual = await vi.importActual<any>("mongoose");
  const mockCollection = {
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
  const mockConnection = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: mockConnection,
    },
    connection: mockConnection,
  };
});

describe("Worker Compaction Tests", () => {
  const boardId = "60b8d5f3f9824c18f0ad562a";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COMPACTION_THRESHOLD_OPS = "2"; // set threshold low for easy test trigger
    process.env.COMPACTION_THRESHOLD_TIME_MS = "60000";
  });

  it("should respect Redis lock to avoid concurrent runs", async () => {
    // Force findOne to return null
    (Snapshot.findOne as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    });

    (Oplog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      }),
    });

    // Acquire lock manually first
    await redisConnection.set(`compact:${boardId}`, "1", "PX", 5000, "NX");

    // Invoke tryCompact
    await tryCompact(boardId);

    // Snapshot query should not be called because tryCompact failed to acquire lock
    expect(Snapshot.findOne).not.toHaveBeenCalled();

    // Release lock
    await redisConnection.del(`compact:${boardId}`);
  });

  it("should stop compaction at the first Lamport gap (Out-of-order check)", async () => {
    // 1. Mock latest snapshot as null (starting state, version = 0)
    (Snapshot.findOne as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    });

    // 2. Mock persisted oplogs: Lamport 1, 2, 4, 5 (Lamport 3 is missing due to concurrent delay)
    const mockOplogs = [
      {
        opId: "op-1",
        boardId,
        type: "stroke.commit",
        payload: {
          stroke: { points: [[1, 2]], color: "#000000", width: 2, tool: "pen" },
        },
        actorId: "user-1",
        lamport: 1,
        createdAt: new Date().toISOString(),
      },
      {
        opId: "op-2",
        boardId,
        type: "stroke.commit",
        payload: {
          stroke: { points: [[3, 4]], color: "#000000", width: 2, tool: "pen" },
        },
        actorId: "user-1",
        lamport: 2,
        createdAt: new Date().toISOString(),
      },
      {
        opId: "op-4",
        boardId,
        type: "stroke.commit",
        payload: {
          stroke: { points: [[5, 6]], color: "#000000", width: 2, tool: "pen" },
        },
        actorId: "user-1",
        lamport: 4,
        createdAt: new Date().toISOString(),
      },
      {
        opId: "op-5",
        boardId,
        type: "stroke.commit",
        payload: {
          stroke: { points: [[7, 8]], color: "#000000", width: 2, tool: "pen" },
        },
        actorId: "user-1",
        lamport: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    (Oplog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockOplogs),
      }),
    });

    (Snapshot.findOneAndUpdate as any).mockResolvedValue({
      _id: "new-snapshot-id",
      opIndex: 2,
    });

    await tryCompact(boardId);

    // Assert that the snapshot is created up to version 2 (ignores 4 & 5 due to the gap at 3)
    expect(Snapshot.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(Snapshot.findOneAndUpdate).toHaveBeenCalledWith(
      { boardId, opIndex: 2 },
      expect.any(Object),
      expect.any(Object),
    );

    // Verify it updates lastSnapshotId on board record
    expect(
      mongoose.connection.collection("boards").updateOne,
    ).toHaveBeenCalledWith(
      { _id: expect.any(Object) },
      { $set: { lastSnapshotId: "new-snapshot-id" } },
    );
  });

  it("should compact an oplog containing op.undo into a snapshot preserving soft-deleted tombstone state [FIX 5]", async () => {
    (Snapshot.findOne as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    });

    const mockOplogs = [
      {
        opId: "op-create-x",
        boardId,
        type: "element.create",
        payload: { element: { id: "rect-x", type: "rectangle", x: 10, y: 10 } },
        actorId: "user-1",
        lamport: 1,
        createdAt: new Date().toISOString(),
      },
      {
        opId: "op-undo-x",
        boardId,
        type: "op.undo",
        payload: { targetOpId: "op-create-x", tombstoneId: "rect-x" },
        actorId: "user-1",
        lamport: 2,
        createdAt: new Date().toISOString(),
      },
    ];

    (Oplog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockOplogs),
      }),
    });

    (Snapshot.findOneAndUpdate as any).mockResolvedValue({
      _id: "snapshot-undo-id",
      opIndex: 2,
    });

    await tryCompact(boardId);

    expect(Snapshot.findOneAndUpdate).toHaveBeenCalledWith(
      { boardId, opIndex: 2 },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          snapshotJson: expect.objectContaining({
            shapes: [
              expect.objectContaining({
                id: "rect-x",
                tombstoned: true,
              }),
            ],
          }),
        }),
      }),
      expect.any(Object),
    );
  });
});
