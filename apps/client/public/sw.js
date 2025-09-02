// VR Ecopetrol Service Worker
// Este archivo será reemplazado por Vite PWA Plugin, pero sirve como fallback

const CACHE_NAME = 'vr-ecopetrol-v1';
const STATIC_CACHE_NAME = 'vr-ecopetrol-static-v1';
const DYNAMIC_CACHE_NAME = 'vr-ecopetrol-dynamic-v1';

// Assets críticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/asset-manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests de chrome-extension y otros protocolos
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Ignorar WebSocket connections
  if (url.pathname.includes('/ws')) {
    return;
  }
  
  // Estrategia Cache First para assets estáticos
  if (
    request.destination === 'image' ||
    request.destination === 'audio' ||
    request.destination === 'font' ||
    url.pathname.includes('/panos/') ||
    url.pathname.includes('/audio/')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Solo cachear respuestas válidas
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
        .catch(() => {
          // Fallback para imágenes
          if (request.destination === 'image') {
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">Imagen no disponible offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        })
    );
    return;
  }
  
  // Estrategia Network First para API y contenido dinámico
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || new Response(
                JSON.stringify({ error: 'Offline, no cached data available' }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
  
  // Estrategia Cache First para otros recursos
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            if (response.status === 200 && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Fallback a página principal para navegación
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => 
            caches.open(cacheName)
              .then(cache => cache.keys())
              .then(keys => ({ cacheName, count: keys.length }))
          )
        );
      })
      .then(cacheInfo => {
        event.ports[0].postMessage({
          type: 'CACHE_SIZE_RESULT',
          cacheInfo
        });
      });
  }
});

// Limpiar caché periódicamente
self.addEventListener('sync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupCache());
  }
});

async function cleanupCache() {
  const cacheNames = await caches.keys();
  const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
  const keys = await dynamicCache.keys();
  
  // Limpiar si hay más de 100 items en caché dinámico
  if (keys.length > 100) {
    const keysToDelete = keys.slice(0, keys.length - 100);
    await Promise.all(
      keysToDelete.map(key => dynamicCache.delete(key))
    );
    console.log('[SW] Cleaned up', keysToDelete.length, 'cache entries');
  }
}

console.log('[SW] VR Ecopetrol Service Worker loaded');


