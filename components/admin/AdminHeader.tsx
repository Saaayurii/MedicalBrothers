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
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Логотип */}
          <div>
            <Link
              href="/admin"
              className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              MedicalBrothers
            </Link>
            <p className="text-xs sm:text-sm text-gray-400">Панель администратора</p>
          </div>

          {/* Пользователь и навигация */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Инфо о пользователе */}
            <div className="text-left sm:text-right">
              <p className="text-sm sm:text-base font-semibold">{username}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{getRoleLabel(role)}</p>
            </div>

            {/* Кнопки */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">🏠 Главная</span>
                <span className="sm:hidden">🏠</span>
              </Link>

              <Link
                href="/admin/audit-logs"
                className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">📜 Журнал</span>
                <span className="sm:hidden">📜</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoggingOut ? '⏳' : '🚪'}
                <span className="hidden sm:inline ml-1">{isLoggingOut ? 'Выход...' : 'Выйти'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
