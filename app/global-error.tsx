'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white min-h-screen">
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-2xl">
            {/* Critical Error */}
            <div className="mb-8">
              <h1 className="text-9xl md:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-600 animate-pulse">
                ⚠️
              </h1>
            </div>

            <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 backdrop-blur-xl border border-red-500/50 rounded-2xl shadow-2xl p-8 mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-red-400">
                Критическая ошибка
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Приложение столкнулось с критической ошибкой и временно недоступно.
              </p>
              <p className="text-gray-400">
                Пожалуйста, обновите страницу или свяжитесь с администратором.
              </p>

              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                  <p className="text-sm text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={reset}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transition-all duration-300 transform hover:scale-105"
            >
              🔄 Перезагрузить приложение
            </button>

            <div className="mt-8 text-sm text-gray-500">
              <p>Техподдержка: <span className="text-cyan-400">+7 (800) 123-45-67</span></p>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
