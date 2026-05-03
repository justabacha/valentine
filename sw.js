const CACHE_NAME = 'baroness-vibe-v1.0.3';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/menu.js'
];

// 1. Installation: Cache assets and force takeover
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Kicks out the old SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Vibe Cache logic engaged... 🦾');
      return cache.addAll(assets);
    })
  );
});

// 2. Activation: Clean up old "ghost" caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  // Ensures the new SW controls the page immediately
  return self.clients.claim(); 
});

// 3. Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return a fallback if network fails and no cache available
      });

      return cachedResponse || fetchPromise;
    })
  );
});