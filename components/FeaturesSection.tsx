export default function FeaturesSection() {
  const features = [
    {
      icon: '🎤',
      title: 'Голосовое управление',
      description: 'Просто говорите - система распознает речь и понимает ваши запросы на русском языке',
      color: 'cyan',
    },
    {
      icon: '🤖',
      title: 'AI консультант',
      description: 'Интеллектуальный медицинский ассистент анализирует симптомы и дает рекомендации',
      color: 'purple',
    },
    {
      icon: '📅',
      title: 'Умная запись',
      description: 'Автоматический подбор врача и времени приёма по вашему запросу',
      color: 'blue',
    },
    {
      icon: '🔒',
      title: 'Полная конфиденциальность',
      description: 'Все данные хранятся локально на сервере клиники, без передачи третьим лицам',
      color: 'green',
    },
    {
      icon: '⚡',
      title: 'Мгновенные ответы',
      description: 'Обработка запросов в реальном времени без задержек и очередей',
      color: 'yellow',
    },
    {
      icon: '📊',
      title: 'Аналитика и отчеты',
      description: 'Полная статистика посещений, консультаций и эффективности работы',
      color: 'pink',
    },
  ];

  return (
    <section id="features" className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
          Возможности системы
        </h2>
        <p className="text-xl text-gray-400">
          Современные технологии на службе вашего здоровья
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="cyber-card p-6 hover:scale-105 transition-all duration-300 group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {feature.description}
            </p>
            <div className={`mt-4 h-1 bg-gradient-to-r from-${feature.color}-500 to-${feature.color}-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform`}></div>
          </div>
        ))}
      </div>
    </section>
  );
}
