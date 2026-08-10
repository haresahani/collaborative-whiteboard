import mongoose from "mongoose";
import { MONGO_URL } from "./env";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("[worker] MongoDB connected successfully");
  } catch (error) {
    console.error("[worker] MongoDB connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("[worker] MongoDB disconnected successfully");
  } catch (error) {
    console.error("[worker] MongoDB disconnect failed:", error);
  }
}
