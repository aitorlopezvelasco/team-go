/* Generado por tools/build.js. No editar a mano. */
const CACHE = 'team-go-2026-11-16-24167c9a';
const BASICOS = ['./', 'index.html', 'manifest.json', 'icono.svg', 'icono-192.png', 'icono-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const fuente = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !fuente) return;          // PvPoke y demás: siempre a la red
  if (fuente) {                                                   // fuentes: primero la caché
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }))));
    return;
  }
  e.respondWith(                                                  // la app: primero la red, caché de reserva
    fetch(e.request).then(n => { if (n.ok) { const cp = n.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return n; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
