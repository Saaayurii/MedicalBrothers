import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhook } from '@/lib/payments';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = await verifyStripeWebhook(body, signature);

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment status in database
        /*
        await prisma.payment.update({
          where: { externalId: paymentIntent.id },
          data: {
            status: 'succeeded',
            paidAt: new Date(),
          },
        });

        // Update appointment status
        const payment = await prisma.payment.findUnique({
          where: { externalId: paymentIntent.id },
        });

        if (payment) {
          await prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: { paymentStatus: 'paid' },
          });
        }
        */
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.log('Payment failed:', failedIntent.id);

        /*
        await prisma.payment.update({
          where: { externalId: failedIntent.id },
          data: { status: 'failed' },
        });
        */
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
