import { createSocketServer } from "./server";
import { PORT } from "./config/env";

const { httpServer } = createSocketServer();

httpServer.listen(PORT, () => {
  console.log(`[socket] Real-time socket server running on port ${PORT}`);
});
