import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitHeaders } from './rate-limit';

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { limit?: number; windowMs?: number } = {}
) {
  return async (req: NextRequest) => {
    // Get identifier (IP or user ID)
    const identifier =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const result = await rateLimit(
      identifier,
      options.limit,
      options.windowMs
    );

    const headers = getRateLimitHeaders(result);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(req);

    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
