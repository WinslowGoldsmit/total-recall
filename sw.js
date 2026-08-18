var CACHE_NAME = 'total-recall-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.4/dexie.min.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function (err) {
        // If the CDN script fails (e.g. offline on first install), still cache the local shell.
        return caches.open(CACHE_NAME).then(function (cache2) {
          return cache2.addAll(['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png']);
        });
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        // Cache successful same-origin or CDN GET responses for future offline use.
        if (event.request.method === 'GET' && response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function () {
        // Offline and not cached: fall back to the app shell for navigations.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
