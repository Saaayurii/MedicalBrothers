'use client';

interface EmergencyCall {
  id: number;
  patient_name: string;
  phone: string;
  description: string;
  location: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function EmergencyCalls({ emergencies }: { emergencies: EmergencyCall[] }) {
  return (
    <div className="cyber-card p-6 mb-8 border-2 border-red-500/50 animate-pulse-slow">
      <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-2">
        🚨 Экстренные вызовы
        <span className="text-sm bg-red-500/20 px-3 py-1 rounded-full">
          {emergencies.length} активных
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emergencies.map((emergency) => (
          <div
            key={emergency.id}
            className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/50 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{emergency.patient_name || 'Анонимный'}</h3>
                <p className="text-sm text-gray-400">{emergency.phone || 'Номер не указан'}</p>
              </div>
              <PriorityBadge priority={emergency.priority} />
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-300">{emergency.description}</p>
            </div>

            {emergency.location && (
              <div className="mb-3">
                <span className="text-xs text-gray-400">Местоположение:</span>
                <p className="text-sm">{emergency.location}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 mb-3">
              {formatTime(emergency.created_at)}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-green-500/30 hover:bg-green-500/40 border border-green-500/50 rounded-lg text-sm transition-all">
                ✓ Обработан
              </button>
              <button className="px-3 py-2 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg text-sm transition-all">
                📞 Позвонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Низкий', color: 'green' },
    medium: { label: 'Средний', color: 'yellow' },
    high: { label: 'Высокий', color: 'orange' },
    critical: { label: 'Критический', color: 'red' },
  };

  const config = priorityConfig[priority] || { label: priority, color: 'gray' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`}>
      {config.label}
    </span>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
