import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({
  path: path.resolve(__dirname, "../env/dev.env"),
});

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_jwt_key_for_local_development_environment_32chars_min";

const BOARD_JOIN_AUDIENCE = "board-join";
const SOCKET_URL = "http://localhost:3001";
const BOARD_ID = "local-board";

interface SimUser {
  userId: string;
  displayName: string;
  accent: string;
  color: string;
}

const COLLABORATORS: SimUser[] = [
  {
    userId: "simulated_user_alice_11111111",
    displayName: "Alice Carter",
    accent: "#ec4899", // pink
    color: "#ec4899",
  },
  {
    userId: "simulated_user_bob_22222222",
    displayName: "Bob Jenkins",
    accent: "#10b981", // emerald
    color: "#10b981",
  },
  {
    userId: "simulated_user_charlie_333333",
    displayName: "Charlie Smith",
    accent: "#f59e0b", // amber
    color: "#f59e0b",
  },
  {
    userId: "simulated_user_dave_44444444",
    displayName: "Dave Miller",
    accent: "#3b82f6", // blue
    color: "#3b82f6",
  },
  {
    userId: "simulated_user_eve_55555555",
    displayName: "Eve Watson",
    accent: "#8b5cf6", // violet
    color: "#8b5cf6",
  },
];

function issueBoardJoinToken(payload: {
  userId: string;
  boardId: string;
  displayName: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    audience: BOARD_JOIN_AUDIENCE,
    expiresIn: "2h",
  });
}

function startSimulation() {
  console.log(`\n🚀 Starting collaborator simulation for board: "${BOARD_ID}"...`);
  console.log(`🔌 Connecting to socket server at ${SOCKET_URL}\n`);

  const sockets = COLLABORATORS.map((user, index) => {
    const token = issueBoardJoinToken({
      userId: user.userId,
      boardId: BOARD_ID,
      displayName: user.displayName,
    });

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log(`✅ [${user.displayName}] Connected! Joining board...`);
      socket.emit("join.board", { boardId: BOARD_ID });

      // Periodically emit heartbeat to maintain presence active
      setInterval(() => {
        if (socket.connected) {
          socket.emit("presence.heartbeat");
        }
      }, 5000);

      // Periodically simulate mouse cursor movement in orbits
      let angle = (index * (2 * Math.PI)) / COLLABORATORS.length;
      setInterval(() => {
        if (socket.connected) {
          angle += 0.05;
          const radiusX = 180 + index * 40;
          const radiusY = 120 + index * 25;
          const centerX = 600;
          const centerY = 400;

          const x = centerX + Math.cos(angle) * radiusX;
          const y = centerY + Math.sin(angle) * radiusY;

          socket.emit("cursor.move", {
            x,
            y,
            tool: "select",
            previewElement: null,
            erasedIds: [],
          });
        }
      }, 100);
    });

    socket.on("connect_error", (err) => {
      console.error(`❌ [${user.displayName}] Connection error:`, err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [${user.displayName}] Disconnected:`, reason);
    });

    return socket;
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping simulation. Disconnecting users...");
    sockets.forEach((s) => s.disconnect());
    process.exit(0);
  });
}

startSimulation();
