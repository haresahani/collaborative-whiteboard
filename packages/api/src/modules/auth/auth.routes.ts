import { Router } from "express";
import {
  signup,
  login,
  googleAuth,
  verifyEmail,
  resendCode,
  getMe,
} from "./auth.controller";
import { authMiddleware } from "./auth.middleware";
import { validate } from "../../middleware/validate";
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendCodeSchema,
} from "./auth.validator";

const router: Router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/resend-code", validate(resendCodeSchema), resendCode);
router.get("/me", authMiddleware, getMe);

export default router;
