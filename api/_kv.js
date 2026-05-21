import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;
let redisClientPromise = null;

export const isKvAvailable = Boolean(REDIS_URL);

async function getRedisClient() {
  if (!REDIS_URL) {
    throw new Error('Storage not configured. Set REDIS_URL in Vercel.');
  }

  if (redisClient) {
    return redisClient;
  }

  if (!redisClientPromise) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });
    redisClientPromise = redisClient.connect().then(() => redisClient);
  }

  return redisClientPromise;
}

export async function kvGet(key) {
  if (!isKvAvailable) return null;

  const redis = await getRedisClient();
  const raw = await redis.get(key);
  if (raw === null || raw === undefined) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function kvSet(key, value) {
  if (!isKvAvailable) return false;

  const redis = await getRedisClient();
  const serialized = JSON.stringify(value);
  const result = await redis.set(key, serialized);
  return result === 'OK';
}
