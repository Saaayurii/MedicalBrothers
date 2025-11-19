'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';

// Схема валидации
const loginSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа').max(100),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{ userId: number; userType: string } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('password', data.password);

      const result: any = await loginAction(formData);

      if (result.success) {
        router.push('/admin');
        router.refresh();
      } else if (result.error === 'requires_2fa' && result.requires2FA) {
        setShow2FA(true);
        setTwoFAData({ userId: result.userId, userType: result.userType });
      } else {
        setError(result.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте снова.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit2FA = async () => {
    if (!twoFAData || !twoFAToken) {
      setError('Введите код аутентификации');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/complete-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: twoFAData.userId,
          userType: twoFAData.userType,
          token: twoFAToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Неверный код');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка проверки кода');
    } finally {
      setIsLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="space-y-6">
        {/* Общая ошибка */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <h3 className="text-xl font-bold text-center">Двухфакторная аутентификация</h3>
        <p className="text-sm text-gray-400 text-center">
          Введите 6-значный код из вашего приложения-аутентификатора
        </p>

        {/* 2FA Token */}
        <div>
          <label htmlFor="twoFAToken" className="block text-sm font-medium mb-2">
            Код аутентификации
          </label>
          <input
            id="twoFAToken"
            type="text"
            value={twoFAToken}
            onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center text-2xl tracking-widest"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            onClick={() => setShow2FA(false)}
            disabled={isLoading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            Назад
          </button>
          <button
            onClick={onSubmit2FA}
            disabled={isLoading || twoFAToken.length !== 6}
            className={`flex-1 neon-button py-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Потеряли доступ? Используйте резервный код
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Общая ошибка */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Имя пользователя */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          Имя пользователя
        </label>
        <input
          {...register('username')}
          id="username"
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            errors.username
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-slate-700 focus:ring-cyan-500/50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="admin"
          autoComplete="username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
        )}
      </div>

      {/* Пароль */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Пароль
        </label>
        <input
          {...register('password')}
          id="password"
          type="password"
          disabled={isLoading}
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            errors.password
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-slate-700 focus:ring-cyan-500/50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Кнопка входа */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full neon-button py-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
