import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("MongoDb Connected!");
  } catch (error) {
    console.error("MongoDb connection failed:", error);
    process.exit(1);
  }
}
