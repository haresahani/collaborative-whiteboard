/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createBoardSchema } from "../src/modules/board/board.validator";

// ---------------------------------------------------------------------------
// Mock setup — isolate from real MongoDB, same pattern as auth.test.ts
//
// We mock every external dependency so tests run instantly in CI
// without infrastructure. Each mock is controllable per-test.
// ---------------------------------------------------------------------------

// Mock the Board model
vi.mock("../src/modules/board/board.model", () => ({
  Board: {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    findOneAndDelete: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

// Mock the Snapshot model
vi.mock("../src/modules/snapshot/snapshot.model", () => ({
  Snapshot: {
    create: vi.fn(),
    findOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

// Mock the Oplog model
vi.mock("../src/modules/operations/oplog.model", () => ({
  Oplog: {
    deleteMany: vi.fn(),
  },
}));

// Mock the User model (required by auth routes imported by server.ts)
vi.mock("../src/modules/user/user.model", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(() => ({
      select: vi.fn(),
    })),
  },
}));

// Mock bcrypt (pulled in by auth controller)
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_123"),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken — control token verification for auth middleware
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_jwt_token"),
    verify: vi.fn(),
  },
}));

// Mock mongoose for ObjectId validation
vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    default: {
      ...(actual as Record<string, unknown>),
      Types: {
        ObjectId: {
          isValid: vi.fn(),
        },
      },
    },
  };
});

process.env.JWT_SECRET = "test-secret-key";

// Import mocked modules for per-test control
import { Board } from "../src/modules/board/board.model";
import { Snapshot } from "../src/modules/snapshot/snapshot.model";
import { Oplog } from "../src/modules/operations/oplog.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Import the Express app AFTER mocks are registered
import app from "../src/server";

// ---------------------------------------------------------------------------
// Helper: set up auth for protected routes
// ---------------------------------------------------------------------------
const MOCK_USER_ID = "507f1f77bcf86cd799439011";

function authenticateAs(userId: string = MOCK_USER_ID) {
  vi.mocked(jwt.verify).mockReturnValue({ userId } as never);
}

function authHeader() {
  return ["Authorization", "Bearer valid-test-token"] as const;
}

// ---------------------------------------------------------------------------
// PART 1: Validation Schema Tests (Pure Unit Tests)
// ---------------------------------------------------------------------------

describe("Board Validation Schemas", () => {
  describe("createBoardSchema", () => {
    it("accepts valid input with title and visibility", () => {
      const result = createBoardSchema.safeParse({
        title: "My Board",
        visibility: "public",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty body (all fields are optional)", () => {
      const result = createBoardSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts body with only title", () => {
      const result = createBoardSchema.safeParse({ title: "Quick Sketch" });
      expect(result.success).toBe(true);
    });

    it("rejects title longer than 100 characters", () => {
      const result = createBoardSchema.safeParse({
        title: "x".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("100");
      }
    });

    it("rejects invalid visibility value", () => {
      const result = createBoardSchema.safeParse({
        visibility: "secret",
      });
      expect(result.success).toBe(false);
    });

    it("trims whitespace from title", () => {
      const result = createBoardSchema.safeParse({
        title: "  My Board  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("My Board");
      }
    });
  });
});

// ---------------------------------------------------------------------------
// PART 2: API Endpoint Tests (Integration Tests via Supertest)
// ---------------------------------------------------------------------------

describe("Board API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: ObjectId validation passes
    vi.mocked(mongoose.Types.ObjectId.isValid).mockReturnValue(true);
  });

  // =========================================================================
  // POST /api/boards
  // =========================================================================
  describe("POST /api/boards", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).post("/api/boards").send({});
      expect(res.status).toBe(401);
    });

    it("returns 201 and creates board with default title when none provided", async () => {
      authenticateAs();

      const mockBoard = {
        _id: "board-id-1",
        ownerId: MOCK_USER_ID,
        title: "Untitled Board",
        visibility: "private",
        lastSnapshotId: undefined,
        save: vi.fn().mockResolvedValue(undefined),
      };

      const mockSnapshot = {
        _id: "snapshot-id-1",
        boardId: "board-id-1",
        opIndex: 0,
        snapshotJson: { strokes: [], shapes: [], notes: [] },
      };

      vi.mocked(Board.create).mockResolvedValueOnce(mockBoard as never);
      vi.mocked(Snapshot.create).mockResolvedValueOnce(mockSnapshot as never);

      const res = await request(app)
        .post("/api/boards")
        .set(...authHeader())
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Untitled Board");
      expect(res.body.data.visibility).toBe("private");
    });

    it("returns 201 and creates board with custom title and visibility", async () => {
      authenticateAs();

      const mockBoard = {
        _id: "board-id-2",
        ownerId: MOCK_USER_ID,
        title: "Design Sprint",
        visibility: "public",
        lastSnapshotId: undefined,
        save: vi.fn().mockResolvedValue(undefined),
      };

      const mockSnapshot = {
        _id: "snapshot-id-2",
        boardId: "board-id-2",
        opIndex: 0,
        snapshotJson: { strokes: [], shapes: [], notes: [] },
      };

      vi.mocked(Board.create).mockResolvedValueOnce(mockBoard as never);
      vi.mocked(Snapshot.create).mockResolvedValueOnce(mockSnapshot as never);

      const res = await request(app)
        .post("/api/boards")
        .set(...authHeader())
        .send({ title: "Design Sprint", visibility: "public" });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Design Sprint");
      expect(res.body.data.visibility).toBe("public");
    });

    it("creates an initial empty snapshot when board is created", async () => {
      authenticateAs();

      const mockBoard = {
        _id: "board-id-3",
        ownerId: MOCK_USER_ID,
        title: "Test",
        visibility: "private",
        lastSnapshotId: undefined,
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(Board.create).mockResolvedValueOnce(mockBoard as never);
      vi.mocked(Snapshot.create).mockResolvedValueOnce({
        _id: "snap-id",
        boardId: "board-id-3",
        opIndex: 0,
        snapshotJson: { strokes: [], shapes: [], notes: [] },
      } as never);

      await request(app)
        .post("/api/boards")
        .set(...authHeader())
        .send({ title: "Test" });

      // Verify Snapshot.create was called with the correct empty canvas
      expect(Snapshot.create).toHaveBeenCalledWith({
        boardId: "board-id-3",
        opIndex: 0,
        snapshotJson: { strokes: [], shapes: [], notes: [] },
      });
    });

    it("returns 400 when title exceeds 100 characters", async () => {
      authenticateAs();

      const res = await request(app)
        .post("/api/boards")
        .set(...authHeader())
        .send({ title: "x".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when visibility is invalid", async () => {
      authenticateAs();

      const res = await request(app)
        .post("/api/boards")
        .set(...authHeader())
        .send({ visibility: "secret" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });
  });

  // =========================================================================
  // GET /api/boards (list my boards)
  // =========================================================================
  describe("GET /api/boards", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/boards");
      expect(res.status).toBe(401);
    });

    it("returns 200 with paginated board list", async () => {
      authenticateAs();

      const mockBoards = [
        {
          _id: "board-1",
          title: "Board One",
          visibility: "private",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "board-2",
          title: "Board Two",
          visibility: "public",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the chained query: find().select().sort().skip().limit().lean()
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBoards),
      };

      vi.mocked(Board.find).mockReturnValueOnce(mockQuery as never);
      vi.mocked(Board.countDocuments).mockResolvedValueOnce(2);

      const res = await request(app)
        .get("/api/boards")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.boards).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.totalPages).toBe(1);
    });

    it("returns empty list when user has no boards", async () => {
      authenticateAs();

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(Board.find).mockReturnValueOnce(mockQuery as never);
      vi.mocked(Board.countDocuments).mockResolvedValueOnce(0);

      const res = await request(app)
        .get("/api/boards")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.boards).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.totalPages).toBe(0);
    });

    it("respects page and limit query params", async () => {
      authenticateAs();

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(Board.find).mockReturnValueOnce(mockQuery as never);
      vi.mocked(Board.countDocuments).mockResolvedValueOnce(25);

      const res = await request(app)
        .get("/api/boards?page=2&limit=5")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.totalPages).toBe(5); // ceil(25/5) = 5
      expect(mockQuery.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // GET /api/boards/:id (single board)
  // =========================================================================
  describe("GET /api/boards/:id", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/boards/some-id");
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid ObjectId format", async () => {
      authenticateAs();
      vi.mocked(mongoose.Types.ObjectId.isValid).mockReturnValueOnce(false);

      const res = await request(app)
        .get("/api/boards/not-a-valid-id")
        .set(...authHeader());

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid board ID");
    });

    it("returns 404 when board does not exist", async () => {
      authenticateAs();

      const mockQuery = {
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockQuery as never);

      const res = await request(app)
        .get("/api/boards/507f1f77bcf86cd799439012")
        .set(...authHeader());

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Board not found");
    });

    it("returns 404 for boards owned by another user (no info leak)", async () => {
      authenticateAs();

      // findOne with ownerId filter returns null — board exists but not yours
      const mockQuery = {
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockQuery as never);

      const res = await request(app)
        .get("/api/boards/507f1f77bcf86cd799439099")
        .set(...authHeader());

      // Returns 404, NOT 403 — prevents resource enumeration
      expect(res.status).toBe(404);
    });

    it("returns 200 with board data when found", async () => {
      authenticateAs();

      const mockBoard = {
        _id: "board-id-1",
        ownerId: MOCK_USER_ID,
        title: "Test Board",
        visibility: "private",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockQuery = {
        lean: vi.fn().mockResolvedValue(mockBoard),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockQuery as never);

      const res = await request(app)
        .get("/api/boards/board-id-1")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Test Board");
    });
  });

  // =========================================================================
  // GET /api/boards/:id/snapshot
  // =========================================================================
  describe("GET /api/boards/:id/snapshot", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/boards/some-id/snapshot");
      expect(res.status).toBe(401);
    });

    it("returns 404 when board does not exist", async () => {
      authenticateAs();

      // findById check inside getLatestSnapshot — board not found
      const mockQuery = {
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockQuery as never);

      const res = await request(app)
        .get("/api/boards/507f1f77bcf86cd799439012/snapshot")
        .set(...authHeader());

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Board not found");
    });

    it("returns 200 with latest snapshot data", async () => {
      authenticateAs();

      // First: findById verifies board ownership
      const mockBoardQuery = {
        lean: vi.fn().mockResolvedValue({
          _id: "board-id-1",
          ownerId: MOCK_USER_ID,
          title: "Test",
        }),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockBoardQuery as never);

      // Second: find latest snapshot
      const mockSnapshot = {
        _id: "snapshot-id-1",
        boardId: "board-id-1",
        opIndex: 5,
        snapshotJson: {
          strokes: [{ id: "s1", points: [0, 0, 10, 10] }],
          shapes: [],
          notes: [],
        },
        createdAt: new Date().toISOString(),
      };

      const mockSnapshotQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSnapshot),
      };
      vi.mocked(Snapshot.findOne).mockReturnValueOnce(
        mockSnapshotQuery as never,
      );

      const res = await request(app)
        .get("/api/boards/board-id-1/snapshot")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.snapshotJson).toEqual({
        strokes: [{ id: "s1", points: [0, 0, 10, 10] }],
        shapes: [],
        notes: [],
      });
      expect(res.body.data.opIndex).toBe(5);
    });

    it("returns the snapshot with highest opIndex (latest)", async () => {
      authenticateAs();

      const mockBoardQuery = {
        lean: vi.fn().mockResolvedValue({
          _id: "board-id-1",
          ownerId: MOCK_USER_ID,
        }),
      };
      vi.mocked(Board.findOne).mockReturnValueOnce(mockBoardQuery as never);

      const mockSnapshotQuery = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: "snap-latest",
          boardId: "board-id-1",
          opIndex: 10,
          snapshotJson: { strokes: [], shapes: [], notes: [] },
        }),
      };
      vi.mocked(Snapshot.findOne).mockReturnValueOnce(
        mockSnapshotQuery as never,
      );

      await request(app)
        .get("/api/boards/board-id-1/snapshot")
        .set(...authHeader());

      // Verify sort was called with { opIndex: -1 } for descending order
      expect(mockSnapshotQuery.sort).toHaveBeenCalledWith({ opIndex: -1 });
    });
  });

  // =========================================================================
  // DELETE /api/boards/:id
  // =========================================================================
  describe("DELETE /api/boards/:id", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).delete("/api/boards/some-id");
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid ObjectId format", async () => {
      authenticateAs();
      vi.mocked(mongoose.Types.ObjectId.isValid).mockReturnValueOnce(false);

      const res = await request(app)
        .delete("/api/boards/not-valid")
        .set(...authHeader());

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid board ID");
    });

    it("returns 404 when board does not exist", async () => {
      authenticateAs();
      vi.mocked(Board.findOneAndDelete).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete("/api/boards/507f1f77bcf86cd799439012")
        .set(...authHeader());

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Board not found");
    });

    it("returns 200 and deletes board successfully", async () => {
      authenticateAs();

      vi.mocked(Board.findOneAndDelete).mockResolvedValueOnce({
        _id: "board-id-1",
        ownerId: MOCK_USER_ID,
      } as never);

      vi.mocked(Snapshot.deleteMany).mockResolvedValueOnce({
        deletedCount: 1,
      } as never);
      vi.mocked(Oplog.deleteMany).mockResolvedValueOnce({
        deletedCount: 5,
      } as never);

      const res = await request(app)
        .delete("/api/boards/board-id-1")
        .set(...authHeader());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Board deleted");
    });

    it("cascade-deletes snapshots and oplogs when board is deleted", async () => {
      authenticateAs();

      vi.mocked(Board.findOneAndDelete).mockResolvedValueOnce({
        _id: "board-id-1",
        ownerId: MOCK_USER_ID,
      } as never);

      vi.mocked(Snapshot.deleteMany).mockResolvedValueOnce({
        deletedCount: 3,
      } as never);
      vi.mocked(Oplog.deleteMany).mockResolvedValueOnce({
        deletedCount: 15,
      } as never);

      await request(app)
        .delete("/api/boards/board-id-1")
        .set(...authHeader());

      // Verify cascade: both Snapshot and Oplog deleteMany called with boardId
      expect(Snapshot.deleteMany).toHaveBeenCalledWith({
        boardId: "board-id-1",
      });
      expect(Oplog.deleteMany).toHaveBeenCalledWith({
        boardId: "board-id-1",
      });
    });
  });
});
