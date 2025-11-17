// Service Worker for MedicalBrothers PWA
const CACHE_VERSION = 'v1';
const CACHE_NAME = `medical-brothers-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/assistant',
  '/appointments',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching critical assets');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.error('[SW] Failed to precache assets:', error);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Caching strategies
const STRATEGIES = {
  // Cache first, fallback to network (for static assets)
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error('[SW] Fetch failed:', error);
      throw error;
    }
  },

  // Network first, fallback to cache (for dynamic content)
  networkFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  },

  // Network only (for sensitive data)
  networkOnly: async (request) => {
    return fetch(request);
  },
};

// Fetch event - apply caching strategies based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other origins
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Determine strategy based on request type
  let strategy;

  if (url.pathname.startsWith('/api/')) {
    // API calls - sensitive endpoints use network only
    if (url.pathname.includes('/auth/') || url.pathname.includes('/admin/')) {
      strategy = STRATEGIES.networkOnly;
    } else {
      strategy = STRATEGIES.networkFirst;
    }
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/)) {
    // Static assets - cache first
    strategy = STRATEGIES.cacheFirst;
  } else {
    // HTML pages - network first
    strategy = STRATEGIES.networkFirst;
  }

  event.respondWith(
    strategy(request).catch(async () => {
      // If both network and cache fail, show offline page for navigation
      if (request.mode === 'navigate') {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match(OFFLINE_URL);
        if (offlinePage) return offlinePage;
      }

      // Return basic offline response
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Medical Brothers',
    body: 'You have a new notification',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
    requireInteraction: false,
    tag: data.tag || 'default',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  console.log('[SW] Syncing offline appointments...');
  // Placeholder for syncing queued appointments from IndexedDB
}

// Message event - for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
