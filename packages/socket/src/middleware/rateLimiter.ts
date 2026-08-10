import type { Socket } from "socket.io";
import { RateLimiterMemory } from "rate-limiter-flexible";

const isTest = process.env.NODE_ENV === "test";

export const socketOpRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 10000 : 100, // 100 ops per second per socket
  duration: 1,
});

export const socketChatRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 1000 : 5, // 5 chat messages per 5 seconds per socket
  duration: 5,
});

export const socketJoinRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 1000 : 10, // 10 board joins per minute per socket
  duration: 60,
});

export async function checkSocketRateLimit(
  limiter: RateLimiterMemory,
  socket: Socket,
  actionName: string,
): Promise<boolean> {
  try {
    const key = socket.id || socket.data?.userId || "unknown_socket";
    await limiter.consume(key);
    return true;
  } catch {
    socket.emit("protocol:error", {
      code: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded for ${actionName}. Please slow down.`,
    });
    return false;
  }
}
