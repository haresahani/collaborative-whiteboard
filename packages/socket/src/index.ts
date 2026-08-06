import { initTelemetry } from "infra-utils";
initTelemetry("whiteboard-socket");

async function start() {
  const { PORT } = await import("./config/env");
  const { connectDB } = await import("./config/db");
  const { createSocketServer } = await import("./server");

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
