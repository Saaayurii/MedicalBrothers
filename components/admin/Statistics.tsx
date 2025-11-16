interface StatsProps {
  stats: {
    today_appointments: number;
    active_doctors: number;
    today_consultations: number;
    pending_emergencies: number;
  };
}

export default function Statistics({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon="📅"
        label="Записей сегодня"
        value={stats.today_appointments}
        color="cyan"
        trend="+12%"
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
        trend="+8%"
      />
      <StatCard
        icon="🚨"
        label="Экстренных вызовов"
        value={stats.pending_emergencies}
        color="red"
        pulse={stats.pending_emergencies > 0}
      />
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
