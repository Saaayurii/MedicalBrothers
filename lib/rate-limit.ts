import { Ratelimit } from '@upstash/ratelimit';
import redis from './redis';

// Create rate limiters with different configurations
// If Redis is not configured, these will be null and rate limiting will be skipped

/**
 * Strict rate limit for authentication attempts
 * 5 requests per 15 minutes
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:auth',
    })
  : null;

/**
 * API rate limit for general API endpoints
 * 100 requests per minute
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:api',
    })
  : null;

/**
 * Strict rate limit for password reset
 * 3 requests per hour
 */
export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit:password-reset',
    })
  : null;

/**
 * Admin actions rate limit
 * 500 requests per minute
 */
export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:admin',
    })
  : null;

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!limiter) {
    // If rate limiting is not configured, allow all requests
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request to proceed
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}
