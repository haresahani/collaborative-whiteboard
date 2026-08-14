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

export const MONGO_URL =
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV === "test" ? "mongodb://127.0.0.1:27017/collaborative-whiteboard" : "");

if (!MONGO_URL) {
  console.error("[worker] MONGO_URL environment variable is required!");
  process.exit(1);
}
