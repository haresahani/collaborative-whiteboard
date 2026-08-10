import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../user/user.model";
import { issueBoardJoinToken } from "shared/jwt";
import { sanitizeText } from "shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { boardService } from "./board.service";
import { auditService } from "../audit/audit.service";

/**
 * Board controllers — thin HTTP handlers.
 */

/** POST /api/boards — Create a new board with an initial empty snapshot. */
export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  if (body && typeof body.title === "string") {
    body.title = sanitizeText(body.title);
  }

  const board = await boardService.create(req.user!.id, body);

  void auditService.logEvent({
    userId: req.user!.id,
    action: "BOARD_CREATE",
    resourceId: String(board._id),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { title: board.title },
  });

  ApiResponse.created(res, board);
});

/** GET /api/boards/:id — Fetch a single board by ID. */
export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.findById(req.params.id, req.user!.id);

  void auditService.logEvent({
    userId: req.user!.id,
    action: "BOARD_ACCESS",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  ApiResponse.success(res, board);
});

/** GET /api/boards — List boards owned by the authenticated user (paginated). */
export const getMyBoards = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit as string) || 20),
  );

  const result = await boardService.findByOwner(req.user!.id, { page, limit });
  ApiResponse.success(res, result);
});

/** DELETE /api/boards/:id — Delete a board and cascade-remove related data. */
export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  await boardService.remove(req.params.id, req.user!.id);

  void auditService.logEvent({
    userId: req.user!.id,
    action: "BOARD_DELETE",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  ApiResponse.message(res, "Board deleted");
});

/** GET /api/boards/:id/snapshot — Fetch the latest snapshot for initial canvas load. */
export const getSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await boardService.getLatestSnapshot(
    req.params.id,
    req.user!.id,
  );
  ApiResponse.success(res, snapshot);
});

/** GET /api/boards/:id/join-token — Issue a short-lived board join token for socket auth. */
export const getBoardJoinToken = asyncHandler(
  async (req: Request, res: Response) => {
    const rawUserId = req.user?.id;
    const boardId = req.params.id;

    // Use user ID if authenticated, or generate a guest user ID
    const userId = rawUserId || `guest_${crypto.randomUUID().slice(0, 8)}`;

    let displayName = `Guest ${userId.slice(-4)}`;
    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      const user = await User.findById(rawUserId).select("displayName").lean();
      if ((user as { displayName?: string } | null)?.displayName) {
        displayName = (user as { displayName?: string }).displayName!;
      }
    }

    const token = issueBoardJoinToken(
      { userId, boardId, displayName },
      process.env.JWT_SECRET || "dev-jwt-secret-key-change-in-production",
      "2h",
    );

    void auditService.logEvent({
      userId,
      action: "BOARD_JOIN_TOKEN",
      resourceId: boardId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    ApiResponse.success(res, { token });
  },
);

/** GET /api/boards/:id/yjs-state — Fetch merged Yjs state for initial sticky note CRDT sync. */
export const getYjsState = asyncHandler(async (req: Request, res: Response) => {
  const yjsBuffer = await boardService.getYjsState(req.params.id, req.user!.id);
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(yjsBuffer);
});
