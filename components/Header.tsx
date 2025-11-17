'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="cyber-card p-4 mb-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-cyan-500/50">
            🏥
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">MedicalBrothers</h2>
            <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Умная медицина будущего</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 lg:gap-6">
          <NavLink href="/" label="Главная" active={pathname === '/'} />
          <NavLink href="/appointments" label="Записи" active={pathname === '/appointments'} />
          <NavLink href="/patient/dashboard" label="Кабинет" active={pathname === '/patient/dashboard'} />
          <NavLink href="/admin" label="Админ" active={pathname.startsWith('/admin')} />
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
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

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="md:hidden mt-4 pt-4 border-t border-slate-700/50 space-y-2 animate-fade-in">
          <MobileNavLink
            href="/"
            label="🏠 Главная"
            active={pathname === '/'}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileNavLink
            href="/assistant"
            label="🎤 Ассистент"
            active={pathname === '/assistant'}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileNavLink
            href="/appointments"
            label="📅 Записи"
            active={pathname === '/appointments'}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileNavLink
            href="/patient/dashboard"
            label="👤 Кабинет"
            active={pathname === '/patient/dashboard'}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileNavLink
            href="/admin"
            label="👨‍💼 Админ"
            active={pathname.startsWith('/admin')}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </nav>
      )}
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 lg:px-4 py-2 rounded-lg transition-all text-sm lg:text-base ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  active,
  onClick
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
          : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {label}
    </Link>
  );
}
