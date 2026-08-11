/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerBoardHandlers } from "../src/events/board";
import { Oplog, Snapshot } from "shared/models";
import {
  pushRecentOp,
  clearRecentOpsBuffer,
} from "../src/utils/recentOpsBuffer";

// Mock ioredis
vi.mock("ioredis", () => {
  const store = new Map<string, Array<{ score: number; member: string }>>();
  return {
    default: class MockRedis {
      constructor() {}
      on() {}
      quit() {
        return Promise.resolve();
      }
      incr() {
        return Promise.resolve(1);
      }
      set() {
        return Promise.resolve("OK");
      }
      zadd(key: string, score: number, member: string) {
        let items = store.get(key);
        if (!items) {
          items = [];
          store.set(key, items);
        }
        items.push({ score, member });
        items.sort((a, b) => a.score - b.score);
        return Promise.resolve(1);
      }
      zremrangebyrank() {
        return Promise.resolve(0);
      }
      zrangebyscore(key: string, min: string | number) {
        const items = store.get(key) || [];
        const numMin =
          typeof min === "string" ? parseFloat(min.replace("(", "")) : min;
        const result = items
          .filter((item) => item.score > numMin)
          .map((item) => item.member);
        return Promise.resolve(result);
      }
      expire() {
        return Promise.resolve(1);
      }
      del(key: string) {
        store.delete(key);
        return Promise.resolve(1);
      }
      keys() {
        return Promise.resolve(Array.from(store.keys()));
      }
    },
  };
});

// Mock bullmq
vi.mock("bullmq", () => {
  return {
    Queue: class MockQueue {
      constructor() {}
      add = vi.fn().mockResolvedValue({});
    },
  };
});

vi.mock("../src/services/presence", () => {
  return {
    PresenceService: {
      updatePresence: vi.fn().mockResolvedValue(undefined),
      removePresence: vi.fn().mockResolvedValue(undefined),
      getActiveUsers: vi.fn().mockResolvedValue([]),
      getPresenceKey: vi.fn().mockReturnValue("mock-presence-key"),
    },
  };
});

vi.mock("../src/models/chat", () => {
  return {
    Chat: {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
  };
});

// Mock shared models
vi.mock("shared/models", async () => {
  const actual = await vi.importActual<any>("shared/models");
  return {
    ...actual,
    Oplog: {
      find: vi.fn(),
      updateOne: vi.fn(),
    },
    Snapshot: {
      findOne: vi.fn(),
    },
  };
});

describe("Socket Server Join Flow Tests", () => {
  let socketListeners: Record<string, (...args: any[]) => any> = {};
  let mockSocket: any;
  let mockIo: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearRecentOpsBuffer();
    socketListeners = {};

    mockSocket = {
      data: {
        userId: "user-123",
        boardId: "board-123",
      },
      join: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
      on: vi.fn().mockImplementation((event, callback) => {
        socketListeners[event] = callback;
      }),
    };

    mockIo = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };

    registerBoardHandlers(mockIo, mockSocket);
  });

  it("should reject and disconnect if requested boardId doesn't match JWT claim", async () => {
    const joinHandler = socketListeners["join.board"];
    expect(joinHandler).toBeDefined();

    await joinHandler({ boardId: "unauthorized-board" });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "protocol:error",
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("should succeed if requested boardId matches JWT claim, join room first, and return snapshot + merged oplogs", async () => {
    const joinHandler = socketListeners["join.board"];

    // Mock Snapshot query
    (Snapshot.findOne as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          opIndex: 10,
          snapshotJson: {
            strokes: [{ id: "stroke-1", type: "stroke" }],
            shapes: [],
            notes: [],
          },
        }),
      }),
    });

    // Mock MongoDB Oplogs (persisted ops)
    const dbOplog = {
      opId: "db-op-uuid",
      boardId: "board-123",
      type: "element.create",
      payload: { element: { id: "el-1", type: "rectangle" } },
      actorId: "user-456",
      lamport: 11,
      createdAt: new Date().toISOString(),
    };
    (Oplog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([dbOplog]),
      }),
    });

    // Mock Recent Ops Buffer (unpersisted ops in transition - race check)
    const bufferedOplog = {
      opId: "buffer-op-uuid",
      boardId: "board-123",
      type: "stroke.commit",
      payload: { stroke: { points: [[0, 0]] } },
      actorId: "user-789",
      lamport: 12,
      createdAt: new Date().toISOString(),
    };
    await pushRecentOp("board-123", bufferedOplog);

    await joinHandler({ boardId: "board-123" });

    // Assert Socket joins the room first
    expect(mockSocket.join).toHaveBeenCalledWith("board:board-123");

    // Assert board.init includes both DB and buffered oplogs
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "board.init",
      expect.objectContaining({
        snapshot: {
          version: 10,
          snapshotJson: {
            strokes: [{ id: "stroke-1", type: "stroke" }],
            shapes: [],
            notes: [],
          },
        },
        oplogs: expect.arrayContaining([
          expect.objectContaining({ opId: "db-op-uuid" }),
          expect.objectContaining({ opId: "buffer-op-uuid" }),
        ]),
      }),
    );
  });
});
