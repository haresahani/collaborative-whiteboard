import dotenv from "dotenv";
import path from "path";
import app from "./server";
import { connectDB } from "./config/db";

dotenv.config({
  path: path.resolve(process.cwd(), "../../env/dev.env"),
});

const PORT = process.env.PORT || 1111;

async function startServer(): Promise<void> {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
  }
}

void startServer();
