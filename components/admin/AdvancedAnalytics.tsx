'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Appointment {
  id: number;
  appointmentDate: Date;
  appointmentTime: Date;
  status: string;
  doctor: {
    id: number;
    name: string;
    specialty: string;
  };
}

interface AdvancedAnalyticsProps {
  appointments: Appointment[];
}

// Pricing for different specialties (in rubles)
const SPECIALTY_PRICES: Record<string, number> = {
  'Кардиолог': 3000,
  'Терапевт': 2000,
  'Невролог': 2500,
  'Педиатр': 1800,
  'Хирург': 4000,
  'Эндокринолог': 2800,
  'Офтальмолог': 2200,
};

export default function AdvancedAnalytics({ appointments }: AdvancedAnalyticsProps) {
  // Revenue analysis (completed appointments only)
  const revenueData = useMemo(() => {
    const last30Days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return (
          aptDate.toDateString() === date.toDateString() && apt.status === 'completed'
        );
      });

      const revenue = dayAppointments.reduce((sum, apt) => {
        return sum + (SPECIALTY_PRICES[apt.doctor.specialty] || 2000);
      }, 0);

      last30Days.push({
        date: dateStr,
        Доход: revenue,
        Записей: dayAppointments.length,
      });
    }

    return last30Days;
  }, [appointments]);

  // Calculate forecast (simple moving average)
  const forecastData = useMemo(() => {
    const revenueValues = revenueData.map((d) => d.Доход);
    const windowSize = 7; // 7-day moving average

    const forecast = [];
    for (let i = 0; i < revenueData.length; i++) {
      const window = revenueValues.slice(Math.max(0, i - windowSize + 1), i + 1);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;

      forecast.push({
        date: revenueData[i].date,
        Факт: revenueData[i].Доход,
        Прогноз: Math.round(avg),
      });
    }

    // Add 7 days forecast
    const lastAvg = forecast[forecast.length - 1].Прогноз;
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

      forecast.push({
        date: dateStr,
        Факт: 0,
        Прогноз: Math.round(lastAvg),
      });
    }

    return forecast;
  }, [revenueData]);

  // Doctor popularity (by number of completed appointments)
  const doctorPopularity = useMemo(() => {
    const doctorStats = new Map<number, { name: string; count: number; revenue: number }>();

    appointments
      .filter((apt) => apt.status === 'completed')
      .forEach((apt) => {
        const existing = doctorStats.get(apt.doctor.id) || {
          name: apt.doctor.name,
          count: 0,
          revenue: 0,
        };

        existing.count++;
        existing.revenue += SPECIALTY_PRICES[apt.doctor.specialty] || 2000;

        doctorStats.set(apt.doctor.id, existing);
      });

    return Array.from(doctorStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((doctor) => ({
        Врач: doctor.name.split(' ')[0] + ' ' + doctor.name.split(' ')[1][0] + '.',
        'Приёмов': doctor.count,
        'Доход (₽)': doctor.revenue,
      }));
  }, [appointments]);

  // Heatmap data (hour of day vs day of week)
  const heatmapData = useMemo(() => {
    const hourDayMatrix: number[][] = Array(24)
      .fill(0)
      .map(() => Array(7).fill(0));

    appointments.forEach((apt) => {
      const date = new Date(apt.appointmentDate);
      const time = new Date(apt.appointmentTime);
      const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
      const hour = time.getHours();

      if (hour >= 0 && hour < 24 && dayOfWeek >= 0 && dayOfWeek < 7) {
        hourDayMatrix[hour][dayOfWeek]++;
      }
    });

    return hourDayMatrix;
  }, [appointments]);

  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const maxHeatmapValue = Math.max(...heatmapData.flat());

  return (
    <div className="space-y-8">
      {/* Revenue and Forecast */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold mb-4 text-cyan-400">💰 Доходы и Прогноз (30 дней)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Факт"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Прогноз"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Trend */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold mb-4 text-cyan-400">📈 Динамика доходов (последние 30 дней)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Доход" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Doctor Popularity */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold mb-4 text-cyan-400">🏆 Популярность врачей</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={doctorPopularity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="Врач" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="Приёмов" fill="#3b82f6" />
            <Bar yAxisId="right" dataKey="Доход (₽)" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold mb-4 text-cyan-400">🔥 Загруженность по часам</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Days header */}
            <div className="flex">
              <div className="w-16"></div>
              {days.map((day) => (
                <div key={day} className="w-12 text-center text-xs font-semibold text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {heatmapData.map((hourData, hour) => {
              // Only show working hours (8-18)
              if (hour < 8 || hour > 18) return null;

              return (
                <div key={hour} className="flex items-center">
                  <div className="w-16 text-xs text-gray-400 text-right pr-2">
                    {hour}:00
                  </div>
                  {hourData.map((count, dayIndex) => {
                    const intensity = maxHeatmapValue > 0 ? count / maxHeatmapValue : 0;
                    const bgColor = `rgba(6, 182, 212, ${intensity})`;

                    return (
                      <div
                        key={dayIndex}
                        className="w-12 h-8 border border-slate-700 flex items-center justify-center text-xs transition-all hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: bgColor }}
                        title={`${days[dayIndex]} ${hour}:00 - ${count} записей`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Темнее = больше записей. Наведите курсор для деталей
        </p>
      </div>
    </div>
  );
}
