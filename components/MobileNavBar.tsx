'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Mic, MessageCircle, User } from 'lucide-react';

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
  { href: '/chat/lobby', icon: <MessageCircle size={22} />, label: 'Чат' },
  { href: '/patient/dashboard', icon: <User size={22} />, label: 'Профиль' },
];

export default function MobileNavBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-bottom">
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
                  transition-all duration-300 shadow-lg
                  ${isActive
                    ? 'bg-red-500 shadow-red-500/40'
                    : 'bg-teal-500 shadow-teal-500/40 hover:bg-teal-400'
                  }
                `}>
                  <Mic size={26} className="text-white" />
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive
                  ? 'text-teal-400'
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-teal-500/20' : ''}
              `}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-0 w-1 h-1 bg-teal-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
