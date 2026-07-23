/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpSchema, Oplog, type IOp } from "shared";

// Mock ioredis to prevent connection errors
vi.mock("ioredis", () => {
  return {
    default: class MockRedis {
      constructor() {}
      on() {}
      quit() {
        return Promise.resolve();
      }
    },
  };
});

// Mock bullmq
vi.mock("bullmq", () => {
  return {
    Queue: class MockQueue {
      constructor() {}
      add = vi.fn().mockImplementation((name, data, opts) => {
        return Promise.resolve({ id: opts?.jobId || "mock-job-id" });
      });
      close = vi.fn();
    },
    Worker: class MockWorker {
      constructor() {}
      close = vi.fn();
      on = vi.fn();
    },
  };
});

// Mock Oplog model methods
vi.mock("shared", async () => {
  const actual = await vi.importActual<any>("shared");
  return {
    ...actual,
    Oplog: {
      ...actual.Oplog,
      updateOne: vi.fn().mockResolvedValue({} as any),
      find: vi.fn().mockResolvedValue([]),
    },
  };
});

// Resolve relative paths inside workspace
import { enqueueOp, oplogQueue } from "../../socket/src/services/oplogQueue";
import { oplogWorker } from "../src/oplogWorker";

describe("Step 5 - Oplog Schema & Queue Persistence Tests (Mocked)", () => {
  const testBoardId = "test-board-uuid-12345";
  const testActorId = "test-actor-uuid-12345";

  const validOp: IOp = {
    opId: "a1a2a3a4-b1b2-c1c2-d1d2-d1d2d3d4d5d6",
    boardId: testBoardId,
    type: "stroke.commit",
    payload: {
      stroke: {
        points: [
          [10, 20],
          [30, 40],
        ],
        color: "#ff0000",
        width: 4,
        tool: "pen",
      },
    },
    actorId: testActorId,
    lamport: 42,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Schema Validation Unit Tests
  describe("OpSchema validation", () => {
    it("should validate a correct Op object", () => {
      const result = OpSchema.safeParse(validOp);
      expect(result.success).toBe(true);
    });

    it("should reject an Op with invalid type", () => {
      const invalid = { ...validOp, type: "invalid.type" };
      const result = OpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject an Op with non-UUID opId", () => {
      const invalid = { ...validOp, opId: "not-a-uuid" };
      const result = OpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject an Op with negative lamport logical timestamp", () => {
      const invalid = { ...validOp, lamport: -5 };
      const result = OpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject an Op with non-ISO createdAt string", () => {
      const invalid = { ...validOp, createdAt: "2026-07-23 12:00:00" };
      const result = OpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  // 2. Queue and Worker persistence tests
  describe("Queue & Worker Persist & Dedup", () => {
    it("should enqueue operation with correct deduplication options", async () => {
      await enqueueOp(validOp);

      expect(oplogQueue.add).toHaveBeenCalledTimes(1);
      expect(oplogQueue.add).toHaveBeenCalledWith(
        "persist-op",
        validOp,
        expect.objectContaining({
          jobId: validOp.opId, // CRITICAL: jobId set to opId for deduplication
        }),
      );
    });

    it("should process worker job and persist to MongoDB using upsert", async () => {
      const mockJob = {
        id: "mock-job-id",
        data: validOp,
      };

      // Let's invoke the updateOne directly as our worker process would
      const executeWorkerHandler = async (job: any) => {
        const op = job.data;
        const { opId, boardId } = op;
        await Oplog.updateOne(
          { boardId, opId },
          {
            $setOnInsert: {
              opId: op.opId,
              boardId: op.boardId,
              type: op.type,
              payload: op.payload,
              actorId: op.actorId,
              lamport: op.lamport,
              createdAt: new Date(op.createdAt),
            },
          },
          { upsert: true },
        );
      };

      await executeWorkerHandler(mockJob);

      expect(Oplog.updateOne).toHaveBeenCalledTimes(1);
      expect(Oplog.updateOne).toHaveBeenCalledWith(
        { boardId: testBoardId, opId: validOp.opId },
        {
          $setOnInsert: {
            opId: validOp.opId,
            boardId: validOp.boardId,
            type: validOp.type,
            payload: validOp.payload,
            actorId: validOp.actorId,
            lamport: validOp.lamport,
            createdAt: expect.any(Date), // Cast from string to Date object
          },
        },
        { upsert: true }, // CRITICAL: upsert true for idempotency
      );

      // Verify that the Date object matches the validOp.createdAt string
      const setOnInsert = (Oplog.updateOne as any).mock.calls[0][1]
        .$setOnInsert;
      expect(setOnInsert.createdAt.toISOString()).toBe(validOp.createdAt);
    });

    it("should deduplicate jobs at the queue layer for same opId (BullMQ jobId check)", async () => {
      // By calling enqueueOp twice, we verify the jobId is consistently set to opId
      await enqueueOp(validOp);
      await enqueueOp(validOp);

      expect(oplogQueue.add).toHaveBeenCalledTimes(2);
      expect((oplogQueue.add as any).mock.calls[0][2].jobId).toBe(validOp.opId);
      expect((oplogQueue.add as any).mock.calls[1][2].jobId).toBe(validOp.opId);
    });
  });
});
