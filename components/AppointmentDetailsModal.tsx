'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import type { Appointment, Doctor, Patient } from '@prisma/client';
import { updateAppointmentStatusAction } from '@/app/actions/admin';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentWithRelations;
  onUpdate?: (updatedAppointment: AppointmentWithRelations) => void;
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment: initialAppointment,
  onUpdate,
}: AppointmentDetailsModalProps) {
  const [appointment, setAppointment] = useState(initialAppointment);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsProcessing(true);
    setMessage(null);

    try {

      const result = await updateAppointmentStatusAction(appointment.id, newStatus);

      if (result.success) {
        const updatedAppointment = { ...appointment, status: newStatus };
        setAppointment(updatedAppointment);
        setMessage({ type: 'success', text: `Статус изменён на "${getStatusLabel(newStatus)}"` });

        if (onUpdate) {
          onUpdate(updatedAppointment);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка при изменении статуса' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📋 Детали записи" maxWidth="2xl">
      <div className="space-y-6">
        {/* Сообщение */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Левая колонка - Врач */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4 text-cyan-400">👨‍⚕️ Врач</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">ФИО</p>
                  <p className="text-lg font-semibold">{appointment.doctor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Специальность</p>
                  <p className="text-cyan-400">{appointment.doctor.specialty}</p>
                </div>
                {appointment.doctor.experienceYears && (
                  <div>
                    <p className="text-xs text-gray-400">Опыт работы</p>
                    <p>{appointment.doctor.experienceYears} лет</p>
                  </div>
                )}
                {appointment.doctor.phone && (
                  <div>
                    <p className="text-xs text-gray-400">Телефон</p>
                    <p>{appointment.doctor.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка - Пациент */}
          <div className="space-y-4">
            {appointment.patient ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 text-cyan-400">👤 Пациент</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">ФИО</p>
                    <p className="text-lg font-semibold">{appointment.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Телефон</p>
                    <p>{appointment.patient.phone}</p>
                  </div>
                  {appointment.patient.email && (
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p>{appointment.patient.email}</p>
                    </div>
                  )}
                  {appointment.patient.dateOfBirth && (
                    <div>
                      <p className="text-xs text-gray-400">Дата рождения</p>
                      <p>{formatDate(appointment.patient.dateOfBirth)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-gray-400">Информация о пациенте отсутствует</p>
              </div>
            )}
          </div>
        </div>

        {/* Информация о приёме */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">📅 Информация о приёме</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Дата</p>
              <p className="font-semibold">{formatDate(appointment.appointmentDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Время</p>
              <p className="font-semibold">{formatTime(appointment.appointmentTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ID записи</p>
              <p className="font-mono">#{appointment.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Статус</p>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        </div>

        {/* Симптомы/Причина визита */}
        {appointment.symptoms && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-2 text-cyan-400">🩺 Причина визита</h3>
            <p className="text-gray-300">{appointment.symptoms}</p>
          </div>
        )}

        {/* Заметки */}
        {appointment.notes && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-2 text-cyan-400">📝 Заметки</h3>
            <p className="text-gray-300">{appointment.notes}</p>
          </div>
        )}

        {/* Управление статусом */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">⚙️ Изменить статус</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => handleStatusChange('scheduled')}
              disabled={isProcessing || appointment.status === 'scheduled'}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Запланирована
            </button>
            <button
              onClick={() => handleStatusChange('confirmed')}
              disabled={isProcessing || appointment.status === 'confirmed'}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Подтверждена
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={isProcessing || appointment.status === 'completed'}
              className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Завершена
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={isProcessing || appointment.status === 'cancelled'}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отменена
            </button>
            <button
              onClick={() => handleStatusChange('no_show')}
              disabled={isProcessing || appointment.status === 'no_show'}
              className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Не пришёл
            </button>
          </div>
        </div>

        {/* Временные метки */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">🕒 Системная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Создана</p>
              <p>{formatDateTime(appointment.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Последнее обновление</p>
              <p>{formatDateTime(appointment.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
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
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`}
    >
      {config.label}
    </span>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: 'Запланирована',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена',
    no_show: 'Не пришёл',
  };
  return labels[status] || status;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
