import redis from './redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for rate limiting when Redis is not available
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetTime < now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000);

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 900000 // 15 minutes
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    // Try Redis first
    if (redis) {
      const current = await redis.get<string>(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= limit) {
        const ttl = await redis.ttl(key);
        return {
          success: false,
          limit,
          remaining: 0,
          reset: now + ttl * 1000,
        };
      }

      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.pexpire(key, windowMs);
      }

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - newCount),
        reset: resetTime,
      };
    }
  } catch (error) {
    console.error('Redis rate limit error:', error);
  }

  // Fallback to in-memory
  const stored = inMemoryStore.get(key);

  if (stored && stored.resetTime > now) {
    if (stored.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: stored.resetTime,
      };
    }

    stored.count++;
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - stored.count),
      reset: stored.resetTime,
    };
  }

  // New entry
  inMemoryStore.set(key, { count: 1, resetTime });
  return {
    success: true,
    limit,
    remaining: limit - 1,
    reset: resetTime,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}

/**
 * Get client identifier from headers (for backward compatibility)
 */
export function getClientIdentifier(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() || headersList.get('x-real-ip') || 'unknown';
  return `client:${ip}`;
}

/**
 * Rate limit configuration for authentication attempts
 */
export const authRateLimit = {
  limit: 5, // 5 attempts
  windowMs: 900000, // 15 minutes
};

/**
 * Check rate limit (wrapper for backward compatibility)
 */
export async function checkRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number } = authRateLimit
): Promise<RateLimitResult> {
  return rateLimit(identifier, config.limit, config.windowMs);
}
