import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  // Если уже авторизован, редиректим на админку
  const session = await getSession();

  if (session) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            MedicalBrothers
          </h1>
          <p className="text-gray-400">Панель администратора</p>
        </div>

        {/* Форма логина */}
        <div className="cyber-card p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
          <LoginForm />
        </div>

        {/* Инфо */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Демо-доступ: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}
