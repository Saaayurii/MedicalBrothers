import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';

// This is a placeholder for push subscription storage
// In production, you would store subscriptions in a database

export async function POST(request: NextRequest) {
  await connection();

  try {
    const subscription = await request.json();

    // TODO: Store subscription in database
    // await prisma.pushSubscription.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys,
    //     // associate with user/patient if logged in
    //   },
    // });

    console.log('Push subscription received:', subscription.endpoint);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
