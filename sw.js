const CACHE_NAME = 'tasks-app-v1';
const ASSETS = [
  '/simple-tasks/',
  '/simple-tasks/index.html',
  '/simple-tasks/static/styles.css',
  '/simple-tasks/static/script.js',
  '/simple-tasks/static/manifest.json',
  '/simple-tasks/README.md',
  '/simple-tasks/static/android-chrome-192x192.png',
  '/simple-tasks/static/android-chrome-512x512.png',
  '/simple-tasks/static/apple-touch-icon.png',
  '/simple-tasks/static/favicon-32x32.png',
  '/simple-tasks/static/favicon-16x16.png',
  '/simple-tasks/static/favicon.ico',
  'https://cdn.jsdelivr.net/npm/@ssense/sf-font@1.0.0/dist/SFPro.css',
  'https://cdn.jsdelivr.net/npm/@ssense/sf-font@1.0.0/dist/SFPro-Regular.woff2',
  'https://cdn.jsdelivr.net/npm/@ssense/sf-font@1.0.0/dist/SFPro-Medium.woff2',
  'https://cdn.jsdelivr.net/npm/@ssense/sf-font@1.0.0/dist/SFPro-Semibold.woff2',
  'https://cdn.jsdelivr.net/npm/@ssense/sf-font@1.0.0/dist/SFPro-Bold.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          ASSETS.map(asset =>
            cache.add(asset).catch(error => {
              console.warn(`Failed to cache asset: ${asset}`, error);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((fetchResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        return new Response('Offline content not available');
      })
  );
});
