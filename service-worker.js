const CACHE = "app-v4";

const ASSETS = ["/", "/index.html", "/main.js", "/style.css"];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  self.clients.claim();

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
});

// FETCH
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // есть кеш → отдаем
      if (cached) {
        return cached;
      }

      // иначе интернет
      return fetch(event.request).then((response) => {
        // сохраняем новый файл в кеш
        const clone = response.clone();

        caches.open(CACHE).then((cache) => {
          cache.put(event.request, clone);
        });

        return response;
      });
    }),
  );
});
