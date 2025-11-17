'use client';

import { useEffect, useState, useCallback } from 'react';

// Type definition inline to avoid Turbopack import issues
type Notification = {
  id: string;
  type: 'appointment' | 'reminder' | 'emergency' | 'message';
  title: string;
  message: string;
  userId: number;
  userRole: 'patient' | 'doctor' | 'admin';
  data?: Record<string, any>;
  timestamp: Date;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/notifications/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('🔔 Notification stream connected');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Skip connection messages
            if (data.type === 'connected') {
              console.log('✅ Notifications ready:', data.message);
              return;
            }

            // Add new notification
            setNotifications((prev) => [data, ...prev].slice(0, 50)); // Keep last 50

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new window.Notification(data.title, {
                body: data.message,
                icon: '/icon.svg',
                tag: data.id,
              });
            }
          } catch (err) {
            console.error('Error parsing notification:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError('Connection lost');
          eventSource?.close();

          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (err) {
        setError('Failed to connect');
        console.error('EventSource error:', err);
      }
    };

    connect();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await window.Notification.requestPermission();
    }
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    error,
    requestPermission,
    clearNotification,
    clearAll,
  };
}
