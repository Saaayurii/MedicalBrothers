import { getSession, AdminSession } from './auth';
import { NextResponse } from 'next/server';

/**
 * Helper to require authentication in API routes
 */
export async function requireApiAuth(): Promise<{
  session: AdminSession;
  user: { id: string; role: string };
} | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return {
    session,
    user: {
      id: session.adminId.toString(),
      role: session.role,
    },
  };
}

/**
 * Helper to require specific role in API routes
 */
export async function requireApiRole(
  allowedRoles: string[]
): Promise<{
  session: AdminSession;
  user: { id: string; role: string };
} | NextResponse> {
  const authResult = await requireApiAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.session.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return authResult;
}
