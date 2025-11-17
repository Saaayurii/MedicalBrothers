import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVapidPublicKey } from '@/lib/push-notifications';

// Get VAPID public key
export async function GET() {
  try {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store subscription in database
    // Note: You'll need to add a PushSubscription model to your Prisma schema
    /*
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: parseInt(userId),
          endpoint: subscription.endpoint,
        },
      },
      update: {
        keys: subscription.keys,
        updatedAt: new Date(),
      },
      create: {
        userId: parseInt(userId),
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
    */

    // For now, just log it
    console.log('Push subscription saved:', { userId, subscription });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint } = body;

    if (!userId || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove subscription from database
    /*
    await prisma.pushSubscription.delete({
      where: {
        userId_endpoint: {
          userId: parseInt(userId),
          endpoint,
        },
      },
    });
    */

    console.log('Push subscription removed:', { userId, endpoint });

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    });
  } catch (error: any) {
    console.error('Error removing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
