
const CACHE_NAME = 'shark-pos-v1';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install Event - Precache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First for API, Cache First for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Calls (Sync/Printer) -> Network Only (Handle offline in app logic)
  // UPDATED: Exclude jsonbin.io explicitly to prevent stale order data on multiple devices
  if (url.pathname.includes('/api/') || url.hostname.includes('jsonbin.io') || url.port === '9100' || url.protocol === 'chrome-extension:') {
    return;
  }

  // 2. Navigation / HTML / JS / CSS / Images -> Stale-While-Revalidate
  // This serves the cached version immediately but updates it in the background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache if valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails and no cache, we are in trouble, but the cachedResponse below handles it
      });

      return cachedResponse || fetchPromise;
    })
  );
});
