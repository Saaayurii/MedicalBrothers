import { NextRequest, NextResponse } from 'next/server';
import { createPayment, PaymentProvider } from '@/lib/payments';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider,
      appointmentId,
      amount,
      currency = 'rub',
      description,
    } = body;

    // Validation
    if (!provider || !appointmentId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, appointmentId, amount' },
        { status: 400 }
      );
    }

    if (!['stripe', 'yookassa'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid payment provider. Use "stripe" or "yookassa"' },
        { status: 400 }
      );
    }

    // TODO: Get appointment details and verify user permissions
    /*
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    */

    // Create payment
    const paymentParams = {
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      description: description || 'Оплата консультации #' + appointmentId,
      metadata: {
        appointmentId,
        type: 'appointment',
      },
      returnUrl: process.env.NEXT_PUBLIC_APP_URL + '/payment/callback',
    };

    const paymentResult = await createPayment(provider as PaymentProvider, paymentParams);

    // Save payment to database
    /*
    await prisma.payment.create({
      data: {
        appointmentId,
        provider,
        externalId: paymentResult.id,
        amount,
        currency,
        status: paymentResult.status,
      },
    });
    */

    console.log('Payment created:', {
      appointmentId,
      provider,
      paymentId: paymentResult.id,
      amount,
    });

    return NextResponse.json({
      success: true,
      paymentId: paymentResult.id,
      status: paymentResult.status,
      paymentUrl: paymentResult.url,
      clientSecret: paymentResult.clientSecret,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
