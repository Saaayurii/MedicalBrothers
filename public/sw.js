// Service Worker для MedicalBrothers PWA
const CACHE_NAME = 'medical-brothers-v1';
const OFFLINE_URL = '/offline.html';

// Ресурсы для кэширования
const STATIC_RESOURCES = [
  '/',
  '/assistant',
  '/appointments',
  '/offline.html',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static resources');
      return cache.addAll(STATIC_RESOURCES).catch((error) => {
        console.error('[SW] Failed to cache resources:', error);
      });
    })
  );

  // Активировать немедленно
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Захватить все клиенты немедленно
  self.clients.claim();
});

// Fetch - стратегия Network First с fallback на Cache
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API для Chrome Extension
  if (event.request.url.includes('chrome-extension://')) {
    return;
  }

  // Только для GET запросов
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ
        const responseClone = response.clone();

        // Кэшируем успешные ответы
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся взять из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Если это навигация и нет в кэше, показываем offline страницу
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          // Иначе возвращаем пустой ответ
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть',
      },
      {
        action: 'close',
        title: 'Закрыть',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('MedicalBrothers', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
