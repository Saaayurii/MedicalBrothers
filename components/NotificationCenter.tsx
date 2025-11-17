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
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-3 bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 rounded-full hover:bg-slate-700/80 transition-all"
      >
        <span className="text-2xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}

        {/* Connection Status */}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute top-16 right-0 w-96 max-h-[600px] bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-cyan-400">
              🔔 Уведомления ({notifications.length})
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Очистить все
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p>Нет новых уведомлений</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <h4 className="font-semibold text-white">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-300">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="text-gray-400 hover:text-white transition-colors"
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
