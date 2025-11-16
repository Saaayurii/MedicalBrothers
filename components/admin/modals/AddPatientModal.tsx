'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/Modal';
import { addPatientAction } from '@/app/actions/admin';

const patientSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(255),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      if (data.email) formData.append('email', data.email);
      if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
      if (data.address) formData.append('address', data.address);

      const result = await addPatientAction(formData);

      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message || 'Пациент добавлен' });
        reset();
        setTimeout(() => {
          onClose();
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Ошибка при добавлении' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Добавить нового пациента" maxWidth="lg">
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

        {/* ФИО */}
        <div>
          <label className="block text-sm font-medium mb-2">
            ФИО <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Иванов Иван Иванович"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
        </div>

        {/* Телефон */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Телефон <span className="text-red-400">*</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+7 (999) 123-45-67"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="patient@example.com"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        {/* Дата рождения */}
        <div>
          <label className="block text-sm font-medium mb-2">Дата рождения</label>
          <input
            {...register('dateOfBirth')}
            type="date"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>}
        </div>

        {/* Адрес */}
        <div>
          <label className="block text-sm font-medium mb-2">Адрес</label>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
          {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>}
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
            {isSubmitting ? 'Добавление...' : 'Добавить пациента'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
