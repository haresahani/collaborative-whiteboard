import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type Redis from "ioredis";
import { CLIENT_ORIGIN } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { registerBoardHandlers } from "./events/board";
import { createRedisAdapterClients } from "./config/redis";

export interface SocketServerOptions {
  pubClient?: Redis;
  subClient?: Redis;
  disableAdapter?: boolean;
  transports?: ("websocket" | "polling")[];
}

export function createSocketServer(options?: SocketServerOptions) {
  const httpServer = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ["GET", "POST"],
    },
    transports: options?.transports ?? ["websocket"],
  });

  let pubClient: Redis | undefined = options?.pubClient;
  let subClient: Redis | undefined = options?.subClient;

  if (!options?.disableAdapter) {
    if (!pubClient || !subClient) {
      const clients = createRedisAdapterClients();
      pubClient = clients.pubClient;
      subClient = clients.subClient;
    }
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    registerBoardHandlers(io, socket);
  });

  return { httpServer, io, pubClient, subClient };
}
