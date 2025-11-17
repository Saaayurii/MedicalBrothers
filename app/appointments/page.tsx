import Link from 'next/link';
import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import AppointmentCard from '@/components/AppointmentCard';

export default async function AppointmentsPage() {
  noStore();
  await connection();

  // Получаем все будущие записи
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let appointments: Array<any> = [];

  try {
    appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: today,
        },
      },
      include: {
        doctor: true,
        patient: true,
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' },
      ],
    });
  } catch (error) {
    console.error('Database connection error:', error);
    // Return empty array if database is not available
    appointments = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Шапка */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            MedicalBrothers
          </Link>

          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
            >
              ← На главную
            </Link>
            <Link
              href="/assistant"
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all"
            >
              Голосовой помощник
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Предстоящие записи
          </span>
        </h1>

        {appointments.length === 0 ? (
          <div className="cyber-card p-12 text-center">
            <div className="text-6xl mb-6">📅</div>
            <h2 className="text-2xl font-bold mb-4">Нет предстоящих записей</h2>
            <p className="text-gray-400 mb-8">
              У вас пока нет запланированных визитов к врачам
            </p>
            <Link
              href="/assistant"
              className="neon-button inline-block px-8 py-3"
            >
              Записаться на приём
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}

        {/* Инфо блок */}
        {appointments.length > 0 && (
          <div className="mt-12 cyber-card p-6">
            <h3 className="text-xl font-bold mb-4">ℹ️ Важная информация</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Приходите на приём за 10-15 минут до назначенного времени</li>
              <li>• Возьмите с собой паспорт и полис ОМС</li>
              <li>• Если не можете прийти, отмените запись заранее</li>
              <li>• При опоздании более чем на 15 минут приём может быть отменён</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
