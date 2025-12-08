'use client';

import { useState } from 'react';

export default function FAQSection() {
  const faqs = [
    {
      question: 'Как работает голосовой помощник?',
      answer: 'Система использует Web Speech API для распознавания вашей речи и преобразует её в текст. Затем AI-модель Qwen 2.5 анализирует запрос, определяет намерение и генерирует ответ. Ответ озвучивается с помощью синтеза речи.',
    },
    {
      question: 'Нужен ли интернет для работы?',
      answer: 'Для распознавания речи в браузере нужен интернет. Однако AI-обработка происходит локально на сервере клиники через Ollama, что обеспечивает конфиденциальность ваших данных.',
    },
    {
      question: 'Какие браузеры поддерживаются?',
      answer: 'Голосовое управление работает в браузерах Chrome, Edge и других на базе Chromium. Для Safari и Firefox функция распознавания речи может быть ограничена.',
    },
    {
      question: 'Безопасны ли мои медицинские данные?',
      answer: 'Абсолютно! Все данные хранятся локально на сервере клиники в защищённой PostgreSQL базе данных. Мы не используем облачные сервисы и не передаём информацию третьим лицам.',
    },
    {
      question: 'Можно ли отменить запись через помощника?',
      answer: 'Да, просто скажите "Хочу отменить запись" и помощник поможет найти вашу запись и отменить её.',
    },
    {
      question: 'Что делать если помощник не понял меня?',
      answer: 'Попробуйте сформулировать запрос иначе или говорите чётче. Также можно использовать текстовый ввод. Если проблема сохраняется - обратитесь к администратору.',
    },
    {
      question: 'Заменяет ли AI реального врача?',
      answer: 'Нет! AI-помощник даёт только общие рекомендации и помогает с записью. Для диагностики и лечения обязательно нужна консультация настоящего врача.',
    },
    {
      question: 'Можно ли использовать систему ночью?',
      answer: 'Голосовой помощник работает 24/7, но записи на приём доступны только в рабочие часы клиники. Для экстренных случаев система подскажет номера скорой помощи.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
          Частые вопросы
        </h2>
        <p className="text-xl text-gray-400">
          Ответы на самые популярные вопросы о системе
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="cyber-card overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-lg pr-4">{faq.question}</span>
              <span className={`text-2xl text-cyan-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                ⌄
              </span>
            </button>

            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 mb-4">Не нашли ответ на свой вопрос?</p>
        <a
          href="tel:+78001234567"
          className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/50 rounded-xl transition-all"
        >
          📞 Позвоните нам: +7 (949) 99-99-99
        </a>
      </div>
    </section>
  );
}
