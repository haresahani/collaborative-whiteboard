import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("[socket] MONGO_URL environment variable is required!");
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUrl);
    console.log("[socket] MongoDB connected successfully");
  } catch (error) {
    console.error("[socket] MongoDB connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("[socket] MongoDB disconnected successfully");
  } catch (error) {
    console.error("[socket] MongoDB disconnect failed:", error);
  }
}
