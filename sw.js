const CACHE_NAME = 'robux-multiplication-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  'https://images.unsplash.com/photo-1614728263952-84ea256ec346?q=80&w=1920&h=1080&auto=format&fit=crop',
  'https://unpkg.com/@babel/standalone/babel.min.js' // Cache the new script
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200) {
              return response;
            }
            // IMPORTANT: We don't cache basic type requests to avoid issues with some hosting providers.
            // Let's only cache what we are sure about. The main urlsToCache are the most important.
            
            return response;
          }
        );
      })
    );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});