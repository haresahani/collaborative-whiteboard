import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const resendCodeSchema = z.object({
  email: z.string().email(),
});

export const googleAuthSchema = z.object({
  credential: z.string({
    required_error: "Google credential token is required",
  }),
});
