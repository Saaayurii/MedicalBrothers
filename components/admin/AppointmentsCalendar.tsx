'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Doctor, Patient } from '@prisma/client';
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

interface AppointmentsCalendarProps {
  appointments: AppointmentWithRelations[];
}

export default function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Получаем дни текущего месяца
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);

    // День недели первого дня (0-воскресенье, 1-понедельник, ...)
    const firstDayWeekday = firstDay.getDay();
    // Корректируем для понедельника как первого дня недели
    const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const days: (Date | null)[] = [];

    // Добавляем пустые дни в начале
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Добавляем дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentDate]);

  // Группируем записи по датам
  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, AppointmentWithRelations[]>();

    appointments.forEach((appointment) => {
      const dateKey = new Date(appointment.appointmentDate).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(appointment);
    });

    return grouped;
  }, [appointments]);

  // Получаем записи для выбранной даты
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return appointmentsByDate.get(dateKey) || [];
  }, [selectedDate, appointmentsByDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">📅 Календарь записей</h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg transition-all text-sm"
          >
            Сегодня
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="text-center text-lg font-semibold mb-4 text-cyan-400 capitalize">
        {monthName}
      </div>

      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = day.toDateString();
          const dayAppointments = appointmentsByDate.get(dateKey) || [];
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = selectedDate?.toDateString() === dateKey;

          return (
            <button
              key={dateKey}
              onClick={() => handleDateClick(day)}
              className={`aspect-square p-2 rounded-lg border transition-all text-sm ${
                isToday
                  ? 'bg-cyan-500/30 border-cyan-400 font-bold'
                  : isSelected
                  ? 'bg-blue-500/20 border-blue-400'
                  : dayAppointments.length > 0
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className={isToday ? 'text-cyan-400' : ''}>{day.getDate()}</div>
                {dayAppointments.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {dayAppointments.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-green-400 rounded-full" />
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-[8px] text-green-400">+{dayAppointments.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Записи на выбранную дату */}
      {selectedDate && (
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg font-bold mb-3 text-cyan-400">
            Записи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>

          {selectedDateAppointments.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Нет записей на эту дату</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDateAppointments
                .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime())
                .map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => handleAppointmentClick(appointment)}
                    className="w-full text-left p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{appointment.doctor.name}</p>
                        <p className="text-sm text-gray-400">{appointment.doctor.specialty}</p>
                        {appointment.patient && (
                          <p className="text-sm text-gray-500 mt-1">{appointment.patient.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-cyan-400">
                          {new Date(appointment.appointmentTime).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно деталей */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onUpdate={(updated) => setSelectedAppointment(updated)}
        />
      )}
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
    <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-600 mt-1 inline-block">
      {config.label}
    </span>
  );
}
