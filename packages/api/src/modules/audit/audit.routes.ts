import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { getAuditLogs } from "./audit.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", getAuditLogs);

export default router;
