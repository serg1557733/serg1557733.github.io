const CACHE = "app-v5";

const STATIC_ASSETS = ["/", "/index.html", "/main.js", "/style.css"];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // безопасный кеш (не падает если файл 404)
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn("Cache skip:", asset);
        }
      }
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
          if (key !== CACHE) return caches.delete(key);
        }),
      ),
    ),
  );
});

// FETCH (умный режим)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ❌ НЕ кешируем API / маршруты / динамику
  if (
    url.origin.includes("tankerkoenig") ||
    url.origin.includes("router.project-osrm.org")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🧠 cache-first для статики
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // не кешируем битые ответы
          if (!response || response.status !== 200) {
            return response;
          }

          const clone = response.clone();

          caches.open(CACHE).then((cache) => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => {
          // fallback для оффлайна
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
    }),
  );
});
