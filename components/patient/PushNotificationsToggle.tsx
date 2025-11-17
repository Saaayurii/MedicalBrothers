'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationsToggleProps {
  userId: string;
}

export default function PushNotificationsToggle({ userId }: PushNotificationsToggleProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications({
    userId,
    onSubscriptionChange: (subscription) => {
      console.log('Subscription changed:', subscription);
    },
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle = async () => {
    const success = isSubscribed ? await unsubscribe() : await subscribe();
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-500/20 border border-gray-500/50 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          ⚠️ Ваш браузер не поддерживает push-уведомления
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
            🔔 Push-уведомления
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            {isSubscribed 
              ? 'Вы будете получать уведомления о записях, сообщениях и консультациях'
              : 'Включите уведомления, чтобы не пропустить важные события'
            }
          </p>
          
          {error && (
            <p className="text-xs text-red-400 mt-2">
              ❌ {error}
            </p>
          )}
          
          {showSuccess && (
            <p className="text-xs text-green-400 mt-2">
              ✅ {isSubscribed ? 'Уведомления включены!' : 'Уведомления отключены'}
            </p>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg transition-all font-medium text-sm whitespace-nowrap ${
            isSubscribed
              ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300'
              : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? '...' : isSubscribed ? 'Отключить' : 'Включить'}
        </button>
      </div>

      {isSubscribed && (
        <div className="mt-4 pt-4 border-t border-blue-500/20">
          <p className="text-xs text-gray-400">
            Типы уведомлений:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 bg-blue-500/20 rounded text-xs">📅 Напоминания о приёмах</span>
            <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">💬 Новые сообщения</span>
            <span className="px-2 py-1 bg-green-500/20 rounded text-xs">📹 Видеоконсультации</span>
            <span className="px-2 py-1 bg-yellow-500/20 rounded text-xs">💊 Рецепты</span>
          </div>
        </div>
      )}
    </div>
  );
}
