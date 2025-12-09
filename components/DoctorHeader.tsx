'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DoctorHeaderProps {
  username: string;
  email: string;
  handleLogout: () => Promise<void>;
}

export default function DoctorHeader({ username, email, handleLogout }: DoctorHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            MedicalBrothers
          </Link>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Кабинет врача</p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{username}</p>
            <p className="text-xs text-gray-400">{email}</p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all text-sm"
          >
            Админ-панель
          </Link>

          <form action={handleLogout}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all text-sm"
            >
              Выход
            </button>
          </form>
        </div>

        {/* Mobile Burger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
          <div className="container mx-auto px-3 py-3 space-y-2">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-slate-700/50 mb-2">
              <p className="text-white font-semibold text-sm">{username}</p>
              <p className="text-xs text-gray-400">{email}</p>
            </div>

            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              На главную
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Админ-панель
            </Link>
            <Link
              href="/assistant"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30"
            >
              Голосовой помощник
            </Link>
            <form action={handleLogout} className="pt-2 border-t border-slate-700/50">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all text-left"
              >
                Выход
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
