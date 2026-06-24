// sw.js
const CACHE_NAME = 'deezer-manager-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './css/reset.css',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './js/auth.js',
  './js/dashboard.js',
  './manifest.json'
];

// Evento de instalación: cachear recursos estáticos locales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando recursos locales...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento de activación: limpiar versiones de caché obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua...', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento fetch: interceptar peticiones y responder desde caché
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isLocal = event.request.url.startsWith(self.location.origin);
  const isDeezerImage = requestUrl.hostname.includes('dzcdn.net') || requestUrl.pathname.includes('/images/');

  // Solo interceptar peticiones GET locales o imágenes de portadas de Deezer
  if (event.request.method !== 'GET' || (!isLocal && !isDeezerImage)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Si el recurso está en cache, retornarlo e intentar actualizar en segundo plano (Stale-While-Revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200 || (isDeezerImage && networkResponse.type === 'opaque')) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Si no está en caché, obtener de la red y guardar en caché si es exitoso o imagen opaca
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200 || (isDeezerImage && networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Si la red falla y no hay caché
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
