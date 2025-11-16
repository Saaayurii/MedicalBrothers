'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-500 to-pink-600 animate-pulse-slow">
            500
          </h1>
        </div>

        {/* Error Icon */}
        <div className="text-8xl mb-6 animate-float">
          ⚠️🔧
        </div>

        {/* Error Message */}
        <div className="cyber-card p-8 mb-8 border-2 border-red-500/30">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-red-400">
            Что-то пошло не так!
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            Произошла непредвиденная ошибка при обработке вашего запроса.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
              <p className="text-sm text-red-400 font-mono break-all">
                {error.message || 'Unknown error'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <p className="text-gray-400 mt-4">
            Наша команда уже получила уведомление об этой проблеме и работает над её устранением.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="neon-button text-lg"
          >
            🔄 Попробовать снова
          </button>
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 text-white font-semibold rounded-xl transition-all"
          >
            🏠 На главную
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Проблема не решается? Свяжитесь с нами:</p>
          <p className="mt-2">
            📞 <span className="text-cyan-400">+7 (800) 123-45-67</span>
            {' • '}
            ✉️ <span className="text-cyan-400">support@medicalbrothers.ru</span>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </main>
  );
}
