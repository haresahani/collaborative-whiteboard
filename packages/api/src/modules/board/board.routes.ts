import { Router } from "express";
import {
  createBoard,
  getBoard,
  getMyBoards,
  deleteBoard,
  getSnapshot,
  getBoardJoinToken,
  getYjsState,
} from "./board.controller";
import { appendOperation } from "../operations/oplog.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../auth/auth.middleware";
import { validate } from "../../middleware/validate";
import { createBoardSchema } from "./board.validator";

const router: Router = Router();

// Board CRUD
router.post("/", authMiddleware, validate(createBoardSchema), createBoard);
router.get("/", authMiddleware, getMyBoards);
router.get("/:id", optionalAuthMiddleware, getBoard);
router.delete("/:id", authMiddleware, deleteBoard);

// Realtime Join Token
router.get("/:id/join-token", optionalAuthMiddleware, getBoardJoinToken);

// Snapshot & Yjs State
router.get("/:id/snapshot", optionalAuthMiddleware, getSnapshot);
router.get("/:id/yjs-state", optionalAuthMiddleware, getYjsState);

// Operations (oplog)
router.post("/:id/operations", authMiddleware, appendOperation);

export default router;
