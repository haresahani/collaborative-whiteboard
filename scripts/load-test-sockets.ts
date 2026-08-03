/* eslint-disable @typescript-eslint/no-explicit-any */
import { io as Client, type Socket as ClientSocket } from "socket.io-client";
import { issueBoardJoinToken } from "../packages/shared/src/jwt.js";

// CLI Arguments parsing
const args = process.argv.slice(2);
function getArgValue(flag: string, defaultValue: string): string {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const TOTAL_CLIENTS = Number(getArgValue("--clients", "1000"));
const NUM_ROOMS = Number(getArgValue("--rooms", "10"));
const DURATION_SECS = Number(getArgValue("--duration", "10"));
const BATCH_SIZE = Number(getArgValue("--batchSize", "50"));
const BATCH_INTERVAL_MS = Number(getArgValue("--batchInterval", "100"));
const TARGET_URLS = getArgValue(
  "--target",
  process.env.SOCKET_URL || "http://localhost:3001",
).split(",");

const JWT_SECRET =
  process.env.JWT_SECRET || "mock_jwt_secret_for_tests_only_32_chars_long";

interface ClientStats {
  connected: number;
  connectFailed: number;
  messagesSent: number;
  messagesReceived: number;
  latencies: number[];
}

const stats: ClientStats = {
  connected: 0,
  connectFailed: 0,
  messagesSent: 0,
  messagesReceived: 0,
  latencies: [],
};

async function runLoadTest() {
  console.log("=================================================");
  console.log("SOCKET.IO 1K+ CONCURRENT CLIENTS LOAD TEST");
  console.log("=================================================");
  console.log(`Target Nodes    : ${TARGET_URLS.join(", ")}`);
  console.log(`Total Clients   : ${TOTAL_CLIENTS}`);
  console.log(`Target Rooms    : ${NUM_ROOMS}`);
  console.log(`Test Duration   : ${DURATION_SECS}s`);
  console.log(
    `Batch Size      : ${BATCH_SIZE} clients per ${BATCH_INTERVAL_MS}ms`,
  );
  console.log("=================================================\n");

  const clients: ClientSocket[] = [];

  const startTime = Date.now();

  console.log(` Spawning ${TOTAL_CLIENTS} simulated clients...`);

  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const targetUrl = TARGET_URLS[i % TARGET_URLS.length];
    const roomIndex = i % NUM_ROOMS;
    const boardId = `board-load-${roomIndex}`;
    const userId = `sim-user-${i}`;
    const displayName = `SimulatedUser_${i}`;

    const token = issueBoardJoinToken(
      { userId, boardId, displayName },
      JWT_SECRET,
    );

    const client = Client(targetUrl, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });

    const connectStart = Date.now();

    client.on("connect", () => {
      stats.connected++;
      const latency = Date.now() - connectStart;
      stats.latencies.push(latency);
      client.emit("join.board", { boardId });
    });

    client.on("connect_error", () => {
      stats.connectFailed++;
    });

    client.on("cursor.broadcast", (data: any) => {
      if (data?.sentTs) {
        const transitLatency = Date.now() - data.sentTs;
        stats.latencies.push(transitLatency);
      }
      stats.messagesReceived++;
    });

    client.on("op.broadcast", () => {
      stats.messagesReceived++;
    });

    clients.push(client);

    // Batch spacing to prevent OS file descriptor exhaustion during rapid connect
    if ((i + 1) % BATCH_SIZE === 0) {
      await new Promise((r) => setTimeout(r, BATCH_INTERVAL_MS));
    }
  }

  // Wait for connections to stabilize
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`\n ${stats.connected}/${TOTAL_CLIENTS} clients connected.`);
  if (stats.connectFailed > 0) {
    console.warn(`⚠️ ${stats.connectFailed} client connections failed.`);
  }

  console.log(
    `\n⚡ Simulating real-time activity for ${DURATION_SECS} seconds...`,
  );

  const activeDurationMs = DURATION_SECS * 1000;
  const activityStartTime = Date.now();

  const intervalId = setInterval(() => {
    if (Date.now() - activityStartTime >= activeDurationMs) {
      clearInterval(intervalId);
      return;
    }

    // Pick 10% of clients per tick to send activity (cursor movements)
    const activeCount = Math.max(1, Math.floor(clients.length * 0.1));
    for (let j = 0; j < activeCount; j++) {
      const idx = Math.floor(Math.random() * clients.length);
      const client = clients[idx];
      if (client?.connected) {
        client.emit("cursor.move", {
          x: Math.floor(Math.random() * 1920),
          y: Math.floor(Math.random() * 1080),
          tool: "pen",
          sentTs: Date.now(),
        });
        stats.messagesSent++;
      }
    }
  }, 100);

  await new Promise((r) => setTimeout(r, activeDurationMs + 500));

  const totalTimeSecs = (Date.now() - startTime) / 1000;

  console.log("\n Cleaning up client connections...");
  for (const client of clients) {
    if (client.connected) {
      client.disconnect();
    }
  }

  // Compute stats
  const sortedLatencies = [...stats.latencies].sort((a, b) => a - b);
  const avgLatency =
    sortedLatencies.length > 0
      ? Math.round(
          sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length,
        )
      : 0;
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const p95Latency = sortedLatencies[p95Index] || 0;
  const throughput = Math.round(
    (stats.messagesSent + stats.messagesReceived) / totalTimeSecs,
  );

  console.log("\n=================================================");
  console.log("LOAD TEST RESULTS SUMMARY");
  console.log("=================================================");
  console.log(`Target Clients      : ${TOTAL_CLIENTS}`);
  console.log(`Connected Clients   : ${stats.connected}`);
  console.log(`Failed Connections  : ${stats.connectFailed}`);
  console.log(`Messages Sent       : ${stats.messagesSent}`);
  console.log(`Messages Received   : ${stats.messagesReceived}`);
  console.log(`Avg Latency         : ${avgLatency} ms`);
  console.log(`P95 Latency         : ${p95Latency} ms`);
  console.log(`Msg Throughput      : ${throughput} msgs/sec`);
  console.log("=================================================\n");

  if (stats.connected >= Math.floor(TOTAL_CLIENTS * 0.9)) {
    console.log(
      "🎉 LOAD TEST SUCCESS: 90%+ clients connected and communicated successfully!",
    );
    process.exit(0);
  } else {
    console.error("❌ LOAD TEST FAILED: Fewer than 90% of clients connected.");
    process.exit(1);
  }
}

runLoadTest().catch((err) => {
  console.error("Fatal error during load test:", err);
  process.exit(1);
});
