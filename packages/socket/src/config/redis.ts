import Redis, { RedisOptions } from "ioredis";
import { env } from "./env";

export interface RedisAdapterClients {
  pubClient: Redis;
  subClient: Redis;
}

export function normalizeRedisUrl(url?: string): string {
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

let sharedRedisClient: Redis | null = null;

export function getSharedRedisClient(): Redis {
  if (!sharedRedisClient) {
    const url = normalizeRedisUrl(env.REDIS_URL);
    const isTls = url.startsWith("rediss://");
    sharedRedisClient = new Redis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    });

    sharedRedisClient.on("error", (err) => {
      console.warn("[socket] Redis shared client notice:", err.message);
    });
  }
  return sharedRedisClient;
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
