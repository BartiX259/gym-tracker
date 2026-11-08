const CACHE_NAME = 'gym-tracker-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Cache-first offline network interceptor
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET' && e.request.url.startsWith('http')) {
            cache.put(e.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => caches.match('/'))
  );
});
