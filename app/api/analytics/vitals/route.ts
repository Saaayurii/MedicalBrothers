import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Log Web Vitals
    logger.info('Web Vital Reported', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    // Here you could store metrics in database or send to analytics service

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process vitals', error as Error);
    return NextResponse.json(
      { error: 'Failed to process vitals' },
      { status: 500 }
    );
  }
}
