import type Redis from "ioredis";
import { getSharedRedisClient } from "../config/redis";

const redis = getSharedRedisClient();

const PRESENCE_TTL_MS = 30 * 1000; // 30 seconds

export class PresenceService {
  static getPresenceKey(boardId: string): string {
    return `presence:${boardId}`;
  }

  /**
   * Add or refresh the presence of a user's specific socket connection.
   */
  static async updatePresence(
    boardId: string,
    userId: string,
    displayName: string,
    socketId: string
  ): Promise<void> {
    const key = this.getPresenceKey(boardId);
    const now = Date.now();
    const expiresAt = now + PRESENCE_TTL_MS;
    const member = JSON.stringify({ userId, socketId, displayName });

    // Add or update the member's score to its expiration timestamp
    await redis.zadd(key, expiresAt, member);

    // Set/slide the key-level TTL (1 hour) to ensure empty board sets are deleted from memory
    await redis.expire(key, 3600);

    // Lazily evict expired members on this write
    await redis.zremrangebyscore(key, "-inf", now);
  }

  /**
   * Remove a specific socket presence on disconnect.
   */
  static async removePresence(
    boardId: string,
    userId: string,
    displayName: string,
    socketId: string
  ): Promise<void> {
    const key = this.getPresenceKey(boardId);
    const member = JSON.stringify({ userId, socketId, displayName });
    await redis.zrem(key, member);
  }

  /**
   * Retrieves unique, active users for a board. Expired presences are cleaned up.
   */
  static async getActiveUsers(boardId: string): Promise<{ userId: string; displayName: string }[]> {
    const key = this.getPresenceKey(boardId);
    const now = Date.now();

    // Evict expired members first
    await redis.zremrangebyscore(key, "-inf", now);

    // Retrieve members whose scores are greater than current time
    const members = await redis.zrangebyscore(key, now, "+inf");

    const activeMap = new Map<string, { userId: string; displayName: string }>();

    for (const item of members) {
      try {
        const parsed = JSON.parse(item) as {
          userId: string;
          socketId: string;
          displayName: string;
        };
        // Deduplicate: if same userId has multiple open tabs (different socketIds),
        // we keep a single active participant row.
        activeMap.set(parsed.userId, {
          userId: parsed.userId,
          displayName: parsed.displayName,
        });
      } catch (err) {
        console.error("[Presence] Error parsing presence member from Redis:", err);
      }
    }

    return Array.from(activeMap.values());
  }

  /**
   * Completely clear all presence data for a board (mainly used for testing/maintenance).
   */
  static async clearBoardPresence(boardId: string): Promise<void> {
    await redis.del(this.getPresenceKey(boardId));
  }

  /**
   * Expose Redis client for application teardown.
   */
  static getClient(): Redis {
    return redis;
  }
}
