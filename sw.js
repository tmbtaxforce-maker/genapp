/*
 * sw.js — Service Worker for GenApp PWA
 * - Cache app shell on install for offline use
 * - Network-first for /api/ calls (with cache fallback when offline)
 * - Cache-first for static assets
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'genapp-shell-' + CACHE_VERSION;
const API_CACHE = 'genapp-api-' + CACHE_VERSION;

const ASSETS = [
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

/* ---------- install: cache app shell ---------- */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

/* ---------- activate: clean old caches ---------- */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.map((k) => (k !== CACHE_NAME && k !== API_CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

/* ---------- fetch: route requests ---------- */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  /* API calls — network-first with cache fallback for offline */
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(API_CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })
        .catch(() => caches.match(e.request))
        .then((resp) => resp || new Response('{"ok":false,"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  /* Static assets — cache-first, network fallback */
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});
