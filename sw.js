const CACHE_NAME = 'gestor-tareas-v2'; // Incrementar versión
const urlsToCache = [
    './',
    './index.html',
    './css/main.css',
    './css/dark-mode.css',
    './css/responsive.css',
    './css/pwa.css',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css',
    'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js',
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    self.skipWaiting(); // Activar inmediatamente
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            clients.claim() // Tomar control inmediato
        ])
    );
});

// Estrategia: Network First con timeout, fallback a cache
self.addEventListener('fetch', event => {
    // Ignorar requests que no son GET
    if (event.request.method !== 'GET') return;
    
    // Ignorar requests de Firebase (ya manejan su propio cache)
    if (event.request.url.includes('firebase') || 
        event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        Promise.race([
            fetch(event.request),
            new Promise(resolve => setTimeout(resolve, 3000))
        ])
        .then(response => {
            if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        })
        .catch(() => {
            return caches.match(event.request).then(cacheResponse => {
                if (cacheResponse) {
                    return cacheResponse;
                }
                // Fallback para HTML
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});