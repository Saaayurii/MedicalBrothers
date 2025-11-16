// Server-side only helpers for audit logging
// This file should only be imported in Server Components or Server Actions

import { headers } from 'next/headers';

export async function getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') ||
                     headersList.get('x-real-ip') ||
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    return {
      ipAddress: ipAddress.split(',')[0].trim(), // Get first IP if multiple
      userAgent,
    };
  } catch (error) {
    console.error('Failed to get client info:', error);
    return {
      ipAddress: 'unknown',
      userAgent: 'unknown',
    };
  }
}
