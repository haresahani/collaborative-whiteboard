import Redis from "ioredis";
import type { IOp } from "shared";
import { env } from "../config/env";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", () => {
  // Silent error handler for offline/unit test environments
});

const MAX_BUFFER_SIZE = 200;

export function getRecentOpsKey(boardId: string): string {
  return `recentops:${boardId}`;
}

export async function pushRecentOp(boardId: string, op: IOp): Promise<void> {
  const key = getRecentOpsKey(boardId);
  const member = JSON.stringify(op);

  await redis.zadd(key, op.lamport, member);
  await redis.zremrangebyrank(key, 0, -(MAX_BUFFER_SIZE + 1));
  await redis.expire(key, 3600);
}

export async function getRecentOps(
  boardId: string,
  afterLamport: number,
): Promise<IOp[]> {
  const key = getRecentOpsKey(boardId);
  const members = await redis.zrangebyscore(key, `(${afterLamport}`, "+inf");

  const ops: IOp[] = [];
  for (const item of members) {
    try {
      const parsed = JSON.parse(item) as IOp;
      ops.push(parsed);
    } catch (err) {
      console.error(
        "[recentOpsBuffer] Error parsing buffered op from Redis:",
        err,
      );
    }
  }
  return ops;
}

export async function clearRecentOpsBuffer(boardId?: string): Promise<void> {
  if (boardId) {
    await redis.del(getRecentOpsKey(boardId));
  } else {
    if (typeof redis.keys === "function") {
      const keys = await redis.keys("recentops:*");
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }
}

export function getRecentOpsClient(): Redis {
  return redis;
}
