import ws from "k6/ws";
import { ENV } from "../config/environments.ts";

export function testWSDisconnect(): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.close();
    });
  });
}
