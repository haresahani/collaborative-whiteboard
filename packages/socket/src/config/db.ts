import mongoose from "mongoose";

const DEFAULT_DEV_MONGO_URL =
  "mongodb+srv://haresahani:eswqwifRfDs91dQ5@whiteboard-collab.vtsbfwk.mongodb.net/collaborative-whiteboard?appName=whiteboard-collab";

export async function connectDB(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL || DEFAULT_DEV_MONGO_URL;
  try {
    await mongoose.connect(mongoUrl);
    console.log("[socket] MongoDB connected successfully");
  } catch (error) {
    console.error("[socket] MongoDB connection failed:", error);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
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
