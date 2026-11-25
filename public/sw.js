// Service Worker for Gist Bird — lightweight client cache for phones & PWA
const CACHE_NAME = 'gist-bird-v3';
const PAGE_CACHE = 'gist-bird-pages-v3';

const STALE_WHILE_REVALIDATE_PATHS = ['/home', '/sent', '/chats', '/me', '/map', '/rules', '/notifications'];

const PRECACHE_URLS = [
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/paper.png',
  '/icons/map.png',
  '/mascot/wave.jpg',
  '/mascot/cool.jpg',
  '/mascot/curious.jpg',
  '/mascot/fly.jpg',
  '/images/home-bird.jpg',
  '/assets/message-tree.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET or cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Static assets: cache-first with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/mascot/') ||
    url.pathname.startsWith('/avatars/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/crests/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Visited core app tabs: stale-while-revalidate from phone cache for instant switching
  if (request.mode === 'navigate' && STALE_WHILE_REVALIDATE_PATHS.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached || caches.match('/offline'));
        return cached || networkPromise;
      })
    );
    return;
  }

  // Other navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/offline');
      })
    );
  }
});

// ───────────────────────── Native Push Notifications & Clicks ─────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Focus an existing window on the target URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Focus and navigate an existing client window
      if (clientList.length > 0 && 'focus' in clientList[0] && 'navigate' in clientList[0]) {
        clientList[0].focus();
        return clientList[0].navigate(targetUrl);
      }
      // 3. Open a fresh window if none open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || 'Gist Bird';
    const options = {
      body: payload.body || 'You have a new message',
      icon: payload.icon || '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: { url: payload.url || '/home' },
      tag: payload.tag || 'gist-bird-message',
      renotify: true,
      vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (_e) {
    event.waitUntil(
      self.registration.showNotification('Gist Bird', {
        body: event.data.text(),
        icon: '/icons/icon.svg',
      })
    );
  }
});
