import { NextRequest, NextResponse } from 'next/server';
import { createPayment, PaymentProvider } from '@/lib/payments';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment for appointment
 *     description: |
 *       Create a payment transaction using Stripe or YooKassa.
 *
 *       Supported providers:
 *       - stripe: International payments (USD, EUR, etc.)
 *       - yookassa: Russian payments (RUB)
 *
 *       Returns payment URL for redirect-based flow or clientSecret for Stripe Elements.
 *       Amount is automatically converted to smallest currency unit (kopeks/cents).
 *     operationId: createPayment
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - appointmentId
 *               - amount
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [stripe, yookassa]
 *                 description: Payment provider
 *                 example: yookassa
 *               appointmentId:
 *                 type: integer
 *                 description: Appointment ID for payment
 *                 example: 5
 *               amount:
 *                 type: number
 *                 description: Payment amount in major currency units
 *                 example: 2500
 *               currency:
 *                 type: string
 *                 enum: [rub, usd, eur]
 *                 default: rub
 *                 description: Payment currency
 *                 example: rub
 *               description:
 *                 type: string
 *                 description: Payment description (optional)
 *                 example: "Консультация кардиолога"
 *     responses:
 *       200:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paymentId:
 *                   type: string
 *                   description: Payment ID from provider
 *                   example: "2d92c8cd-000f-5000-9000-1b7f65e5c7aa"
 *                 status:
 *                   type: string
 *                   description: Payment status
 *                   example: pending
 *                 paymentUrl:
 *                   type: string
 *                   description: Redirect URL for payment (YooKassa)
 *                   example: "https://yoomoney.ru/checkout/payments/v2/..."
 *                 clientSecret:
 *                   type: string
 *                   description: Client secret for Stripe Elements
 *                   example: "pi_1234_secret_5678"
 *       400:
 *         description: Missing required fields or invalid provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Missing required fields: provider, appointmentId, amount"
 *               invalidProvider:
 *                 summary: Invalid payment provider
 *                 value:
 *                   error: 'Invalid payment provider. Use "stripe" or "yookassa"'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
