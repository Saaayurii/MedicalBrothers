'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/Modal';
import { generateTimeSlotsAction } from '@/app/actions/admin';
import type { Doctor } from '@prisma/client';

const slotsSchema = z.object({
  doctorId: z.number().min(1, 'Выберите врача'),
  startDate: z.string().min(1, 'Укажите дату начала'),
  endDate: z.string().min(1, 'Укажите дату окончания'),
  startTime: z.string().default('09:00'),
  endTime: z.string().default('17:00'),
  slotDuration: z.number().min(15).max(120).default(30),
});

type SlotsFormData = z.infer<typeof slotsSchema>;

interface GenerateSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
}

export default function GenerateSlotsModal({ isOpen, onClose, doctors }: GenerateSlotsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SlotsFormData>({
    resolver: zodResolver(slotsSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
    },
  });

  const onSubmit = async (data: SlotsFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('doctorId', data.doctorId.toString());
      formData.append('startDate', data.startDate);
      formData.append('endDate', data.endDate);
      formData.append('startTime', data.startTime);
      formData.append('endTime', data.endTime);
      formData.append('slotDuration', data.slotDuration.toString());

      const result = await generateTimeSlotsAction(formData);

      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message || 'Слоты созданы' });
        reset();
        setTimeout(() => {
          onClose();
          setSubmitMessage(null);
        }, 2000);
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Ошибка' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📅 Создать временные слоты" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Сообщение */}
        {submitMessage && (
          <div
            className={`p-4 rounded-lg ${
              submitMessage.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        {/* Выбор врача */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Врач <span className="text-red-400">*</span>
          </label>
          <select
            {...register('doctorId', { valueAsNumber: true })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">Выберите врача</option>
            {doctors.filter(d => d.isActive).map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialty}
              </option>
            ))}
          </select>
          {errors.doctorId && <p className="mt-1 text-sm text-red-400">{errors.doctorId.message}</p>}
        </div>

        {/* Диапазон дат */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Дата начала <span className="text-red-400">*</span>
            </label>
            <input
              {...register('startDate')}
              type="date"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-400">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Дата окончания <span className="text-red-400">*</span>
            </label>
            <input
              {...register('endDate')}
              type="date"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-400">{errors.endDate.message}</p>}
          </div>
        </div>

        {/* Рабочее время */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Начало приёма</label>
            <input
              {...register('startTime')}
              type="time"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Конец приёма</label>
            <input
              {...register('endTime')}
              type="time"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {/* Длительность слота */}
        <div>
          <label className="block text-sm font-medium mb-2">Длительность слота (минуты)</label>
          <select
            {...register('slotDuration', { valueAsNumber: true })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value={15}>15 минут</option>
            <option value={30}>30 минут</option>
            <option value={45}>45 минут</option>
            <option value={60}>1 час</option>
          </select>
        </div>

        {/* Информация */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
          <p className="text-blue-400">ℹ️ Слоты будут созданы только для рабочих дней (Пн-Пт)</p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button type="submit" className="flex-1 neon-button py-2" disabled={isSubmitting}>
            {isSubmitting ? 'Создание...' : 'Создать слоты'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
