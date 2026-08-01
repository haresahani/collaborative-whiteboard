import mongoose from "mongoose";
import { YjsSnapshot, YjsUpdate, mergeYjsUpdates } from "shared";
import { Board, IBoard } from "./board.model";
import { Snapshot, ISnapshot } from "../snapshot/snapshot.model";
import { Oplog } from "../operations/oplog.model";
import { ApiError } from "../../utils/ApiError";
import { CreateBoardDto } from "./board.validator";

/**
 * Board service — owns all board-related business logic.
 *
 * Controllers delegate here instead of calling Mongoose directly.
 * This makes the logic reusable (WebSocket handlers, CLI, cron jobs)
 * and testable (mock the service, not HTTP objects).
 */

/** The starting state of every new board canvas. */
const EMPTY_CANVAS = Object.freeze({
  strokes: [],
  shapes: [],
  notes: [],
});

interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginatedBoards {
  boards: IBoard[];
  total: number;
  page: number;
  totalPages: number;
}

class BoardService {
  /**
   * Create a new board with an initial empty snapshot.
   *
   * Flow: create board → create snapshot → link snapshot to board.
   */
  async create(ownerId: string, dto: CreateBoardDto): Promise<IBoard> {
    const board = await Board.create({
      ownerId,
      title: dto.title?.trim() || "Untitled Board",
      visibility: dto.visibility || "private",
    });

    const snapshot = await Snapshot.create({
      boardId: board._id,
      opIndex: 0,
      snapshotJson: { ...EMPTY_CANVAS },
    });

    board.lastSnapshotId = snapshot._id;
    await board.save({ validateBeforeSave: false });

    return board;
  }

  /**
   * Find a single board by ID, verifying ownership.
   *
   * Returns 404 (not 403) for boards owned by other users —
   * this prevents resource enumeration attacks.
   */
  async findById(boardId: string, userId: string): Promise<IBoard> {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw ApiError.badRequest("Invalid board ID");
    }

    const board = await Board.findOne({
      _id: boardId,
      ownerId: userId,
    }).lean();

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    return board as IBoard;
  }

  /**
   * List boards owned by a user with offset pagination.
   *
   * The method signature is designed so swapping to cursor-based
   * pagination later requires changing only this method — no
   * controller modifications needed.
   */
  async findByOwner(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedBoards> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [boards, total] = await Promise.all([
      Board.find({ ownerId: userId })
        .select("_id title visibility createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Board.countDocuments({ ownerId: userId }),
    ]);

    return {
      boards: boards as IBoard[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a board and cascade-delete all related data.
   *
   * Removes: board → snapshots → operation log entries.
   * Without cascade, orphaned documents cause storage leaks
   * and phantom query results.
   */
  async remove(boardId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw ApiError.badRequest("Invalid board ID");
    }

    const board = await Board.findOneAndDelete({
      _id: boardId,
      ownerId: userId,
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    // Cascade: remove all related data in parallel
    await Promise.all([
      Snapshot.deleteMany({ boardId }),
      Oplog.deleteMany({ boardId }),
    ]);
  }

  /**
   * Fetch the latest snapshot for a board.
   *
   * Used for:
   * - Initial whiteboard load (client renders from snapshot)
   * - Crash recovery (restore last known state)
   * - Undo history baseline
   */
  async getLatestSnapshot(boardId: string, userId: string): Promise<ISnapshot> {
    // Verify board exists and user has access
    await this.findById(boardId, userId);

    const snapshot = await Snapshot.findOne({ boardId })
      .sort({ opIndex: -1 })
      .lean();

    if (!snapshot) {
      throw ApiError.notFound("No snapshot found for this board");
    }

    return snapshot as ISnapshot;
  }

  async getYjsState(boardId: string, userId: string): Promise<Buffer> {
    if (mongoose.Types.ObjectId.isValid(boardId)) {
      await this.findById(boardId, userId);
    }
    const [snapshotDoc, updates] = await Promise.all([
      YjsSnapshot.findOne({ boardId }).lean(),
      YjsUpdate.find({ boardId }).sort({ lamport: 1 }).lean(),
    ]);

    const updateBuffers: Uint8Array[] = [];
    if (snapshotDoc && snapshotDoc.snapshot) {
      updateBuffers.push(new Uint8Array(snapshotDoc.snapshot));
    }
    for (const u of updates) {
      if (u.update) {
        updateBuffers.push(new Uint8Array(u.update));
      }
    }

    const merged = mergeYjsUpdates(updateBuffers);
    return Buffer.from(merged);
  }
}

export const boardService = new BoardService();
