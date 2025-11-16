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

      const result = await loginAction(formData);

      if (result.success) {
        router.push('/admin');
        router.refresh();
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
