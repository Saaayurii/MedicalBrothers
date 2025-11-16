interface StatsProps {
  stats: {
    today_appointments: number;
    active_doctors: number;
    today_consultations: number;
    pending_emergencies: number;
    total_patients?: number;
    this_week_appointments?: number;
  };
}

export default function Statistics({ stats }: StatsProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 text-cyan-400">Статистика в реальном времени</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon="📅"
          label="Записей сегодня"
          value={stats.today_appointments}
          color="cyan"
        />
        <StatCard
          icon="👨‍⚕️"
          label="Активных врачей"
          value={stats.active_doctors}
          color="purple"
        />
        <StatCard
          icon="💬"
          label="Консультаций"
          value={stats.today_consultations}
          color="green"
        />
        <StatCard
          icon="🚨"
          label="Экстренных"
          value={stats.pending_emergencies}
          color="red"
          pulse={stats.pending_emergencies > 0}
        />
        {stats.total_patients !== undefined && (
          <StatCard
            icon="👥"
            label="Всего пациентов"
            value={stats.total_patients}
            color="blue"
          />
        )}
        {stats.this_week_appointments !== undefined && (
          <StatCard
            icon="📊"
            label="За неделю"
            value={stats.this_week_appointments}
            color="pink"
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  trend,
  pulse
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  trend?: string;
  pulse?: boolean;
}) {
  return (
    <div className={`cyber-card p-6 ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{icon}</span>
        {trend && (
          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 text-${color}-400`}>
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
