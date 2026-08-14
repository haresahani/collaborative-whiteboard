import Redis, { RedisOptions } from "ioredis";
import { env } from "./env";

export interface RedisAdapterClients {
  pubClient: Redis;
  subClient: Redis;
}

export function normalizeRedisUrl(url: string): string {
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

export function createRedisAdapterClients(
  redisUrl: string = env.REDIS_URL,
  options: RedisOptions = {}
): RedisAdapterClients {
  const url = normalizeRedisUrl(redisUrl);
  const isTls = url.startsWith("rediss://");

  const pubClient = new Redis(url, {
    maxRetriesPerRequest: null,
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    ...options,
  });

  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => {
    console.warn("[socket] Redis pubClient connection notice:", err.message);
  });
  subClient.on("error", (err) => {
    console.warn("[socket] Redis subClient connection notice:", err.message);
  });

  return { pubClient, subClient };
}
