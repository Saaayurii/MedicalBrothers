import Link from 'next/link';
import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export default async function AppointmentsPage() {
  noStore();

  // Получаем все будущие записи
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
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
              <div
                key={appointment.id}
                className="cyber-card p-6 hover:border-cyan-400/50 transition-all"
              >
                {/* Статус */}
                <div className="flex items-center justify-between mb-4">
                  <StatusBadge status={appointment.status} />
                  <span className="text-sm text-gray-500">#{appointment.id}</span>
                </div>

                {/* Врач */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{appointment.doctor.name}</h3>
                  <p className="text-sm text-cyan-400">{appointment.doctor.specialty}</p>
                </div>

                {/* Дата и время */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
                  <div>
                    <p className="text-xs text-gray-400">Дата</p>
                    <p className="font-semibold">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Время</p>
                    <p className="font-semibold">{formatTime(appointment.appointmentTime)}</p>
                  </div>
                </div>

                {/* Пациент */}
                {appointment.patient && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400">Пациент</p>
                    <p className="font-semibold">{appointment.patient.name}</p>
                    <p className="text-sm text-gray-500">{appointment.patient.phone}</p>
                  </div>
                )}

                {/* Симптомы */}
                {appointment.symptoms && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Причина визита</p>
                    <p className="text-sm">{appointment.symptoms}</p>
                  </div>
                )}

                {/* Действия */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-all">
                    Подробнее
                  </button>
                  {appointment.status === 'scheduled' && (
                    <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all">
                      Отменить
                    </button>
                  )}
                </div>
              </div>
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

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Запланирована', color: 'blue' },
    confirmed: { label: 'Подтверждена', color: 'green' },
    completed: { label: 'Завершена', color: 'gray' },
    cancelled: { label: 'Отменена', color: 'red' },
    no_show: { label: 'Не пришёл', color: 'orange' },
  };

  const config = statusConfig[status] || { label: status, color: 'gray' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`}>
      {config.label}
    </span>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
