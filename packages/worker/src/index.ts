import { initTelemetry } from "infra-utils";
initTelemetry("whiteboard-worker");

import { createServer, type Server } from "http";
import { Queue } from "bullmq";
import { getMetricsText, queueLengthGauge, logger } from "infra-utils";

let metricsServer: Server | null = null;
let metricsInterval: NodeJS.Timeout | null = null;
let readerQueue: Queue | null = null;
interface Closable {
  close: () => Promise<void>;
}
interface Quittable {
  quit: () => Promise<unknown>;
}

let oplogWorkerRef: Closable | null = null;
let redisConnectionRef: Quittable | null = null;
let disconnectDBRef: (() => Promise<void>) | null = null;

async function main() {
  logger.info("[worker] Starting background worker...");
  const { connectDB, disconnectDB } = await import("./config/db");
  const { redisConnection } = await import("./config/redis");
  const { oplogWorker } = await import("./oplogWorker");
  oplogWorkerRef = oplogWorker;
  redisConnectionRef = redisConnection;
  disconnectDBRef = disconnectDB;

  // 1. Connect to MongoDB
  await connectDB();

  // 2. Queue metrics reader
  readerQueue = new Queue("oplog-queue", { connection: redisConnection });

  metricsInterval = setInterval(() => {
    void (async () => {
      if (!readerQueue) return;
      try {
        const waiting = await readerQueue.getWaitingCount();
        const active = await readerQueue.getActiveCount();
        queueLengthGauge.set(
          { queue: "oplog-queue", state: "waiting" },
          waiting,
        );
        queueLengthGauge.set({ queue: "oplog-queue", state: "active" }, active);
      } catch (err) {
        logger.error({ err }, "[worker] Failed to update queue metrics");
      }
    })();
  }, 5000);

  // 3. Prometheus metrics HTTP server (port 9090)
  const port = process.env.WORKER_METRICS_PORT
    ? parseInt(process.env.WORKER_METRICS_PORT, 10)
    : 9090;
  metricsServer = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "whiteboard-worker",
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
          service: "whiteboard-worker",
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
          service: "whiteboard-worker",
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
          logger.error({ err }, "[worker] Failed to serve metrics");
          res.writeHead(500);
          res.end("Error fetching metrics");
        });
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
  });

  metricsServer.listen(port, () => {
    logger.info(`[worker] Metrics server listening on port ${port}`);
  });

  logger.info("[worker] Running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  logger.error({ err }, "[worker] Initialization error");
  process.exit(1);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`[worker] Received ${signal}. Starting graceful shutdown...`);

  try {
    if (metricsInterval) {
      clearInterval(metricsInterval);
    }
    if (metricsServer) {
      metricsServer.close();
    }
    if (readerQueue) {
      await readerQueue.close();
    }

    // 1. Close worker to stop accepting new jobs
    if (oplogWorkerRef) {
      await oplogWorkerRef.close();
      logger.info("[worker] BullMQ worker closed.");
    }

    // 2. Close redis connection
    if (redisConnectionRef) {
      await redisConnectionRef.quit();
      logger.info("[worker] Redis connection closed.");
    }

    // 3. Disconnect from database
    if (disconnectDBRef) {
      await disconnectDBRef();
    }

    logger.info("[worker] Graceful shutdown complete. Exiting.");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "[worker] Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
