import Redis from "ioredis";
import { Queue } from "bullmq";
import { normalizeRedisUrl } from "../config/redis";
import { env } from "../config/env";
import { IOp } from "shared";

const rawRedisUrl = normalizeRedisUrl(env.REDIS_URL);
const isTls = rawRedisUrl.startsWith("rediss://");

// BullMQ requires maxRetriesPerRequest to be null
const connection = new Redis(rawRedisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
});

connection.on("error", (err) => {
  console.warn("[oplogQueue] Redis connection notice:", err.message);
});

export const oplogQueue = new Queue("oplog-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: false,
  },
});

export async function enqueueOp(op: IOp): Promise<void> {
  try {
    await oplogQueue.add("persist-op", op, {
      jobId: op.opId,
    });
  } catch (err) {
    // Gracefully handle offline Redis without crashing socket broadcasts
    console.warn("[oplogQueue] Skipped BullMQ enqueue (Redis offline):", (err as Error).message);
  }
}
