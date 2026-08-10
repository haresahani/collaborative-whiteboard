/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Define the mock inside vi.mock so it's fully self-contained and hoisted correctly.
vi.mock("ioredis", () => {
  class MockRedisStore {
    store: Record<string, Map<string, number>> = {};
    expires: Record<string, number> = {};

    zadd(key: string, score: number, member: string) {
      if (!this.store[key]) {
        this.store[key] = new Map();
      }
      this.store[key].set(member, score);
      return Promise.resolve(1);
    }

    expire(key: string, seconds: number) {
      this.expires[key] = seconds;
      return Promise.resolve(1);
    }

    zremrangebyscore(key: string, min: string | number, max: string | number) {
      const minVal = min === "-inf" ? -Infinity : Number(min);
      const maxVal = max === "+inf" ? Infinity : Number(max);

      if (!this.store[key]) return Promise.resolve(0);

      let removed = 0;
      for (const [member, score] of this.store[key].entries()) {
        if (score >= minVal && score <= maxVal) {
          this.store[key].delete(member);
          removed++;
        }
      }
      return Promise.resolve(removed);
    }

    zrem(key: string, member: string) {
      if (!this.store[key]) return Promise.resolve(0);
      const deleted = this.store[key].delete(member) ? 1 : 0;
      return Promise.resolve(deleted);
    }

    zrangebyscore(key: string, min: string | number, max: string | number) {
      const minVal = min === "-inf" ? -Infinity : Number(min);
      const maxVal = max === "+inf" ? Infinity : Number(max);

      if (!this.store[key]) return Promise.resolve([]);

      const result: string[] = [];
      for (const [member, score] of this.store[key].entries()) {
        if (score >= minVal && score <= maxVal) {
          result.push(member);
        }
      }
      return Promise.resolve(result);
    }

    del(key: string) {
      delete this.store[key];
      delete this.expires[key];
      return Promise.resolve(1);
    }
  }

  const singleInstance = new MockRedisStore();

  return {
    default: class MockRedisWrapper {
      constructor() {
        return singleInstance;
      }
    },
  };
});

import { PresenceService } from "../src/services/presence";

describe("Redis Presence Service Tests", () => {
  const boardId = "test-board";
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = PresenceService.getClient() as any;
    mockRedis.store = {};
    mockRedis.expires = {};
  });

  it("should add a user presence and set key expiration", async () => {
    await PresenceService.updatePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-1",
    );

    const key = PresenceService.getPresenceKey(boardId);
    expect(mockRedis.store[key]).toBeDefined();
    expect(mockRedis.expires[key]).toBe(3600);

    const active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(1);
    expect(active[0]).toEqual({ userId: "user-1", displayName: "Alice" });
  });

  it("should remove a specific socket connection", async () => {
    await PresenceService.updatePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-1",
    );
    await PresenceService.removePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-1",
    );

    const active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(0);
  });

  it("should lazily clean up expired presences", async () => {
    const key = PresenceService.getPresenceKey(boardId);

    // Add Alice with an expired score (timestamp in the past)
    const pastTime = Date.now() - 5000;
    const memberAlice = JSON.stringify({
      userId: "user-1",
      socketId: "socket-1",
      displayName: "Alice",
    });
    await mockRedis.zadd(key, pastTime, memberAlice);

    // Add Bob with a future score
    const futureTime = Date.now() + 20000;
    const memberBob = JSON.stringify({
      userId: "user-2",
      socketId: "socket-2",
      displayName: "Bob",
    });
    await mockRedis.zadd(key, futureTime, memberBob);

    // Retrieve active users (this triggers lazy cleanup of Alice)
    const active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(1);
    expect(active[0].userId).toBe("user-2"); // Only Bob remains
  });

  it("should support multi-tab presence tracking (same userId, different socketIds)", async () => {
    // User 1 opens Tab 1
    await PresenceService.updatePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-tab-1",
    );
    // User 1 opens Tab 2
    await PresenceService.updatePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-tab-2",
    );

    // Fetch active users (should be deduplicated to a single entry)
    let active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(1);
    expect(active[0]).toEqual({ userId: "user-1", displayName: "Alice" });

    // User closes Tab 1 (socket-tab-1 disconnects)
    await PresenceService.removePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-tab-1",
    );

    // Alice should still be active because Tab 2 (socket-tab-2) is still open!
    active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(1);
    expect(active[0]).toEqual({ userId: "user-1", displayName: "Alice" });

    // Close Tab 2 as well
    await PresenceService.removePresence(
      boardId,
      "user-1",
      "Alice",
      "socket-tab-2",
    );

    // Alice should now be fully offline
    active = await PresenceService.getActiveUsers(boardId);
    expect(active).toHaveLength(0);
  });
});
