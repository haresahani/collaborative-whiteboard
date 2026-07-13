import { Router } from "express";
import { signup, login, getMe } from "./auth.controller";
import { authMiddleware } from "./auth.middleware";
import { validate } from "../../middleware/validate";
import { signupSchema, loginSchema } from "./auth.validator";

const router: Router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, getMe);

export default router;
