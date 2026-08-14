import { getSharedRedisClient } from "../config/redis";
import { Oplog } from "shared/models";

const redis = getSharedRedisClient();

export async function getNextLamport(boardId: string): Promise<number> {
  const key = `board:${boardId}:lamport`;

  // Increment atomically in Redis
  const nextVal = await redis.incr(key);

  // If nextVal is 1, the counter is uninitialized in Redis.
  // We initialize it using the highest lamport value in MongoDB.
  if (nextVal === 1) {
    const lastOp = await Oplog.findOne({ boardId }).sort({ lamport: -1 }).select("lamport").lean();

    const dbMax = lastOp ? lastOp.lamport : 0;
    if (dbMax > 0) {
      await redis.set(key, dbMax + 1);
      return dbMax + 1;
    }
  }

  return nextVal;
}
