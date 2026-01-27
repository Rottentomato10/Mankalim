const CACHE_NAME = 'menakalim-v3';

// Install - skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate - clear old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network only for all requests (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
