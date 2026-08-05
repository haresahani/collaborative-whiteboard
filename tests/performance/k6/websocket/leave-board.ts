import ws from "k6/ws";
import { ENV } from "../config/environments.ts";
import { wsMessagesSent } from "../metrics/websocket.ts";

export function testWSLeaveBoard(boardId = "k6-test-board"): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      const leaveFrame = `42${JSON.stringify(["leave.board", { boardId }])}`;
      socket.send(leaveFrame);
      wsMessagesSent.add(1);
      socket.close();
    });
  });
}
