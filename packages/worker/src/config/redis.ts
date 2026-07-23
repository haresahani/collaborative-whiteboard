import Redis from "ioredis";
import { env } from "./env";

// BullMQ requires maxRetriesPerRequest to be null
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("[worker] Redis connection established");
});

redisConnection.on("error", (error) => {
  console.error("[worker] Redis connection error:", error);
});
