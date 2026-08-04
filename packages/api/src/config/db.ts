import mongoose from "mongoose";

const DEFAULT_DEV_MONGO_URL =
  "mongodb+srv://haresahani:L6pnAMuyVnIpFFT3@whiteboard-collab.vtsbfwk.mongodb.net/collaborative-whiteboard?appName=whiteboard-collab";

export async function connectDB(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL || DEFAULT_DEV_MONGO_URL;
  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDb Connected!");
  } catch (error) {
    console.error("MongoDb connection failed:", error);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
}
