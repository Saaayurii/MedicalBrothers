export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Нажмите на микрофон',
      description: 'Активируйте голосовой интерфейс одним кликом',
      icon: '🎤',
    },
    {
      number: '02',
      title: 'Скажите что нужно',
      description: 'Опишите вашу проблему или запрос естественным языком',
      icon: '💬',
    },
    {
      number: '03',
      title: 'AI анализирует запрос',
      description: 'Система определяет намерение и ищет решение',
      icon: '🤖',
    },
    {
      number: '04',
      title: 'Получите ответ',
      description: 'Помощник даёт рекомендации и выполняет действия',
      icon: '✨',
    },
  ];

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
          Как это работает?
        </h2>
        <p className="text-xl text-gray-400">
          Четыре простых шага до решения вашей задачи
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <div className="cyber-card p-6 h-full">
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/50">
                {step.number}
              </div>

              {/* Icon */}
              <div className="text-5xl mb-4 mt-4 text-center">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 text-center text-white">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow connector (hide on last item and mobile) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-cyan-500 text-2xl">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Example flow */}
      <div className="mt-8 cyber-card p-6 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
        <h3 className="text-lg font-bold mb-3 text-cyan-400">Пример диалога:</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👤</span>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl px-4 py-2">
              <p className="text-sm">"Хочу записаться к кардиологу на эту неделю"</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl px-4 py-2 flex-1">
              <p className="text-sm">
                "Отлично! У нас доступны кардиологи: Иван Петров и Мария Сидорова.
                Есть свободные слоты в среду в 10:00, 14:30 и в пятницу в 11:00.
                Какое время вам удобно?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
