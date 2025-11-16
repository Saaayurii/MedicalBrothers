import { Redis } from '@upstash/redis';

// Initialize Redis client
// If environment variables are not set, return a mock client for development
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
};

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) {
    console.warn('Redis not configured, skipping cache read');
    return null;
  }

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set value in cache with expiration
 */
export async function setCached<T>(
  key: string,
  value: T,
  expirationSeconds: number = CACHE_DURATIONS.MEDIUM
): Promise<boolean> {
  if (!redis) {
    console.warn('Redis not configured, skipping cache write');
    return false;
  }

  try {
    await redis.set(key, value, { ex: expirationSeconds });
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return 0;
  }
}

/**
 * Increment a counter (for tracking purposes)
 */
export async function incrementCounter(key: string, expirationSeconds?: number): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const count = await redis.incr(key);
    if (expirationSeconds) {
      await redis.expire(key, expirationSeconds);
    }
    return count;
  } catch (error) {
    console.error('Redis increment error:', error);
    return 0;
  }
}

export default redis;
