// Service Worker for NDResells PWA
const CACHE_NAME = 'ndresells-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }

        // IMPORTANT: Only cache GET requests. Do not cache POST, PUT, DELETE, etc.
        // Firestore write operations are POST requests and should not be cached.
        if (event.request.method !== 'GET') {
          return fetch(event.request);
        }

        // For GET requests, fetch from network and cache
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream and
            // can only be consumed once. We must clone it to consume it
            // and leave the original untouched for the browser.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            // Handle network errors or other fetch failures
            console.error('Service Worker fetch failed:', error);
            // You might want to return a fallback page or a cached offline page here
            return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
          });
      })
  );
});
