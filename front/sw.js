const CACHE_NAME = 'ghedma-cache-v70';
const ASSETS = [
  '/',
  '/priest',
  '/servant',
  '/auth-login.css',
  '/auth-login.js',
  '/socket-client.js',
  '/logo-removebg-preview.png',
  '/Untitled-1.png',
  '/chart.js',
  '/manifest.json',
  '/manifest-servant.json'
];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log("Caching assets failed:", err));
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
self.addEventListener('fetch', (e) => {
  // Only handle GET requests (bypass SW for POST sync/delta)
  if (e.request.method !== 'GET') {
    return;
  }
  const url = new URL(e.request.url);
  
  // Bypass SW completely for all API and Socket.io polling/websocket requests
  if (url.pathname.startsWith('/api') || (url.pathname.startsWith('/socket.io') && !url.pathname.endsWith('.js'))) {
    return;
  }
  // Use Network-First strategy for pages, scripts, and styles
  if (
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
  } else {
    // Use Cache-First strategy for static images and other assets
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        return cachedResponse || fetch(e.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
