'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';
import { useEffect, useState } from 'react';

export default function NotificationCenter() {
  const { notifications, isConnected, requestPermission, clearNotification, clearAll } =
    useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    // Request notification permission on mount
    requestPermission();
  }, [requestPermission]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'reminder':
        return '⏰';
      case 'emergency':
        return '🚨';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'border-red-500/50 bg-red-500/10';
      case 'appointment':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'reminder':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-cyan-500/50 bg-cyan-500/10';
    }
  };

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 sm:p-3 bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 rounded-full hover:bg-slate-700/80 transition-all"
      >
        <span className="text-lg sm:text-2xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}

        {/* Connection Status */}
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute top-12 sm:top-16 right-0 w-[calc(100vw-1rem)] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-[600px] bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-bold text-cyan-400">
              🔔 Уведомления ({notifications.length})
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[50vh] sm:max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-400">
                <p className="text-3xl sm:text-4xl mb-2">📭</p>
                <p className="text-sm sm:text-base">Нет новых уведомлений</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-l-4 ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-base sm:text-xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                          {new Date(notification.timestamp).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
