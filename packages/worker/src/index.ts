import { connectDB, disconnectDB } from "./config/db";
import { redisConnection } from "./config/redis";
import { oplogWorker } from "./oplogWorker";

async function main() {
  console.log("[worker] Starting background worker...");

  // 1. Connect to MongoDB
  await connectDB();

  console.log("[worker] Running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("[worker] Initialization error:", err);
  process.exit(1);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}. Starting graceful shutdown...`);

  try {
    // 1. Close worker to stop accepting new jobs
    await oplogWorker.close();
    console.log("[worker] BullMQ worker closed.");

    // 2. Close redis connection
    await redisConnection.quit();
    console.log("[worker] Redis connection closed.");

    // 3. Disconnect from database
    await disconnectDB();

    console.log("[worker] Graceful shutdown complete. Exiting.");
    process.exit(0);
  } catch (error) {
    console.error("[worker] Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
