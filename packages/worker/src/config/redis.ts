import Redis from "ioredis";
import { env } from "./env";

function normalizeRedisUrl(url: string): string {
  if (!url) return url;
  let normalized = url.trim();
  if (normalized.startsWith("//")) {
    normalized = normalized.includes("upstash.io") ? `rediss:${normalized}` : `redis:${normalized}`;
  } else if (!normalized.startsWith("redis://") && !normalized.startsWith("rediss://")) {
    normalized = normalized.includes("upstash.io")
      ? `rediss://${normalized}`
      : `redis://${normalized}`;
  }
  return normalized;
}

const rawRedisUrl = normalizeRedisUrl(env.REDIS_URL);
const isTls = rawRedisUrl.startsWith("rediss://");

// BullMQ requires maxRetriesPerRequest to be null
export const redisConnection = new Redis(rawRedisUrl, {
  maxRetriesPerRequest: null,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
});

redisConnection.on("connect", () => {
  console.log("[worker] Redis connection established");
});

redisConnection.on("error", (error) => {
  console.error("[worker] Redis connection error:", error);
});
