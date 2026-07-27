import { createSocketServer } from "./server";
import { PORT } from "./config/env";
import { connectDB } from "./config/db";

async function start() {
  await connectDB();
  const { httpServer } = createSocketServer();
  httpServer.listen(PORT, () => {
    console.log(`[socket] Real-time socket server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[socket] Failed to start:", err);
  process.exit(1);
});
