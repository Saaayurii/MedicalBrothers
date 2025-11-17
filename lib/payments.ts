import Stripe from 'stripe';
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';

// Initialize payment providers
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

const yookassa = process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY
  ? new YooCheckout({
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY,
    })
  : null;

export type PaymentProvider = 'stripe' | 'yookassa';

export interface CreatePaymentParams {
  amount: number; // Amount in smallest currency unit (cents for USD, kopeks for RUB)
  currency: string; // 'usd', 'rub', etc.
  description: string;
  metadata?: Record<string, any>;
  customerId?: string;
  returnUrl?: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  url?: string;
  clientSecret?: string;
}

// Stripe payments
export async function createStripePayment(params: CreatePaymentParams): Promise<PaymentResult> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata || {},
      customer: params.customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
}

export async function createStripeCheckoutSession(params: CreatePaymentParams): Promise<PaymentResult> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      success_url: params.returnUrl + '?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: params.returnUrl + '?canceled=true',
      metadata: params.metadata || {},
      customer: params.customerId,
    });

    return {
      id: session.id,
      status: 'pending',
      url: session.url || undefined,
    };
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    throw new Error(`Stripe checkout failed: ${error.message}`);
  }
}

export async function getStripePaymentStatus(paymentId: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    return paymentIntent.status;
  } catch (error: any) {
    console.error('Error retrieving Stripe payment:', error);
    throw new Error(`Failed to retrieve payment: ${error.message}`);
  }
}

// YooKassa (ЮКасса) payments
export async function createYookassaPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  if (!yookassa) {
    throw new Error('YooKassa is not configured');
  }

  try {
    const payment: ICreatePayment = {
      amount: {
        value: (params.amount / 100).toFixed(2),
        currency: params.currency.toUpperCase() as any,
      },
      confirmation: {
        type: 'redirect',
        return_url: params.returnUrl || process.env.NEXT_PUBLIC_APP_URL + '/payment/success',
      },
      capture: true,
      description: params.description,
      metadata: params.metadata || {},
    };

    const result = await yookassa.createPayment(payment);

    return {
      id: result.id,
      status: result.status,
      url: result.confirmation?.confirmation_url,
    };
  } catch (error: any) {
    console.error('YooKassa payment error:', error);
    throw new Error(`YooKassa payment failed: ${error.message}`);
  }
}

export async function getYookassaPaymentStatus(paymentId: string): Promise<string> {
  if (!yookassa) {
    throw new Error('YooKassa is not configured');
  }

  try {
    const payment = await yookassa.getPayment(paymentId);
    return payment.status;
  } catch (error: any) {
    console.error('Error retrieving YooKassa payment:', error);
    throw new Error(`Failed to retrieve payment: ${error.message}`);
  }
}

// Universal payment creation
export async function createPayment(
  provider: PaymentProvider,
  params: CreatePaymentParams
): Promise<PaymentResult> {
  switch (provider) {
    case 'stripe':
      return createStripeCheckoutSession(params);
    case 'yookassa':
      return createYookassaPayment(params);
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Get payment status
export async function getPaymentStatus(
  provider: PaymentProvider,
  paymentId: string
): Promise<string> {
  switch (provider) {
    case 'stripe':
      return getStripePaymentStatus(paymentId);
    case 'yookassa':
      return getYookassaPaymentStatus(paymentId);
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Webhook verification
export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Stripe webhook verification failed:', error);
    throw new Error(`Webhook verification failed: ${error.message}`);
  }
}
