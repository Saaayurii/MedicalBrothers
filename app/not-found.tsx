import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse-slow">
            404
          </h1>
        </div>

        {/* Error Icon */}
        <div className="text-8xl mb-6 animate-float">
          🏥💔
        </div>

        {/* Error Message */}
        <div className="cyber-card p-8 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-cyan-400">
            Страница не найдена
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
          <p className="text-gray-400">
            Возможно, вы перешли по устаревшей ссылке или ввели неверный адрес.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="neon-button text-lg">
            🏠 На главную
          </Link>
          <Link
            href="/admin"
            className="px-8 py-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 text-white font-semibold rounded-xl transition-all"
          >
            👨‍💼 Админ-панель
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Нужна помощь? Позвоните нам: <span className="text-cyan-400">+7 (949) 999-99-99</span></p>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </main>
  );
}
