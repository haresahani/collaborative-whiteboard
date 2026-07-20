import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { validateEnv } from "shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV ?? "development";

const envFileMap: Record<string, string> = {
  development: "dev.env",
  production: "prod.env",
  test: "dev.env",
};

const envFile = envFileMap[NODE_ENV] ?? "dev.env";

dotenv.config({
  path: path.resolve(__dirname, "../../../../env", envFile),
});

export const env = validateEnv(process.env);

export const PORT = Number(process.env.SOCKET_PORT ?? 3001);
export const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

// TEMPORARY — verify env is actually loading real values, remove after confirming
console.log("Loaded env:", {
  JWT_SECRET_length: env.JWT_SECRET.length,
  NODE_ENV: env.NODE_ENV,
  PORT,
  CLIENT_ORIGIN,
});
