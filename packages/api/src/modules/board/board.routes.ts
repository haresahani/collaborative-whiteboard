import { Router } from "express";
import {
  createBoard,
  getBoard,
  getMyBoards,
  deleteBoard,
  getSnapshot,
} from "./board.controller";
import { appendOperation } from "../operations/oplog.controller";
import { authMiddleware } from "../auth/auth.middleware";
import { validate } from "../../middleware/validate";
import { createBoardSchema } from "./board.validator";

const router: Router = Router();

// ── Board CRUD ────────────────────────────────────────────────────────
router.post("/", authMiddleware, validate(createBoardSchema), createBoard);
router.get("/", authMiddleware, getMyBoards);
router.get("/:id", authMiddleware, getBoard);
router.delete("/:id", authMiddleware, deleteBoard);

// ── Snapshot ──────────────────────────────────────────────────────────
router.get("/:id/snapshot", authMiddleware, getSnapshot);

// ── Operations (oplog) ────────────────────────────────────────────────
router.post("/:id/operations", authMiddleware, appendOperation);

export default router;
