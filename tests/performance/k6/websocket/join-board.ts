import ws from "k6/ws";
import { ENV } from "../config/environments.js";
import { wsMessagesSent } from "../metrics/websocket.js";

export function testWSJoinBoard(boardId = "k6-test-board"): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      const joinFrame = `42${JSON.stringify(["join.board", { boardId }])}`;
      socket.send(joinFrame);
      wsMessagesSent.add(1);
      socket.close();
    });
  });
}
