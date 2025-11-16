export default function Header() {
  return (
    <header className="cyber-card p-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/50">
            🏥
          </div>
          <div>
            <h2 className="text-xl font-bold">MedicalBrothers</h2>
            <p className="text-sm text-gray-400">Умная медицина будущего</p>
          </div>
        </div>

        <nav className="hidden md:flex gap-6">
          <NavLink href="/" label="Главная" active />
          <NavLink href="/admin" label="Админ-панель" />
          <NavLink href="/appointments" label="Записи" />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg transition-all ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </a>
  );
}
