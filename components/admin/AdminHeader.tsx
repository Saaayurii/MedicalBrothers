'use client';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { useState } from 'react';
import { getRoleLabel } from '@/lib/roles';

interface AdminHeaderProps {
  username: string;
  role: string;
}

export default function AdminHeader({ username, role }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      setIsLoggingOut(true);
      await logoutAction();
    }
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              MedicalBrothers
            </Link>
            <p className="text-sm text-gray-400">Панель администратора</p>
          </div>

          {/* Пользователь и навигация */}
          <div className="flex items-center gap-4">
            {/* Инфо о пользователе */}
            <div className="hidden md:block text-right">
              <p className="font-semibold">{username}</p>
              <p className="text-xs text-gray-400">{getRoleLabel(role)}</p>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm"
              >
                🏠 Главная
              </Link>

              <Link
                href="/admin/audit-logs"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm"
              >
                📜 Журнал
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all text-sm ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoggingOut ? '⏳ Выход...' : '🚪 Выйти'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
