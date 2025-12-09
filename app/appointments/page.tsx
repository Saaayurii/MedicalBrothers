import Link from 'next/link';
import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import AppointmentCard from '@/components/AppointmentCard';
import Footer from '@/components/Footer';
import AppointmentsHeader from '@/components/AppointmentsHeader';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20 md:pb-0">
      {/* Шапка */}
      <AppointmentsHeader />

      {/* Основной контент */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-center">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Предстоящие записи
          </span>
        </h1>

        {appointments.length === 0 ? (
          <div className="cyber-card p-6 sm:p-8 md:p-12 text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">📅</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Нет предстоящих записей</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
              У вас пока нет запланированных визитов к врачам
            </p>
            <Link
              href="/assistant"
              className="neon-button inline-block px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            >
              Записаться на приём
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}

        {/* Инфо блок */}
        {appointments.length > 0 && (
          <div className="mt-8 sm:mt-12 cyber-card p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">ℹ️ Важная информация</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>• Приходите на приём за 10-15 минут до назначенного времени</li>
              <li>• Возьмите с собой паспорт и полис ОМС</li>
              <li>• Если не можете прийти, отмените запись заранее</li>
              <li>• При опоздании более чем на 15 минут приём может быть отменён</li>
            </ul>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
