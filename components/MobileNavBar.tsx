'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Mic, Stethoscope, User } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  isVoice?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', icon: <Home size={22} />, label: 'Главная' },
  { href: '/appointments', icon: <Calendar size={22} />, label: 'Запись' },
  { href: '/assistant', icon: <Mic size={22} />, label: '', isVoice: true },
  { href: '/doctor/dashboard', icon: <Stethoscope size={22} />, label: 'Врачи' },
  { href: '/patient/dashboard', icon: <User size={22} />, label: 'Профиль' },
];

// Страницы на которых показываем мобильный navbar
const allowedPaths = [
  '/',
  '/appointments',
  '/assistant',
  '/doctor/dashboard',
  '/patient/dashboard',
];

export default function MobileNavBar() {
  const pathname = usePathname();

  // Показываем navbar только на разрешённых страницах
  const shouldShow = allowedPaths.some(path =>
    path === pathname || (path !== '/' && pathname.startsWith(path))
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-950/98 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border-t border-cyan-500/20 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          if (item.isVoice) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6"
              >
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50 scale-110'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 hover:scale-105'
                  }
                `}>
                  <Mic size={26} className="text-white" />
                  {isActive && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-purple-500/30" />
                  )}
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative
                ${isActive
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-cyan-300'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-sm shadow-cyan-500/20'
                  : 'hover:bg-slate-800/50'
                }
              `}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
