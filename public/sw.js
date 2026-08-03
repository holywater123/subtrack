// Deliberately minimal: only precaches the static app icons so the PWA
// install/shell criteria are met. Every other request (pages, auth, and
// especially financial data) always goes straight to the network - this
// app must never show stale balances or expenses from a cache.
const CACHE_NAME = "gauge-static-v1";
const PRECACHE_URLS = ["/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Anything else: don't call respondWith - the browser does its normal
  // network fetch, so pages and data are never served from cache.
});
