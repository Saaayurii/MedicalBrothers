'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string().min(6, 'Минимум 6 символов'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/patient/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка регистрации');
      }

      setSubmitMessage({ type: 'success', text: result.message });

      // Редирект на дашборд через 1 секунду
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 1000);
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Произошла ошибка при регистрации' });
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
          <h1 className="text-2xl font-bold text-white">Регистрация пациента</h1>
          <p className="text-gray-400 mt-2">Создайте личный кабинет для удобной записи к врачам</p>
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

            {/* ФИО */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ФИО <span className="text-red-400">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Иванов Иван Иванович"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@mail.com"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Телефон <span className="text-red-400">*</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+7 (999) 123-45-67"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Дата рождения */}
            <div>
              <label className="block text-sm font-medium mb-2">Дата рождения</label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>}
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Пароль <span className="text-red-400">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Минимум 6 символов"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            {/* Подтверждение пароля */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Подтвердите пароль <span className="text-red-400">*</span>
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Повторите пароль"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Ссылка на вход */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Уже есть аккаунт? </span>
            <Link href="/patient/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Войти
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
