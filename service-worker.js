const CACHE_NAME = "nutrition-counter-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./css/style.css",
    "./script/script.js",
    "./manifest.json",
    "./icons/icon.png"
];

// Install: pre-cache the app and activate immediately
self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

// Network first (so updates always arrive), fall back to cache when offline
self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return response;
            })
            .catch(() => caches.match(req))
    );
});

// Remove old cache versions and take control of open pages
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});
