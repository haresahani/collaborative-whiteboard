// packages/socket/src/middleware/auth.ts
import type { Socket } from "socket.io";
import { verifyBoardJoinToken } from "shared";
import { env } from "../config/env";

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("UNAUTHENTICATED: no token provided"));
    }

    const { userId, boardId } = verifyBoardJoinToken(token, env.JWT_SECRET);

    socket.data.userId = userId;
    socket.data.boardId = boardId;

    next();
  } catch {
    next(new Error("UNAUTHENTICATED: invalid or expired token"));
  }
}
