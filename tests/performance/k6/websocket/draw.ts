import ws from "k6/ws";
import { sleep } from "k6";
import { ENV } from "../config/environments.ts";
import {
  wsMessagesSent,
  wsDrawBroadcastLatency,
} from "../metrics/websocket.ts";

export function testWSDraw(boardId = "k6-draw-board", strokeCount = 10): void {
  ws.connect(ENV.WS_BASE_URL, {}, function (socket) {
    socket.on("open", () => {
      socket.send(`42${JSON.stringify(["join.board", { boardId }])}`);

      for (let i = 0; i < strokeCount; i++) {
        const start = Date.now();
        const drawFrame = `42${JSON.stringify([
          "op.broadcast",
          {
            boardId,
            opId: `k6-op-${Date.now()}-${i}`,
            type: "stroke.point",
            payload: { x: 100 + i * 5, y: 200 + i * 5 },
          },
        ])}`;
        socket.send(drawFrame);
        wsMessagesSent.add(1);
        wsDrawBroadcastLatency.add(Date.now() - start);
        sleep(0.05);
      }

      socket.close();
    });
  });
}
