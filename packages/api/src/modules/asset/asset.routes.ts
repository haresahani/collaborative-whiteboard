import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
  completeAssetUpload,
  createAsset,
  failAssetUpload,
  getAssetMetadata,
  resolveAssets,
} from "./asset.controller";

/**
 * Mount under:
 *   /api/boards/:boardId/assets
 *
 * Example:
 *   app.use("/api/boards/:boardId/assets", assetRoutes);
 *
 * This route module is intentionally scaffolded before storage integration, so
 * it is ready for review but should not be mounted in production yet.
 */
const router: Router = Router({ mergeParams: true });

router.post("/", authMiddleware, createAsset);
router.post("/resolve", authMiddleware, resolveAssets);
router.get("/:assetId", authMiddleware, getAssetMetadata);
router.post("/:assetId/complete", authMiddleware, completeAssetUpload);
router.post("/:assetId/fail", authMiddleware, failAssetUpload);

export default router;
