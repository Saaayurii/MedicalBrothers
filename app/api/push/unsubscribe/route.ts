import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';

export async function POST(request: NextRequest) {
  await connection();

  try {
    const { endpoint } = await request.json();

    // TODO: Remove subscription from database
    // await prisma.pushSubscription.deleteMany({
    //   where: { endpoint },
    // });

    console.log('Push unsubscription received:', endpoint);

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
