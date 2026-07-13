import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { boardService } from "./board.service";

/**
 * Board controllers — thin HTTP handlers.
 *
 * Each controller follows the same 3-step pattern:
 *   1. Read request (params, query, body)
 *   2. Delegate to service
 *   3. Return standardised ApiResponse
 *
 * No try/catch, no Mongoose imports, no business logic.
 */

/** POST /api/boards — Create a new board with an initial empty snapshot. */
export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.create(req.user!.id, req.body);
  ApiResponse.created(res, board);
});

/** GET /api/boards/:id — Fetch a single board by ID. */
export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.findById(req.params.id, req.user!.id);
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
