// Service Worker for handling push notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push notification data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      vibrate: [200, 100, 200],
      actions: getActionsForNotification(data.data?.type),
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  let url = '/';

  // Determine URL based on notification type
  if (action === 'open-appointment' || data?.type === 'appointment') {
    url = '/patient/dashboard';
  } else if (action === 'open-chat' || data?.type === 'message') {
    url = '/chat';
  } else if (action === 'join-call' || data?.type === 'video-call') {
    url = '/video/' + (data.roomId || 'default');
  } else if (action === 'view-prescription' || data?.type === 'prescription') {
    url = '/patient/dashboard#prescriptions';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

function getActionsForNotification(type) {
  switch (type) {
    case 'appointment':
      return [
        { action: 'open-appointment', title: 'Открыть' },
        { action: 'dismiss', title: 'Закрыть' },
      ];
    case 'message':
      return [
        { action: 'open-chat', title: 'Ответить' },
        { action: 'dismiss', title: 'Позже' },
      ];
    case 'video-call':
      return [
        { action: 'join-call', title: 'Присоединиться' },
        { action: 'dismiss', title: 'Отклонить' },
      ];
    case 'prescription':
      return [
        { action: 'view-prescription', title: 'Посмотреть' },
        { action: 'dismiss', title: 'Закрыть' },
      ];
    default:
      return [{ action: 'dismiss', title: 'Закрыть' }];
  }
}

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification);
});
