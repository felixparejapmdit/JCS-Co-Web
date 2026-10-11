// Cloud AOS Service Worker v2.0.0
// Static assets are cached for speed. Pages and data always come from the server:
// nothing a user has viewed is kept on the device, so a shared PC never shows the
// previous user's records.
const CACHE_NAME = 'cloud-aos-v2';
const PRECACHE_ASSETS = [
  '/offline',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];

// Install: pre-cache the offline page and icons.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[Cloud AOS SW] Pre-cache partial failure:', err);
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

// Activate: remove caches from earlier versions (including the old AOS100 preview).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Versioned static assets and icons: cache first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // 2. API calls: never cached.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: 'You are offline. Check your connection and try again.', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    return;
  }

  // 3. Page navigations: always from the network, offline page when there is none.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match('/offline');
        return (
          offline ||
          new Response('You are offline. Cloud AOS will be back when your connection returns.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        );
      }),
    );
  }
});
