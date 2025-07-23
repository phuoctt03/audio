self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("audio-app-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./icons/icon-512.png",
        "./styles.css",
        "./script.js"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
