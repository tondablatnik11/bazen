/**
 * Service Worker – Chytrý Bazénář
 *
 * Strategie:
 *  - Statické assety (JS, CSS, ikony, manifest): cache-first s revalidací.
 *  - Navigace (HTML): network-first, fallback na offline stránku / root.
 *  - API routes (/api/*): vždy network-only (nikdy necachujeme AI).
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `chytry-bazen-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `chytry-bazen-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/favicon.svg",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API: nikdy necachujeme
  if (url.pathname.startsWith("/api/")) return;

  // Navigace (HTML): network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // Statické assety: cache-first
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((resp) => {
          if (
            resp.ok &&
            (url.pathname.startsWith("/icons/") ||
              url.pathname.startsWith("/_next/static/"))
          ) {
            const copy = resp.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
    )
  );
});