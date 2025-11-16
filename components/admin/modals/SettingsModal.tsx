'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/Modal';

const settingsSchema = z.object({
  clinicName: z.string().min(2, 'Минимум 2 символа').max(255),
  address: z.string().min(5, 'Введите полный адрес'),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  email: z.string().email('Некорректный email'),
  workingHoursStart: z.string().default('09:00'),
  workingHoursEnd: z.string().default('20:00'),
  workingDays: z.array(z.number()).min(1, 'Выберите хотя бы один рабочий день'),
  slotDuration: z.number().min(15).max(120).default(30),
  allowOnlineBooking: z.boolean().default(true),
  requireConfirmation: z.boolean().default(true),
  sendNotifications: z.boolean().default(true),
  emergencyPhone: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'booking' | 'notifications'>('general');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clinicName: 'MedicalBrothers',
      address: 'г. Москва, ул. Примерная, д. 1',
      phone: '+7 (495) 123-45-67',
      email: 'info@medicalbrothers.ru',
      workingHoursStart: '09:00',
      workingHoursEnd: '20:00',
      workingDays: [1, 2, 3, 4, 5], // Пн-Пт
      slotDuration: 30,
      allowOnlineBooking: true,
      requireConfirmation: true,
      sendNotifications: true,
      emergencyPhone: '103',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // TODO: Сохранение настроек через API/Server Action
      // const result = await saveSettingsAction(data);

      // Симуляция сохранения
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitMessage({ type: 'success', text: 'Настройки успешно сохранены' });

      setTimeout(() => {
        onClose();
        setSubmitMessage(null);
      }, 1500);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Произошла ошибка при сохранении' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 0, label: 'Вс' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Настройки клиники" maxWidth="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Табы */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'general'
                ? 'bg-cyan-500/20 border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Общие
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'schedule'
                ? 'bg-cyan-500/20 border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Расписание
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'booking'
                ? 'bg-cyan-500/20 border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Запись
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'notifications'
                ? 'bg-cyan-500/20 border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Уведомления
          </button>
        </div>

        {/* Вкладка: Общие */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Название клиники <span className="text-red-400">*</span>
              </label>
              <input
                {...register('clinicName')}
                type="text"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.clinicName && <p className="mt-1 text-sm text-red-400">{errors.clinicName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Адрес <span className="text-red-400">*</span>
              </label>
              <input
                {...register('address')}
                type="text"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Телефон <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Экстренный телефон</label>
              <input
                {...register('emergencyPhone')}
                type="tel"
                placeholder="103"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
        )}

        {/* Вкладка: Расписание */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Время начала работы</label>
                <input
                  {...register('workingHoursStart')}
                  type="time"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Время окончания работы</label>
                <input
                  {...register('workingHoursEnd')}
                  type="time"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Рабочие дни <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <label key={day.value} className="flex items-center justify-center cursor-pointer">
                    <input
                      {...register('workingDays')}
                      type="checkbox"
                      value={day.value}
                      className="hidden peer"
                    />
                    <div className="w-full px-3 py-2 text-center bg-slate-800/50 border border-slate-700 rounded-lg peer-checked:bg-cyan-500/20 peer-checked:border-cyan-400 peer-checked:text-cyan-400 transition-all">
                      {day.label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.workingDays && <p className="mt-1 text-sm text-red-400">{errors.workingDays.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Длительность слота по умолчанию (минуты)</label>
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
          </div>
        )}

        {/* Вкладка: Запись */}
        {activeTab === 'booking' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Онлайн-запись</p>
                <p className="text-sm text-gray-400">Разрешить пациентам записываться онлайн</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register('allowOnlineBooking')} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Требовать подтверждение</p>
                <p className="text-sm text-gray-400">Записи требуют подтверждения администратором</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register('requireConfirmation')} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        )}

        {/* Вкладка: Уведомления */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Отправлять уведомления</p>
                <p className="text-sm text-gray-400">Email и SMS уведомления для пациентов</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register('sendNotifications')} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
              <p className="text-blue-400">ℹ️ Настройки уведомлений будут применены к новым записям</p>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-4 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button type="submit" className="flex-1 neon-button py-2" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
