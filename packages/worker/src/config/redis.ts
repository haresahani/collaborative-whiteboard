import Redis from "ioredis";
import { env } from "./env";

function normalizeRedisUrl(url?: string): string {
  if (!url) return "redis://127.0.0.1:6379";
  let normalized = url.trim();

  // If user pasted HTTPS/HTTP REST URL from Upstash console
  if (normalized.startsWith("https://") || normalized.startsWith("http://")) {
    normalized = normalized.replace(/^https?:\/\//, "rediss://");
  } else if (normalized.startsWith("//")) {
    normalized = normalized.includes("upstash.io") ? `rediss:${normalized}` : `redis:${normalized}`;
  } else if (!normalized.startsWith("redis://") && !normalized.startsWith("rediss://")) {
    normalized = normalized.includes("upstash.io")
      ? `rediss://${normalized}`
      : `redis://${normalized}`;
  }

  // Ensure port :6379 for Upstash endpoints if omitted
  if (normalized.includes("upstash.io") && !/:[0-9]+(\/|\?|$)/.test(normalized)) {
    if (normalized.includes("?")) {
      normalized = normalized.replace("?", ":6379?");
    } else {
      normalized = `${normalized.replace(/\/+$/, "")}:6379`;
    }
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
