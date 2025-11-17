import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!token) {
    token = generateCSRFToken();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  return token;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER);

  if (!tokenFromCookie || !tokenFromHeader) {
    return false;
  }

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromCookie),
    Buffer.from(tokenFromHeader)
  );
}

/**
 * Middleware to validate CSRF token for state-changing operations
 */
export async function requireCSRFToken(request: NextRequest): Promise<boolean> {
  // Only check CSRF for state-changing methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  return await verifyCSRFToken(request);
}
