'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Введите email или телефон'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/patient/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка входа');
      }

      setSubmitMessage({ type: 'success', text: result.message });

      // Редирект на дашборд через 1 секунду
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 1000);
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Произошла ошибка при входе' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Лого и заголовок */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block mb-2">
            MedicalBrothers
          </Link>
          <h1 className="text-2xl font-bold text-white">Вход в личный кабинет</h1>
          <p className="text-gray-400 mt-2">Войдите чтобы управлять своими записями</p>
        </div>

        {/* Форма */}
        <div className="cyber-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Сообщение об ошибке */}
            {submitMessage && (
              <div
                className={`p-4 rounded-lg ${
                  submitMessage.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border border-red-500/50 text-red-400'
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            {/* Email или Телефон */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email или Телефон <span className="text-red-400">*</span>
              </label>
              <input
                {...register('identifier')}
                type="text"
                placeholder="example@mail.com или +7 (999) 123-45-67"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.identifier && <p className="mt-1 text-sm text-red-400">{errors.identifier.message}</p>}
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Пароль <span className="text-red-400">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Введите пароль"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Нет аккаунта? </span>
            <Link href="/patient/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Зарегистрироваться
            </Link>
          </div>
        </div>

        {/* Ссылка на главную */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
