'use client';

import { useState } from 'react';

interface PaymentButtonProps {
  appointmentId: number;
  amount: number;
  currency?: string;
  provider?: 'stripe' | 'yookassa';
}

export default function PaymentButton({
  appointmentId,
  amount,
  currency = 'rub',
  provider = 'yookassa',
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          appointmentId,
          amount,
          currency,
          description: `Оплата консультации #${appointmentId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // Redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.clientSecret) {
        // For Stripe Elements (if needed)
        console.log('Stripe client secret:', data.clientSecret);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Ошибка при оплате');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-all text-sm font-medium ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? '⏳ Обработка...' : `💳 Оплатить ${amount} ₽`}
      </button>
      
      {error && (
        <p className="text-xs text-red-400 mt-2">
          ❌ {error}
        </p>
      )}
    </div>
  );
}
