import { Router } from "express";
import { signup, login, getMe } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router: Router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
