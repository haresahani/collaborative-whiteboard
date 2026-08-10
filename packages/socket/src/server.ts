import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from "http";
import {
  createServer as createHttpsServer,
  type Server as HttpsServer,
} from "https";
import fs from "fs";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type Redis from "ioredis";
import { env, CLIENT_ORIGIN } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { registerBoardHandlers } from "./events/board";
import { createRedisAdapterClients } from "./config/redis";

import {
  getMetricsText,
  activeSocketConnectionsGauge,
  logger,
} from "infra-utils";

export interface SocketServerOptions {
  pubClient?: Redis;
  subClient?: Redis;
  disableAdapter?: boolean;
  transports?: ("websocket" | "polling")[];
}

export function createSocketServer(options?: SocketServerOptions) {
  const requestListener = (
    req: import("http").IncomingMessage,
    res: import("http").ServerResponse,
  ) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "whiteboard-socket",
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    if (req.url === "/live") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "alive",
          service: "whiteboard-socket",
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    if (req.url === "/ready") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ready",
          service: "whiteboard-socket",
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    if (req.url === "/metrics") {
      void getMetricsText()
        .then((metrics: string) => {
          res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
          res.end(metrics);
        })
        .catch((err: unknown) => {
          logger.error({ err }, "[socket] Failed to serve metrics");
          res.writeHead(500);
          res.end("Error fetching metrics");
        });
      return;
    }
  };

  let httpServer: HttpServer | HttpsServer;
  if (
    env.TLS_ENABLED &&
    env.SSL_KEY_PATH &&
    env.SSL_CERT_PATH &&
    fs.existsSync(env.SSL_KEY_PATH) &&
    fs.existsSync(env.SSL_CERT_PATH)
  ) {
    httpServer = createHttpsServer(
      {
        key: fs.readFileSync(env.SSL_KEY_PATH),
        cert: fs.readFileSync(env.SSL_CERT_PATH),
      },
      requestListener,
    );
    logger.info("[socket] HTTPS/WSS server created with TLS enabled");
  } else {
    httpServer = createHttpServer(requestListener);
  }

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: options?.transports ?? ["websocket", "polling"],
  });

  let pubClient: Redis | undefined = options?.pubClient;
  let subClient: Redis | undefined = options?.subClient;

  if (!options?.disableAdapter) {
    try {
      if (!pubClient || !subClient) {
        const clients = createRedisAdapterClients();
        pubClient = clients.pubClient;
        subClient = clients.subClient;
      }
      pubClient.on("error", () => {
        // Silent error handler for offline Redis
      });
      subClient.on("error", () => {
        // Silent error handler for offline Redis
      });
      io.adapter(createAdapter(pubClient, subClient));
    } catch {
      logger.warn(
        "[socket] Redis adapter disabled, using default in-memory room adapter.",
      );
    }
  }

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    activeSocketConnectionsGauge.inc();
    socket.on("disconnect", () => {
      activeSocketConnectionsGauge.dec();
    });
    registerBoardHandlers(io, socket);
  });

  return { httpServer, io, pubClient, subClient };
}
