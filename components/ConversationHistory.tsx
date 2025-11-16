'use client';

import { useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationHistoryProps {
  messages: Message[];
}

export default function ConversationHistory({ messages }: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="cyber-card p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
        💬 История диалога
      </h2>

      <div
        ref={scrollRef}
        className="space-y-4 max-h-[500px] overflow-y-auto pr-2"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-4">🤖</p>
            <p>Начните диалог с помощником</p>
            <p className="text-sm mt-2 text-gray-600">
              Скажите "Привет" или "Записаться на приём"
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50'
                    : 'bg-gradient-to-br from-purple-500/30 to-pink-600/30 border border-purple-500/50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {message.role === 'user' ? 'Вы' : 'Помощник'}
                    </p>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            🔄 Начать новый диалог
          </button>
        </div>
      )}
    </div>
  );
}
