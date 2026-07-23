import { createServer } from "http";
import { Server } from "socket.io";
import { CLIENT_ORIGIN } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { registerBoardHandlers } from "./events/board";

export function createSocketServer() {
  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    registerBoardHandlers(io, socket);
  });

  return { httpServer, io };
}
