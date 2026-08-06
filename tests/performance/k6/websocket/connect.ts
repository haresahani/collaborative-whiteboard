import ws from "k6/ws";
import { check } from "k6";
import { ENV } from "../config/environments.ts";
import { wsConnectLatency } from "../metrics/websocket.ts";

export function testWSConnect(
  onConnected?: (socket: ws.Socket) => void,
): boolean {
  const start = Date.now();
  let connected = false;

  const res = ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      connected = true;
      wsConnectLatency.add(Date.now() - start);
      if (onConnected) onConnected(socket);
      socket.close();
    });
  });

  check(res, { "ws handshake 101": (r) => r && r.status === 101 });
  return connected;
}
