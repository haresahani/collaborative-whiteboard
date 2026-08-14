import Redis from "ioredis";
import type { IOp } from "shared";
import { getSharedRedisClient } from "../config/redis";

const redis = getSharedRedisClient();

const MAX_BUFFER_SIZE = 200;
const memoryBuffer = new Map<string, IOp[]>();

export function getRecentOpsKey(boardId: string): string {
  return `recentops:${boardId}`;
}

export async function pushRecentOp(boardId: string, op: IOp): Promise<void> {
  const current = memoryBuffer.get(boardId) || [];
  memoryBuffer.set(boardId, [...current, op].slice(-MAX_BUFFER_SIZE));

  try {
    const key = getRecentOpsKey(boardId);
    const member = JSON.stringify(op);
    await redis.zadd(key, op.lamport, member);
    await redis.zremrangebyrank(key, 0, -(MAX_BUFFER_SIZE + 1));
    await redis.expire(key, 3600);
  } catch {
    // Graceful fallback to memoryBuffer if Redis is offline
  }
}

export async function getRecentOps(boardId: string, afterLamport: number): Promise<IOp[]> {
  try {
    const key = getRecentOpsKey(boardId);
    const members = await redis.zrangebyscore(key, `(${afterLamport}`, "+inf");

    const ops: IOp[] = [];
    for (const item of members) {
      try {
        const parsed = JSON.parse(item) as IOp;
        ops.push(parsed);
      } catch (err) {
        console.error("[recentOpsBuffer] Error parsing buffered op from Redis:", err);
      }
    }
    return ops;
  } catch {
    const ops = memoryBuffer.get(boardId) || [];
    return ops.filter((o) => o.lamport > afterLamport);
  }
}

export async function clearRecentOpsBuffer(boardId?: string): Promise<void> {
  if (boardId) {
    memoryBuffer.delete(boardId);
    try {
      await redis.del(getRecentOpsKey(boardId));
    } catch {
      // ignore
    }
  } else {
    memoryBuffer.clear();
    try {
      if (typeof redis.keys === "function") {
        const keys = await redis.keys("recentops:*");
        if (keys && keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      // ignore
    }
  }
}

export function getRecentOpsClient(): Redis {
  return redis;
}
