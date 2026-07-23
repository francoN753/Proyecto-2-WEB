const CACHE_NAME = 'deezer-manager-v5';
const ASSETS = [
    './',
    './index.html',
    './dashboard.html',
    './css/reset.css',
    './css/variables.css',
    './css/layout.css',
    './css/components.css',
    './css/animations.css',
    './js/auth.js',
    './js/api.js',
    './js/dashboard.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Cache First for Assets, Network First for API (though API is JSONP so SW can't easily intercept it cleanly without specific handling, but we cache images/assets)
self.addEventListener('fetch', (e) => {
    // If it's a request to Deezer API or images, try network first, then cache
    if (e.request.url.includes('api.deezer.com') || e.request.url.includes('e-cdns-images.dzcdn.net')) {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const resClone = res.clone();
                    caches.open('deezer-api-cache').then(cache => cache.put(e.request, resClone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

// Default: Network First for all local assets
    e.respondWith(
        fetch(e.request)
            .then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, fetchRes.clone());
                    return fetchRes;
                });
            })
            .catch(() => caches.match(e.request))
    );
});
