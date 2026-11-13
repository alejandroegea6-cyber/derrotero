// Derrotero 0.2 — guarda la app en el móvil para que abra aunque no haya cobertura.
// Los mapas todavía no se guardan para uso sin conexión (eso es la Fase 4).
var VERSION = "derrotero-0.2";
var APP = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icono-192.png",
  "./icono-512.png",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(APP); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Teselas del IGN: siempre de internet (por ahora)
  if (url.hostname.endsWith("ign.es")) return;

  // La página: primero internet (para recibir mejoras), si no hay, la guardada
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put("./index.html", copia); });
      return r;
    }).catch(function () { return caches.match("./index.html"); }));
    return;
  }

  // Resto (librería del mapa, letra, iconos): lo guardado primero
  e.respondWith(caches.match(e.request).then(function (guardado) {
    return guardado || fetch(e.request).then(function (r) {
      if (r.ok && (url.origin === self.location.origin || url.hostname.endsWith("jsdelivr.net") || url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com"))) {
        var copia = r.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      }
      return r;
    });
  }));
});
