import { z } from "zod";

export const envSchema = z.object({
  JWT_SECRET: z.preprocess(
    (val) => {
      if (!val || typeof val !== "string" || val.length < 32) {
        if (process.env.NODE_ENV === "test") {
          return "mock_jwt_secret_for_tests_only_32_chars_long";
        }
        if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
          return "default_development_jwt_secret_must_be_at_least_32_characters_long";
        }
      }
      return val;
    },
    z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  ),
  REDIS_URL: z
    .string()
    .url("REDIS_URL must be a valid URL")
    .default("redis://127.0.0.1:6379"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .string()
    .url("OTEL_EXPORTER_OTLP_ENDPOINT must be a valid URL")
    .default("http://jaeger:4318/v1/traces"),
  SERVICE_NAME: z.string().default("whiteboard-service"),
  TLS_ENABLED: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(false),
  SSL_KEY_PATH: z.string().optional(),
  SSL_CERT_PATH: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv): ValidatedEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    if (raw.NODE_ENV === "test") {
      throw new Error(
        `Invalid environment configuration: ${JSON.stringify(result.error.format())}`,
      );
    }
    process.exit(1);
  }
  return result.data;
}
