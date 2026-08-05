import ws from "k6/ws";
import { sleep } from "k6";
import { ENV } from "../config/environments.ts";
import { wsMessagesSent, wsCursorBroadcastLatency } from "../metrics/websocket.ts";

export function testWSCursor(boardId = "k6-cursor-board", moves = 15): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.send(`42${JSON.stringify(["join.board", { boardId }])}`);

      for (let i = 0; i < moves; i++) {
        const start = Date.now();
        const cursorFrame = `42${JSON.stringify([
          "cursor.move",
          {
            x: Math.floor(Math.random() * 1920),
            y: Math.floor(Math.random() * 1080),
            tool: "pen",
          },
        ])}`;
        socket.send(cursorFrame);
        wsMessagesSent.add(1);
        wsCursorBroadcastLatency.add(Date.now() - start);
        sleep(0.1);
      }

      socket.close();
    });
  });
}
