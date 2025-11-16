'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { unparse } from 'papaparse';
import Modal from '@/components/Modal';
import { generateReportAction } from '@/app/actions/admin';

const reportSchema = z.object({
  reportType: z.enum(['daily', 'weekly', 'monthly', 'doctors_performance', 'appointments_stats', 'revenue']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  doctorId: z.number().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  type: string;
  period: string;
  data: {
    total_appointments?: number;
    completed_appointments?: number;
    cancelled_appointments?: number;
    total_revenue?: number;
    new_patients?: number;
    doctors?: Array<{
      name: string;
      specialty: string;
      appointments: number;
      completed: number;
      rating?: number;
    }>;
    daily_stats?: Array<{
      date: string;
      appointments: number;
      revenue: number;
    }>;
  };
}

export default function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'daily',
    },
  });

  const reportType = watch('reportType');

  const onSubmit = async (data: ReportFormData) => {
    setIsGenerating(true);
    setSubmitMessage(null);
    setReportData(null);

    try {
      const formData = new FormData();
      formData.append('reportType', data.reportType);
      if (data.startDate) formData.append('startDate', data.startDate);
      if (data.endDate) formData.append('endDate', data.endDate);
      if (data.doctorId) formData.append('doctorId', data.doctorId.toString());

      const result = await generateReportAction(formData);

      if (result.success && result.data) {
        setReportData(result.data as ReportData);
        setSubmitMessage({ type: 'success', text: 'Отчёт успешно сгенерирован' });
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Ошибка генерации отчёта' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Произошла ошибка' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    reset();
    setReportData(null);
    setSubmitMessage(null);
    onClose();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvData: any[] = [];
    let filename = 'report.csv';

    // Формируем данные для CSV в зависимости от типа отчёта
    if (reportData.data.doctors && reportData.data.doctors.length > 0) {
      csvData = reportData.data.doctors.map(doctor => ({
        'Врач': doctor.name,
        'Специальность': doctor.specialty,
        'Записей': doctor.appointments,
        'Завершено': doctor.completed,
        'Рейтинг': doctor.rating || 'N/A',
      }));
      filename = 'doctors_report.csv';
    } else if (reportData.data.daily_stats && reportData.data.daily_stats.length > 0) {
      csvData = reportData.data.daily_stats.map(day => ({
        'Дата': day.date,
        'Записей': day.appointments,
        'Доход (₽)': day.revenue,
      }));
      filename = 'daily_stats.csv';
    } else {
      // Общая статистика
      csvData = [
        {
          'Метрика': 'Всего записей',
          'Значение': reportData.data.total_appointments || 0,
        },
        {
          'Метрика': 'Завершённых записей',
          'Значение': reportData.data.completed_appointments || 0,
        },
        {
          'Метрика': 'Отменённых записей',
          'Значение': reportData.data.cancelled_appointments || 0,
        },
        {
          'Метрика': 'Новых пациентов',
          'Значение': reportData.data.new_patients || 0,
        },
        {
          'Метрика': 'Общий доход (₽)',
          'Значение': reportData.data.total_revenue || 0,
        },
      ];
      filename = `${reportData.type}_report.csv`;
    }

    // Конвертируем в CSV
    const csv = unparse(csvData, {
      delimiter: ',',
      header: true,
    });

    // Создаём и скачиваем файл
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM для корректного отображения UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📊 Генерация отчётов" maxWidth="2xl">
      <div className="space-y-6">
        {/* Форма выбора параметров */}
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

          {/* Тип отчёта */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Тип отчёта <span className="text-red-400">*</span>
            </label>
            <select
              {...register('reportType')}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="daily">Дневной отчёт</option>
              <option value="weekly">Недельный отчёт</option>
              <option value="monthly">Месячный отчёт</option>
              <option value="doctors_performance">Производительность врачей</option>
              <option value="appointments_stats">Статистика записей</option>
              <option value="revenue">Отчёт по доходам</option>
            </select>
            {errors.reportType && <p className="mt-1 text-sm text-red-400">{errors.reportType.message}</p>}
          </div>

          {/* Диапазон дат (для кастомных отчётов) */}
          {(reportType === 'weekly' || reportType === 'monthly' || reportType === 'revenue') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дата начала</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Дата окончания</label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          {/* Кнопка генерации */}
          <button type="submit" className="w-full neon-button py-3" disabled={isGenerating}>
            {isGenerating ? 'Генерация...' : '📊 Сгенерировать отчёт'}
          </button>
        </form>

        {/* Результаты отчёта */}
        {reportData && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Результаты отчёта</h3>

              {/* Общая статистика */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {reportData.data.total_appointments !== undefined && (
                  <StatCard label="Всего записей" value={reportData.data.total_appointments} color="cyan" />
                )}
                {reportData.data.completed_appointments !== undefined && (
                  <StatCard label="Завершённых" value={reportData.data.completed_appointments} color="green" />
                )}
                {reportData.data.cancelled_appointments !== undefined && (
                  <StatCard label="Отменённых" value={reportData.data.cancelled_appointments} color="red" />
                )}
                {reportData.data.new_patients !== undefined && (
                  <StatCard label="Новых пациентов" value={reportData.data.new_patients} color="purple" />
                )}
              </div>

              {/* Производительность врачей */}
              {reportData.data.doctors && reportData.data.doctors.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                  <h4 className="font-bold mb-3 text-cyan-400">Производительность врачей</h4>
                  <div className="space-y-2">
                    {reportData.data.doctors.map((doctor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{doctor.name}</p>
                          <p className="text-sm text-gray-400">{doctor.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-cyan-400">{doctor.appointments} записей</p>
                          <p className="text-sm text-green-400">{doctor.completed} завершено</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Дневная статистика */}
              {reportData.data.daily_stats && reportData.data.daily_stats.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <h4 className="font-bold mb-3 text-cyan-400">Ежедневная статистика</h4>
                  <div className="space-y-2">
                    {reportData.data.daily_stats.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <p className="font-medium">{day.date}</p>
                        <div className="text-right">
                          <p className="text-cyan-400">{day.appointments} записей</p>
                          {day.revenue > 0 && <p className="text-sm text-green-400">{day.revenue} ₽</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-all"
                >
                  📥 Экспорт в CSV
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all"
                >
                  🖨️ Печать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка закрытия */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
      <p className={`text-3xl font-bold mb-1 text-${color}-400`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
