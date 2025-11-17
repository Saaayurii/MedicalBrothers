import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, PaymentProvider } from '@/lib/payments';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    const paymentId = searchParams.get('paymentId');

    if (!provider || !paymentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: provider, paymentId' },
        { status: 400 }
      );
    }

    if (!['stripe', 'yookassa'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid payment provider' },
        { status: 400 }
      );
    }

    const status = await getPaymentStatus(provider as PaymentProvider, paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      provider,
      status,
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
