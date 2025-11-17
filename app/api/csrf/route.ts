import { NextResponse } from 'next/server';
import { getCSRFToken } from '@/lib/csrf';

export async function GET() {
  try {
    const token = await getCSRFToken();

    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
