'use client';

export default function QuickActions() {
  const actions = [
    {
      icon: '➕',
      title: 'Добавить врача',
      description: 'Зарегистрировать нового специалиста',
      color: 'cyan',
      action: () => alert('Функция в разработке'),
    },
    {
      icon: '📅',
      title: 'Создать слоты',
      description: 'Сгенерировать временные слоты',
      color: 'blue',
      action: () => alert('Функция в разработке'),
    },
    {
      icon: '👤',
      title: 'Новый пациент',
      description: 'Добавить пациента в базу',
      color: 'purple',
      action: () => alert('Функция в разработке'),
    },
    {
      icon: '📊',
      title: 'Отчёты',
      description: 'Генерация аналитики',
      color: 'green',
      action: () => alert('Функция в разработке'),
    },
    {
      icon: '⚙️',
      title: 'Настройки',
      description: 'Конфигурация клиники',
      color: 'orange',
      action: () => alert('Функция в разработке'),
    },
    {
      icon: '🗄️',
      title: 'База данных',
      description: 'Prisma Studio',
      color: 'pink',
      action: () => window.open('http://localhost:5555', '_blank'),
    },
  ];

  return (
    <div className="cyber-card p-6">
      <h3 className="text-2xl font-bold mb-4 text-cyan-400">Быстрые действия</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`p-4 rounded-xl bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/10
                       border border-${action.color}-500/30 hover:border-${action.color}-400/50
                       transition-all duration-300 hover:scale-105 group`}
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <h4 className="font-bold text-sm mb-1">{action.title}</h4>
            <p className="text-xs text-gray-400">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
