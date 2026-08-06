import express, { type Express } from "express";
import assetRoutes from "./modules/asset/asset.routes";
import authRoutes from "./modules/auth/auth.routes";
import boardRoutes from "./modules/board/board.routes";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

import {
  logger,
  httpLoggerMiddleware,
  requestIdMiddleware,
  getMetricsText,
  httpRequestsCounter,
  httpRequestDurationHistogram,
  httpRequestSizeBytesHistogram,
  httpResponseSizeBytesHistogram,
  httpInflightRequestsGauge,
  healthHandler,
  liveHandler,
  readyHandler,
} from "infra-utils";

const app: Express = express();

app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware({ serviceName: "whiteboard-api" }));

// Metrics collection middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  httpInflightRequestsGauge.inc({ service: "whiteboard-api" });

  const reqSize = parseInt(req.headers["content-length"] || "0", 10);
  if (reqSize > 0) {
    const route = req.route ? req.route.path : req.path;
    httpRequestSizeBytesHistogram.observe(
      { method: req.method, route },
      reqSize,
    );
  }

  res.on("finish", () => {
    httpInflightRequestsGauge.dec({ service: "whiteboard-api" });
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const status = res.statusCode.toString();

    httpRequestsCounter.inc({
      method: req.method,
      route,
      status,
      service: "whiteboard-api",
    });
    httpRequestDurationHistogram.observe(
      { method: req.method, route, status, service: "whiteboard-api" },
      duration,
    );

    const resSize = parseInt(
      (res.getHeader("content-length") as string) || "0",
      10,
    );
    if (resSize > 0) {
      httpResponseSizeBytesHistogram.observe(
        { method: req.method, route },
        resSize,
      );
    }
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/boards/:boardId/assets", assetRoutes);
app.use("/api/boards", boardRoutes);

app.get("/", (req, res) => {
  res.send("Express server is active");
});

app.get("/health", healthHandler("whiteboard-api"));
app.get("/api/health", healthHandler("whiteboard-api"));
app.get("/ready", readyHandler({ serviceName: "whiteboard-api" }));
app.get("/live", liveHandler("whiteboard-api"));

app.get("/metrics", async (req, res) => {
  try {
    const metrics = await getMetricsText();
    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(metrics);
  } catch (err) {
    res.status(500).send("Error fetching metrics");
  }
});

// Centralized error handler — must be registered AFTER all routes
app.use(errorHandler);

export default app;
