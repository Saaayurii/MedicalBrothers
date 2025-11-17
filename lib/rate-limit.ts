import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  limit: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, limit: 10 } // Default: 10 req/min
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Create new entry or reset if interval passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.interval,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment counter
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    remaining,
    reset: entry.resetAt,
  };
}

/**
 * Get client identifier from request or headers
 * Uses IP address or fallback to 'anonymous'
 */
export function getClientIdentifier(requestOrHeaders: NextRequest | Headers): string {
  // Get headers object from NextRequest or use directly
  const headers = requestOrHeaders instanceof Headers
    ? requestOrHeaders
    : requestOrHeaders.headers;

  // Try to get IP from headers (works with proxies)
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'anonymous';
}

/**
 * Rate limit presets for different endpoints
 */
export const RateLimitPresets = {
  // Strict limits for expensive operations
  VOICE_API: { interval: 60000, limit: 20 }, // 20 req/min
  AUTH: { interval: 60000, limit: 5 }, // 5 req/min for login/register

  // Standard limits for regular API
  API_STANDARD: { interval: 60000, limit: 60 }, // 60 req/min

  // Generous limits for read operations
  API_READ: { interval: 60000, limit: 100 }, // 100 req/min
};
