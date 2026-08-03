import Redis, { RedisOptions } from "ioredis";
import { env } from "./env";

export interface RedisAdapterClients {
  pubClient: Redis;
  subClient: Redis;
}

export function createRedisAdapterClients(
  redisUrl: string = env.REDIS_URL,
  options: RedisOptions = {},
): RedisAdapterClients {
  const pubClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    ...options,
  });

  const subClient = pubClient.duplicate();

  return { pubClient, subClient };
}
