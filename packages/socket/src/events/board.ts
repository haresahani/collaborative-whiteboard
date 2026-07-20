// packages/socket/src/events/board.ts
import type { Server, Socket } from "socket.io";
import { z } from "zod";

const StrokeCommitSchema = z.object({
  opId: z.string().uuid(),
  stroke: z.object({
    points: z
      .array(z.tuple([z.number(), z.number()]))
      .min(1)
      .max(5000),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    width: z.number().min(1).max(64),
    tool: z.enum(["pen", "eraser"]),
  }),
});

type StrokeCommitAck = (response: {
  ok: boolean;
  opId?: string;
  error?: string;
}) => void;

function roomName(boardId: string): string {
  return `board:${boardId}`;
}

export function registerBoardHandlers(io: Server, socket: Socket) {
  const { userId, boardId } = socket.data as {
    userId: string;
    boardId: string;
  };

  void socket.join(roomName(boardId));
  console.log(`[socket] user ${userId} joined room ${roomName(boardId)}`);

  socket.on("op.stroke.commit", (raw: unknown, ack?: StrokeCommitAck) => {
    const parsed = StrokeCommitSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn(
        `[socket] invalid stroke payload from ${userId}:`,
        parsed.error.issues,
      );
      void ack?.({ ok: false, error: "INVALID_PAYLOAD" });
      return;
    }

    const { opId, stroke } = parsed.data;

    console.log(
      `[socket] stroke commit opId=${opId} board=${boardId} user=${userId}`,
    );

    socket.to(roomName(boardId)).emit("op.stroke.broadcast", {
      boardId,
      opId,
      userId,
      stroke,
      serverTs: Date.now(),
    });

    void ack?.({ ok: true, opId });
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[socket] user ${userId} disconnected from board ${boardId}: ${reason}`,
    );
  });
}
