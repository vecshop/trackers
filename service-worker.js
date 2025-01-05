const CACHE_NAME = "habit-tracker-cache-v2";
const APP_VERSION = "2.0.0"; // Match with manifest version
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/128x128.png",
  "/icons/512x512.png",
  // Add all external resources
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "https://cdn-icons-png.flaticon.com/512/1047/1047711.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Immediately activate new service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        // Check network for updates in background
        fetch(event.request).then((response) => {
          // Update cache if new version available
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        });
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone and cache new responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
