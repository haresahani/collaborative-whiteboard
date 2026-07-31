import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../env/dev.env") });

if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
  throw new Error(
    "clear-chats.ts can only be run in development or test environments!",
  );
}

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("MONGO_URL not found in env!");
    process.exit(1);
  }
  console.log("Connecting to:", mongoUrl);
  await mongoose.connect(mongoUrl);
  const collections = mongoose.connection.collections;
  if (collections["chats"]) {
    await collections["chats"].deleteMany({});
    console.log("Deleted all messages in chats collection successfully!");
  } else {
    console.log("Chats collection does not exist.");
  }
  await mongoose.disconnect();
}

main().catch(console.error);
