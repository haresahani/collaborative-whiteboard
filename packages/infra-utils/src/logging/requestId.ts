import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existingId = req.headers["x-request-id"];
  const requestId =
    typeof existingId === "string" && existingId.trim().length > 0
      ? existingId
      : crypto.randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}
