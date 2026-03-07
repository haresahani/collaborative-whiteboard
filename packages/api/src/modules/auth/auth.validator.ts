import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  passowrd: z.string(),
});
