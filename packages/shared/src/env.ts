import { z } from "zod";

export const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  REDIS_URL: z
    .string()
    .url("REDIS_URL must be a valid URL")
    .default("redis://127.0.0.1:6379"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv): ValidatedEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}
