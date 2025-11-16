'use client';

interface Consultation {
  id: number;
  symptoms: string;
  aiResponse: string | null;
  recommendedSpecialty: string | null;
  severityLevel: string | null;
  createdAt: Date;
  patient: {
    name: string | null;
    phone: string | null;
  } | null;
}

export default function RecentConsultations({ consultations }: { consultations: Consultation[] }) {
  if (consultations.length === 0) return null;

  return (
    <div className="cyber-card p-6">
      <h3 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2">
        💬 Недавние консультации
        <span className="text-sm bg-purple-500/20 px-3 py-1 rounded-full">
          {consultations.length} записей
        </span>
      </h3>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400/50 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-lg">
                  {consultation.patient?.name || 'Анонимный пациент'}
                </h4>
                {consultation.patient?.phone && (
                  <p className="text-sm text-gray-400">{consultation.patient.phone}</p>
                )}
              </div>
              <div className="text-right">
                {consultation.severityLevel && (
                  <SeverityBadge level={consultation.severityLevel} />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(consultation.createdAt)}
                </p>
              </div>
            </div>

            {/* Symptoms */}
            <div className="mb-3">
              <span className="text-xs text-gray-400">Симптомы:</span>
              <p className="text-sm mt-1">{consultation.symptoms}</p>
            </div>

            {/* AI Response */}
            {consultation.aiResponse && (
              <div className="mb-3 pt-3 border-t border-purple-500/20">
                <span className="text-xs text-purple-400">Рекомендация AI:</span>
                <p className="text-sm mt-1 text-gray-300">{consultation.aiResponse.substring(0, 150)}...</p>
              </div>
            )}

            {/* Recommended Specialty */}
            {consultation.recommendedSpecialty && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-cyan-400">→</span>
                <span>Рекомендован:</span>
                <span className="font-semibold text-cyan-400">{consultation.recommendedSpecialty}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string }> = {
    low: { label: 'Низкая', color: 'green' },
    medium: { label: 'Средняя', color: 'yellow' },
    high: { label: 'Высокая', color: 'orange' },
    emergency: { label: 'Экстренная', color: 'red' },
  };

  const { label, color } = config[level] || { label: level, color: 'gray' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`}>
      {label}
    </span>
  );
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;

  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
