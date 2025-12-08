export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-950 to-black border-t border-cyan-500/20 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/50">
                🏥
              </div>
              <h3 className="text-xl font-bold">MedicalBrothers</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Современная медицинская клиника с AI-технологиями для вашего здоровья и комфорта.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Главная
                </a>
              </li>
              <li>
                <a href="/admin" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Админ-панель
                </a>
              </li>
              <li>
                <a href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Возможности
                </a>
              </li>
              <li>
                <a href="#doctors" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Врачи
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Контакты</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">📞</span>
                <div>
                  <div className="font-semibold text-white">+7 (949) 999-99-99</div>
                  <div className="text-xs">Круглосуточно</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">✉️</span>
                <div>
                  <div className="font-semibold text-white">info@medicalbrothers.ru</div>
                  <div className="text-xs">Ответим за 24 часа</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">📍</span>
                <div>
                  <div className="font-semibold text-white">г. Донецк</div>
                  <div className="text-xs">пр-кт Ильича, д.14</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Режим работы</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">Понедельник - Пятница</span>
                <span className="text-white font-semibold">9:00 - 20:00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Суббота</span>
                <span className="text-white font-semibold">10:00 - 16:00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Воскресенье</span>
                <span className="text-red-400 font-semibold">Выходной</span>
              </li>
              <li className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">AI-помощник 24/7</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2025 MedicalBrothers. Все права защищены.
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://github.com/Saaayurii/MedicalBrothers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg flex items-center justify-center hover:border-cyan-500/50 transition-all group"
                title="GitHub"
              >
                <span className="group-hover:scale-110 transition-transform">💻</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg flex items-center justify-center hover:border-cyan-500/50 transition-all group"
                title="Telegram"
              >
                <span className="group-hover:scale-110 transition-transform">📱</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg flex items-center justify-center hover:border-cyan-500/50 transition-all group"
                title="WhatsApp"
              >
                <span className="group-hover:scale-110 transition-transform">💬</span>
              </a>
            </div>

            <div className="text-sm text-gray-500">
              Powered by{' '}
              <span className="text-cyan-400 font-semibold">Next.js 16</span>
              {' & '}
              <span className="text-purple-400 font-semibold">Qwen AI</span>
            </div>
          </div>
        </div>

        {/* Tech Stack Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-full text-xs text-gray-400">
            <span className="text-cyan-400">⚡</span>
            <span>Next.js 16 • React 19 • PostgreSQL • Ollama • Turbopack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
