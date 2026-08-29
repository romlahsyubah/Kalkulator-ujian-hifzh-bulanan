const CACHE_NAME = "kalkulator-hifzh-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
];

/* ================================
   INSTALL
================================ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});


/* ================================
   ACTIVATE
================================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});


/* ================================
   FETCH
================================ */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  /*
    Untuk halaman HTML:
    - coba ambil dari cache dulu
    - kalau belum ada, ambil dari internet
    - kalau internet gagal, gunakan index.html
  */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html")
        .then((cachedPage) => {
          if (cachedPage) {
            return cachedPage;
          }

          return fetch(request)
            .then((response) => {
              return response;
            })
            .catch(() => {
              return caches.match("./index.html");
            });
        })
    );

    return;
  }


  /*
    Untuk file lain:
    - cache dulu
    - kalau tidak ada, ambil dari internet
    - hasil yang berhasil diambil akan disimpan ke cache
  */
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            /*
              Hanya cache response yang valid.
            */
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return networkResponse;
          });
      })
  );
});
