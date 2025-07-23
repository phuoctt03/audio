self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("audio-app-cache").then(cache => {
      return cache.addAll([
        "./audio/",
        "./audio/index.html",
        "./audio/manifest.json",
        "./audio/icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
