'use client';

import { useState } from 'react';
import VoiceAssistant from '@/components/VoiceAssistant';
import ConversationHistory from '@/components/ConversationHistory';
import OllamaChat from '@/components/OllamaChat';
import Link from 'next/link';
import Footer from '@/components/Footer';
import AssistantHeader from '@/components/AssistantHeader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20 md:pb-0">
      {/* Шапка */}
      <AssistantHeader />

      {/* Основной контент */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Голосовой помощник */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">
              Голосовой ассистент
            </h2>
            <VoiceAssistant
              messages={messages}
              setMessages={setMessages}
              isListening={isListening}
              setIsListening={setIsListening}
            />

            {/* Инструкция */}
            <div className="mt-6 sm:mt-8 cyber-card p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-cyan-400">Как использовать?</h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Нажмите кнопку микрофона и произнесите запрос</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Можно записаться на приём, проконсультироваться, узнать информацию о клинике</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Ассистент поймёт русский язык и ответит голосом</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Работает в Chrome, Edge и других браузерах с поддержкой Web Speech API</span>
                </li>
              </ul>
            </div>
          </div>

          {/* История разговора */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">
              История диалога
            </h2>
            <ConversationHistory messages={messages} />

            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8 sm:mt-12">
                <p className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">💬</p>
                <p className="text-sm sm:text-base">История диалога пуста</p>
                <p className="text-xs sm:text-sm mt-2">Начните разговор с голосовым ассистентом</p>
              </div>
            )}
          </div>
        </div>

        {/* Быстрые команды */}
        <div className="mt-8 sm:mt-10 md:mt-12 cyber-card p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">Примеры команд</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              '🩺 Запишите меня к кардиологу',
              '💊 Подскажите, у меня болит голова',
              'ℹ️ Какие часы работы клиники?',
              '💰 Сколько стоит приём терапевта?',
              '🚨 У меня экстренная ситуация',
              '👨‍⚕️ Какие специалисты доступны?',
            ].map((example, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all cursor-pointer"
                onClick={() => {
                  const userMessage: Message = {
                    role: 'user',
                    content: example.replace(/[^\w\sа-яА-ЯёЁ]/g, '').trim(),
                  };
                  handleNewMessage(userMessage);
                }}
              >
                <p className="text-xs sm:text-sm">{example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat - Медицинский ассистент */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">
            💬 Медицинский ассистент
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="h-[500px] sm:h-[600px]">
              <OllamaChat />
            </div>
            <div className="mt-4 cyber-card p-4">
              <p className="text-xs sm:text-sm text-gray-400 text-center">
                🤖 Локальный AI-ассистент для медицинских консультаций
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
