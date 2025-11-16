'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/Modal';
import { addDoctorAction } from '@/app/actions/admin';

const doctorSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  specialty: z.string().min(2, 'Минимум 2 символа'),
  experienceYears: z.number().min(0).max(70),
  phone: z.string().optional(),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  bio: z.string().optional(),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDoctorModal({ isOpen, onClose }: AddDoctorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      experienceYears: 0,
    },
  });

  const onSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('specialty', data.specialty);
      formData.append('experienceYears', data.experienceYears.toString());
      if (data.phone) formData.append('phone', data.phone);
      if (data.email) formData.append('email', data.email);
      if (data.bio) formData.append('bio', data.bio);

      const result = await addDoctorAction(formData);

      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message || 'Врач добавлен' });
        reset();
        setTimeout(() => {
          onClose();
          setSubmitMessage(null);
        }, 1500);
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
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Добавить врача" maxWidth="lg">
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

        {/* Имя */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Имя врача <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Иван Петров"
          />
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
        </div>

        {/* Специальность */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Специальность <span className="text-red-400">*</span>
          </label>
          <input
            {...register('specialty')}
            type="text"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Кардиолог"
          />
          {errors.specialty && <p className="mt-1 text-sm text-red-400">{errors.specialty.message}</p>}
        </div>

        {/* Опыт работы */}
        <div>
          <label className="block text-sm font-medium mb-2">Опыт работы (лет)</label>
          <input
            {...register('experienceYears', { valueAsNumber: true })}
            type="number"
            min="0"
            max="70"
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="15"
          />
          {errors.experienceYears && <p className="mt-1 text-sm text-red-400">{errors.experienceYears.message}</p>}
        </div>

        {/* Телефон и Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="doctor@clinic.ru"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>
        </div>

        {/* Биография */}
        <div>
          <label className="block text-sm font-medium mb-2">Биография</label>
          <textarea
            {...register('bio')}
            rows={3}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Специалист по сердечно-сосудистым заболеваниям..."
          />
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
          <button
            type="submit"
            className="flex-1 neon-button py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить врача'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
