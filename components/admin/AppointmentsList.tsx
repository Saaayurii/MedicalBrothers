'use client';

import type { Appointment, Doctor, Patient } from '@prisma/client';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

export default function AppointmentsList({ appointments }: { appointments: AppointmentWithRelations[] }) {
  return (
    <div className="cyber-card p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">
        📋 Предстоящие записи
      </h2>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {appointments.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-4">📭</p>
            <p>Нет предстоящих записей</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 hover:border-blue-400/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{appointment.doctor.name}</h3>
                  <p className="text-sm text-gray-400">{appointment.doctor.specialty}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                <div>
                  <span className="text-gray-400">Пациент:</span>
                  <p className="font-semibold">{appointment.patient?.name || 'Не указан'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Телефон:</span>
                  <p className="font-semibold">{appointment.patient?.phone || 'Не указан'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Дата:</span>
                  <p className="font-semibold">{formatDate(appointment.appointmentDate)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Время:</span>
                  <p className="font-semibold">{formatTime(appointment.appointmentTime)}</p>
                </div>
              </div>

              {appointment.symptoms && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="text-gray-400 text-xs">Симптомы:</span>
                  <p className="text-sm mt-1">{appointment.symptoms}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-sm transition-all">
                  ✓ Подтвердить
                </button>
                <button className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all">
                  ✗ Отменить
                </button>
              </div>
            </div>
          ))
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
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
