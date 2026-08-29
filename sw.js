"use strict";

const CACHE_NAME = "kalkulator-hifzh-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});


/* =========================
   FETCH
========================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  /*
    Hanya tangani request yang berasal
    dari origin aplikasi sendiri.
  */
  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  /*
    Untuk navigasi / membuka halaman:
    selalu gunakan index.html dari cache
    jika sedang offline.
  */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, copy);
              });
          }

          return response;
        })
        .catch(() => {
          return caches.match("./index.html");
        })
    );

    return;
  }

  /*
    Untuk resource lokal:
    cache-first, lalu network.
  */
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, copy);
                });
            }

            return response;
          });
      })
  );
});
