import { headers } from 'next/headers';
import { createAuditLog, AuditAction, AuditEntity } from './audit';
import { getClientInfo } from './audit-helpers';
import { incrementCounter } from './redis';

/**
 * Detect and log suspicious activity
 */
export async function logSuspiciousActivity(
  type: 'failed_login' | 'invalid_token' | 'unauthorized_access' | 'sql_injection_attempt' | 'xss_attempt',
  details: Record<string, any>
): Promise<void> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Log to console for immediate visibility
    console.warn(`🚨 SECURITY ALERT [${type}]:`, {
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      ...details,
    });

    // Increment counter for this IP
    const key = `security:${type}:${ip}`;
    await incrementCounter(key, 3600); // Track for 1 hour

    // If we have an adminId (for logged-in users), log to audit
    if (details.adminId) {
      await createAuditLog({
        adminId: details.adminId as number,
        action: `security_${type}` as any,
        entity: AuditEntity.ADMIN,
        details: { type, ...details },
        ipAddress: ip,
        userAgent,
      });
    }
  } catch (error) {
    console.error('Error logging suspicious activity:', error);
  }
}

/**
 * Detect SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+ALL\s+SELECT)/gi,
    /(OR\s+1\s*=\s*1)/gi,
    /(AND\s+1\s*=\s*1)/gi,
    /('|\"|;|--|\*|\/\*|\*\/)/g,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Detect XSS patterns
 */
export function detectXSS(input: string): boolean {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize form data
 */
export function validateFormData(data: Record<string, any>): {
  isValid: boolean;
  errors: string[];
  sanitized: Record<string, any>;
} {
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check for SQL injection
      if (detectSQLInjection(value)) {
        errors.push(`SQL injection detected in field: ${key}`);
        logSuspiciousActivity('sql_injection_attempt', { field: key, value });
      }

      // Check for XSS
      if (detectXSS(value)) {
        errors.push(`XSS attempt detected in field: ${key}`);
        logSuspiciousActivity('xss_attempt', { field: key, value });
      }

      // Sanitize the input
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }

  return token;
}

/**
 * Check if request is coming from a trusted origin
 */
export async function isTrustedOrigin(): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');

  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., server-side calls)
    return true;
  }

  const trustedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000',
  ];

  const requestOrigin = origin || new URL(referer || '').origin;
  return trustedOrigins.includes(requestOrigin);
}
