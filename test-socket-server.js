import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (data) => {
    console.log("Join:", data);
    socket.join(data.boardId);
    socket.emit("snapshot.sync", {
      boardId: data.boardId,
      snapshot: { data: { elements: [] } },
      ops: [],
    });
  });

  socket.on("op", (data) => console.log("Op:", data.type, data.opId));
  socket.on("cursor.update", (data) => console.log("Cursor:", data.userId));
});

server.listen(3001, () => console.log("Test socket on http://localhost:3001"));
