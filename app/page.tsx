'use client';

import { useState, useRef } from 'react';
import VoiceAssistant from '@/components/VoiceAssistant';
import ConversationHistory from '@/components/ConversationHistory';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorks from '@/components/HowItWorks';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isListening, setIsListening] = useState(false);
  const voiceAssistantRef = useRef<HTMLDivElement>(null);

  const scrollToVoiceAssistant = () => {
    voiceAssistantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleQuickAction = (action: string) => {
    scrollToVoiceAssistant();

    // Симулируем голосовой ввод для быстрых действий
    const actionMessages: Record<string, string> = {
      appointment: 'Хочу записаться на приём к врачу',
      consultation: 'Мне нужна консультация по симптомам',
      info: 'Расскажите о режиме работы и услугах клиники',
      emergency: 'Нужна экстренная помощь!',
    };

    const userMessage = { role: 'user' as const, content: actionMessages[action] || '' };
    setMessages(prev => [...prev, userMessage]);

    // Имитация ответа помощника (в реальности будет через Server Action)
    setTimeout(() => {
      const responses: Record<string, string> = {
        appointment: 'Отлично! У нас работают врачи разных специальностей. Какой специалист вам нужен? Например: кардиолог, терапевт, невролог.',
        consultation: 'Я готов выслушать ваши симптомы и дать рекомендации. Расскажите, что вас беспокоит?',
        info: 'Наша клиника работает:\n• Пн-Пт: 9:00-20:00\n• Сб: 10:00-16:00\n• Вс: выходной\n\nУслуги: консультации специалистов, диагностика, анализы, УЗИ, ЭКГ.\nЧто именно вас интересует?',
        emergency: '⚠️ ЭКСТРЕННАЯ СИТУАЦИЯ!\nВаш вызов зафиксирован. Немедленно звоните 103 или 112!\nОпишите что произошло, я передам информацию диспетчеру.',
      };
      const assistantMessage = { role: 'assistant' as const, content: responses[action] || 'Чем могу помочь?' };
      setMessages(prev => [...prev, assistantMessage]);
    }, 500);
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Header />

        {/* Hero Section */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse-slow">
            Медицинский Голосовой Помощник
          </h1>
          <p className="text-xl text-cyan-200/80 mb-6">
            Запишитесь на приём, получите консультацию или вызовите скорую помощь
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-300/60 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Система активна • Работает на AI Qwen 2.5</span>
          </div>

          <button
            onClick={scrollToVoiceAssistant}
            className="neon-button text-lg px-8 py-4"
          >
            🎤 Начать диалог
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <QuickActionCard
            icon="📅"
            title="Запись на приём"
            description="Выберите врача и время"
            gradient="from-cyan-500/20 to-blue-600/20"
            onClick={() => handleQuickAction('appointment')}
          />
          <QuickActionCard
            icon="🩺"
            title="Консультация"
            description="Опишите симптомы"
            gradient="from-purple-500/20 to-pink-600/20"
            onClick={() => handleQuickAction('consultation')}
          />
          <QuickActionCard
            icon="ℹ️"
            title="Справка"
            description="Режим работы, цены"
            gradient="from-green-500/20 to-teal-600/20"
            onClick={() => handleQuickAction('info')}
          />
          <QuickActionCard
            icon="🚨"
            title="Скорая помощь"
            description="Экстренный вызов"
            gradient="from-red-500/20 to-orange-600/20"
            onClick={() => handleQuickAction('emergency')}
          />
        </div>

        {/* Main Voice Assistant */}
        <div ref={voiceAssistantRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 scroll-mt-20">
          <VoiceAssistant
            messages={messages}
            setMessages={setMessages}
            isListening={isListening}
            setIsListening={setIsListening}
          />

          <ConversationHistory messages={messages} />
        </div>

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Statistics */}
        <div className="cyber-card p-8 mb-12">
          <h3 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
            Статистика клиники в реальном времени
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Записей сегодня" value="24" color="cyan" trend="+12%" />
            <StatCard label="Активных врачей" value="12" color="purple" />
            <StatCard label="Консультаций" value="45" color="green" trend="+8%" />
            <StatCard label="Удовлетворённость" value="98%" color="pink" trend="+2%" />
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />

        {/* Doctors Info */}
        <div className="cyber-card p-8 mb-12">
          <h3 className="text-3xl font-bold mb-6 text-center text-cyan-400">
            Наши специалисты
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DoctorCard name="Иван Петров" specialty="Кардиолог" experience="15 лет" />
            <DoctorCard name="Мария Сидорова" specialty="Кардиолог" experience="10 лет" />
            <DoctorCard name="Анна Смирнова" specialty="Терапевт" experience="12 лет" />
            <DoctorCard name="Дмитрий Козлов" specialty="Невролог" experience="8 лет" />
            <DoctorCard name="Елена Волкова" specialty="Педиатр" experience="20 лет" />
            <DoctorCard name="Сергей Морозов" specialty="Хирург" experience="18 лет" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="cyber-card p-12 mb-12 text-center bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10">
          <h3 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
            Готовы начать?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Просто нажмите на микрофон и скажите, чем мы можем вам помочь
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={scrollToVoiceAssistant} className="neon-button text-lg">
              🎤 Говорить с помощником
            </button>
            <a href="/admin" className="px-8 py-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 text-white font-semibold rounded-xl transition-all">
              👨‍💼 Админ-панель
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function QuickActionCard({ icon, title, description, gradient, onClick }: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cyber-card p-6 hover:scale-105 transform transition-all cursor-pointer bg-gradient-to-br ${gradient} group`}
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

function StatCard({ label, value, color, trend }: {
  label: string;
  value: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
      <div className={`text-4xl font-bold mb-2 text-${color}-400`}>{value}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      {trend && (
        <div className="text-xs text-green-400 flex items-center justify-center gap-1">
          <span>↑</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

function DoctorCard({ name, specialty, experience }: {
  name: string;
  specialty: string;
  experience: string;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
      <div className="text-3xl mb-2">👨‍⚕️</div>
      <h4 className="font-bold text-lg mb-1">{name}</h4>
      <p className="text-cyan-400 text-sm mb-1">{specialty}</p>
      <p className="text-gray-500 text-xs">Опыт: {experience}</p>
    </div>
  );
}
