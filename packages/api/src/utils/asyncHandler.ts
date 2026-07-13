import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the Express error-handling middleware.
 *
 * Without this, every async controller needs its own try/catch block.
 * With this wrapper, controllers can simply throw or let promises reject —
 * errors flow to the centralized `errorHandler` automatically.
 *
 * @example
 * export const getBoard = asyncHandler(async (req, res) => {
 *   const board = await boardService.findById(req.params.id, req.user!.id);
 *   ApiResponse.success(res, board);
 * });
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
