'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Appointment, Doctor, Patient } from '@prisma/client';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

interface DashboardProps {
  appointments: AppointmentWithRelations[];
  doctors: Doctor[];
}

export default function Dashboard({ appointments, doctors }: DashboardProps) {
  // Подсчёт статистики
  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const noShow = appointments.filter((a) => a.status === 'no_show').length;
    const activeDoctors = doctors.filter((d) => d.isActive).length;

    // Уникальные пациенты
    const uniquePatients = new Set(
      appointments.filter((a) => a.patient).map((a) => a.patient!.id)
    ).size;

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      activeDoctors,
      uniquePatients,
    };
  }, [appointments, doctors]);

  // Данные для графика статусов
  const statusData = useMemo(() => {
    return [
      { name: 'Запланировано', value: stats.scheduled, color: '#3b82f6' },
      { name: 'Подтверждено', value: stats.confirmed, color: '#10b981' },
      { name: 'Завершено', value: stats.completed, color: '#6b7280' },
      { name: 'Отменено', value: stats.cancelled, color: '#ef4444' },
      { name: 'Не пришёл', value: stats.noShow, color: '#f59e0b' },
    ];
  }, [stats]);

  // Данные для графика записей по дням (последние 7 дней)
  const dailyAppointments = useMemo(() => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = appointments.filter((a) => {
        const appDate = new Date(a.appointmentDate);
        return appDate >= date && appDate < nextDay;
      }).length;

      last7Days.push({
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        Записей: count,
      });
    }

    return last7Days;
  }, [appointments]);

  // Производительность врачей (топ-5)
  const doctorPerformance = useMemo(() => {
    const doctorStats = doctors.map((doctor) => {
      const doctorAppointments = appointments.filter((a) => a.doctorId === doctor.id);
      const completed = doctorAppointments.filter((a) => a.status === 'completed').length;

      return {
        name: doctor.name.split(' ')[0], // Только имя для компактности
        Записей: doctorAppointments.length,
        Завершено: completed,
      };
    });

    return doctorStats
      .sort((a, b) => b.Записей - a.Записей)
      .slice(0, 5);
  }, [appointments, doctors]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-cyan-400">📊 Панель аналитики</h2>
        <p className="text-sm text-gray-400">Обновлено: {new Date().toLocaleString('ru-RU')}</p>
      </div>

      {/* Карточки с ключевыми метриками */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Всего записей"
          value={stats.total}
          icon="📋"
          color="cyan"
        />
        <MetricCard
          title="Завершённых"
          value={stats.completed}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Активных врачей"
          value={stats.activeDoctors}
          icon="👨‍⚕️"
          color="purple"
        />
        <MetricCard
          title="Пациентов"
          value={stats.uniquePatients}
          icon="👥"
          color="blue"
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График записей по дням */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Записи за последние 7 дней</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyAppointments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Записей"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Распределение по статусам */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Распределение по статусам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Производительность врачей */}
        <div className="cyber-card p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Топ-5 врачей по записям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Записей" fill="#06b6d4" />
              <Bar dataKey="Завершено" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="cyber-card p-6">
        <h3 className="text-lg font-bold mb-4 text-cyan-400">Детальная статистика</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatItem label="Запланировано" value={stats.scheduled} color="blue" />
          <StatItem label="Подтверждено" value={stats.confirmed} color="green" />
          <StatItem label="Завершено" value={stats.completed} color="gray" />
          <StatItem label="Отменено" value={stats.cancelled} color="red" />
          <StatItem label="Не пришёл" value={stats.noShow} color="orange" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    blue: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-6 hover:border-opacity-50 transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-4xl font-bold text-${color}-400`}>{value}</span>
      </div>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
      <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
