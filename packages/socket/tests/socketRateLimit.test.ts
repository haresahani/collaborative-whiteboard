import { describe, it, expect } from "vitest";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { checkSocketRateLimit } from "../src/middleware/rateLimiter";

describe("Socket Throttling Unit Tests", () => {
  it("should trigger rate limit when socket exceeds max operations", async () => {
    const testLimiter = new RateLimiterMemory({
      points: 2,
      duration: 60,
    });

    let protocolErrorEmitted = false;
    const mockSocket = {
      id: "socket-123",
      data: { userId: "user-1" },
      emit: (event: string, payload: unknown) => {
        if (event === "protocol:error") {
          protocolErrorEmitted = true;
        }
      },
    } as unknown as import("socket.io").Socket;

    const pass1 = await checkSocketRateLimit(
      testLimiter,
      mockSocket,
      "op.commit",
    );
    expect(pass1).toBe(true);

    const pass2 = await checkSocketRateLimit(
      testLimiter,
      mockSocket,
      "op.commit",
    );
    expect(pass2).toBe(true);

    const pass3 = await checkSocketRateLimit(
      testLimiter,
      mockSocket,
      "op.commit",
    );
    expect(pass3).toBe(false);
    expect(protocolErrorEmitted).toBe(true);
  });
});
