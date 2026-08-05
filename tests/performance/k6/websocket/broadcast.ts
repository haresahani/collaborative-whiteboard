import ws from "k6/ws";
import { ENV } from "../config/environments.ts";
import { wsMessagesSent, wsMessagesReceived } from "../metrics/websocket.ts";

export function testWSBroadcast(boardId = "k6-broadcast-board"): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.send(`42${JSON.stringify(["join.board", { boardId }])}`);
      socket.send(`42${JSON.stringify(["op.broadcast", { boardId, opId: "k6-bcast-op", type: "element.create" }])}`);
      wsMessagesSent.add(1);
    });

    socket.on("message", () => {
      wsMessagesReceived.add(1);
      socket.close();
    });
  });
}
