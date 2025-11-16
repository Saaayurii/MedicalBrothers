'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceAssistant from '@/components/VoiceAssistant';
import ConversationHistory from '@/components/ConversationHistory';
import Header from '@/components/Header';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isListening, setIsListening] = useState(false);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />

        {/* Hero Section */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse-slow">
            Медицинский Голосовой Помощник
          </h1>
          <p className="text-xl text-cyan-200/80 mb-2">
            Запишитесь на приём, получите консультацию или вызовите скорую помощь
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-300/60">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Система активна и готова к работе</span>
          </div>
        </div>

        {/* Main Voice Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <VoiceAssistant
            messages={messages}
            setMessages={setMessages}
            isListening={isListening}
            setIsListening={setIsListening}
          />

          <ConversationHistory messages={messages} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            icon="📅"
            title="Запись на приём"
            description="Выберите врача и время"
            gradient="from-cyan-500/20 to-blue-600/20"
          />
          <QuickActionCard
            icon="🩺"
            title="Консультация"
            description="Опишите симптомы"
            gradient="from-purple-500/20 to-pink-600/20"
          />
          <QuickActionCard
            icon="ℹ️"
            title="Справка"
            description="Режим работы, цены"
            gradient="from-green-500/20 to-teal-600/20"
          />
          <QuickActionCard
            icon="🚨"
            title="Скорая помощь"
            description="Экстренный вызов"
            gradient="from-red-500/20 to-orange-600/20"
          />
        </div>

        {/* Statistics */}
        <div className="cyber-card p-6">
          <h3 className="text-2xl font-bold mb-4 text-cyan-400">Статистика клиники</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Записей сегодня" value="24" color="cyan" />
            <StatCard label="Активных врачей" value="12" color="purple" />
            <StatCard label="Консультаций" value="45" color="green" />
            <StatCard label="Удовлетворённость" value="98%" color="pink" />
          </div>
        </div>
      </div>
    </main>
  );
}

function QuickActionCard({ icon, title, description, gradient }: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className={`cyber-card p-6 hover:scale-105 transform transition-all cursor-pointer bg-gradient-to-br ${gradient}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold mb-1 text-${color}-400`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
