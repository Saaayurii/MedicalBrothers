'use client';

import { useEffect, useState } from 'react';

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    // Check if browser supports notifications
    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Show prompt if permission not granted and not denied
      if (Notification.permission === 'default') {
        // Wait 10 seconds before showing prompt (don't annoy users immediately)
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    // Check for existing subscription
    if ('serviceWorker' in navigator && permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, [permission]);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      setShowPrompt(false);

      if (perm === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID public key to Uint8Array
      // This is a placeholder - in production, generate keys using web-push
      const vapidPublicKey =
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8-fTt3aIVLR1VKd2TfkTyNGH8p5z6i5d5w5x8WjzaU5j5p5y5e5r5y5';

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });

      setSubscription(subscription);

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      console.log('Push subscription successful:', subscription);
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      console.log('Push unsubscription successful');
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      alert('Разрешение на уведомления не предоставлено');
      return;
    }

    try {
      // Send test notification via service worker
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('MedicalBrothers', {
        body: 'Это тестовое уведомление!',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'test-notification',
        requireInteraction: false,
        data: {
          url: '/',
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Only render in browser
  if (typeof window === 'undefined') {
    return null;
  }

  if (!('Notification' in window)) {
    return null;
  }

  // Don't show anything if permission is denied
  if (permission === 'denied') {
    return null;
  }

  return (
    <>
      {/* Permission prompt */}
      {showPrompt && permission === 'default' && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-2xl p-4 border border-purple-500/50">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🔔</span>
            <div className="flex-1">
              <h4 className="font-bold text-white mb-1">Включить уведомления?</h4>
              <p className="text-sm text-gray-300 mb-3">
                Получайте напоминания о записях и важные обновления
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Разрешить
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Позже
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notification status indicator (for testing) */}
      {permission === 'granted' && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 right-6 z-40">
          <details className="bg-slate-800 rounded-lg shadow-lg border border-slate-700">
            <summary className="px-4 py-2 cursor-pointer hover:bg-slate-700 rounded-lg flex items-center gap-2">
              <span className="text-green-400">🔔</span>
              <span className="text-sm">Уведомления активны</span>
            </summary>
            <div className="p-4 border-t border-slate-700 space-y-2">
              <button
                onClick={sendTestNotification}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm transition-colors"
              >
                Отправить тестовое уведомление
              </button>
              {subscription && (
                <button
                  onClick={unsubscribeFromPush}
                  className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-sm transition-colors"
                >
                  Отписаться от push
                </button>
              )}
            </div>
          </details>
        </div>
      )}
    </>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
