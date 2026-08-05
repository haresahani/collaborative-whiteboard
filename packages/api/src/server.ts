import express, { type Express } from "express";
import assetRoutes from "./modules/asset/asset.routes";
import authRoutes from "./modules/auth/auth.routes";
import boardRoutes from "./modules/board/board.routes";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/boards/:boardId/assets", assetRoutes);
app.use("/api/boards", boardRoutes);

app.get("/", (req, res) => {
  res.send("Express server is active");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Centralized error handler — must be registered AFTER all routes
app.use(errorHandler);

export default app;
