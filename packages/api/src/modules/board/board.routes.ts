import { Router } from "express";
import {
  createBoard,
  getBoard,
  getMyBoards,
  deleteBoard,
} from "./board.controller";
import { appendOperation } from "../operations/oplog.controller";
import { authMiddleware } from "../auth/auth.middleware";

const router: Router = Router();

router.post("/", authMiddleware, createBoard);

router.get("/", authMiddleware, getMyBoards);
router.get("/:id", authMiddleware, getBoard);

router.delete("/:id", authMiddleware, deleteBoard);

router.post("/:id/operations", authMiddleware, appendOperation);

export default router;
