import ws from "k6/ws";
import { sleep } from "k6";
import { ENV } from "../config/environments.ts";
import { wsReconnections } from "../metrics/websocket.ts";

export function testWSReconnect(boardId = "k6-reconnect-board"): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.send(`42${JSON.stringify(["join.board", { boardId }])}`);
      socket.close();
    });
  });

  sleep(0.5);

  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.send(`42${JSON.stringify(["join.board", { boardId }])}`);
      wsReconnections.add(1);
      socket.close();
    });
  });
}
