const CACHE_NAME = 'gym-tracker-v9';

// 1. Install & Cache offline
self.addEventListener('install', (e) => {
  // Do NOT skipWaiting automatically. Wait for user tap.
});

// 2. Clean up old caches once activated
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 3. Instant Cache-First: Always load instantly from disk
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});

// 4. Listen for user permission to update
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
