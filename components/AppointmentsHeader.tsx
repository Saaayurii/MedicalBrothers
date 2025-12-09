'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppointmentsHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          MedicalBrothers
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 lg:gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm"
          >
            На главную
          </Link>
          <Link
            href="/assistant"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/50 rounded-lg transition-all text-sm"
          >
            Голосовой помощник
          </Link>
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
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              На главную
            </Link>
            <Link
              href="/assistant"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30"
            >
              Голосовой помощник
            </Link>
            <Link
              href="/patient/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Личный кабинет
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
