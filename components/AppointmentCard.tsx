'use client';

import { useState } from 'react';
import type { Appointment, Doctor, Patient } from '@prisma/client';
import { cancelAppointmentAction, confirmAppointmentAction } from '@/app/actions/admin';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
}

export default function AppointmentCard({ appointment: initialAppointment }: AppointmentCardProps) {
  const [appointment, setAppointment] = useState(initialAppointment);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancel = async () => {
    if (!confirm('Вы уверены, что хотите отменить запись?')) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('appointmentId', appointment.id.toString());

      const result = await cancelAppointmentAction(formData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Запись успешно отменена' });
        setAppointment({ ...appointment, status: 'cancelled' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка при отмене' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('appointmentId', appointment.id.toString());

      const result = await confirmAppointmentAction(formData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Запись подтверждена' });
        setAppointment({ ...appointment, status: 'confirmed' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка при подтверждении' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cyber-card p-6 hover:border-cyan-400/50 transition-all">
      {/* Сообщение */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

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
        {appointment.status === 'scheduled' && (
          <>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Обработка...' : 'Подтвердить'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '...' : 'Отменить'}
            </button>
          </>
        )}
        {appointment.status === 'confirmed' && (
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Обработка...' : 'Отменить запись'}
          </button>
        )}
        {(appointment.status === 'cancelled' || appointment.status === 'completed') && (
          <div className="flex-1 px-4 py-2 text-center text-sm text-gray-500">
            {appointment.status === 'cancelled' ? 'Запись отменена' : 'Приём завершён'}
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
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`}
    >
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
