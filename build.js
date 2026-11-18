#!/usr/bin/env node
/* Genera index.html y sw.js a partir de tools/plantilla.html y los datos de PvPoke.
   Uso:  node tools/build.js                 → descarga de GitHub (PvPoke)
         node tools/build.js --local carpeta → usa carpeta/gamemaster.json y carpeta/rankings/<ruta>.json
   Node 22 o superior. Sin dependencias. */
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
const BASE = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/';
const i = process.argv.indexOf('--local');
const LOCAL = i > -1 ? process.argv[i + 1] : null;
const TOP = 40;

async function leer(ruta, obligatorio) {
  try {
    if (LOCAL) return JSON.parse(fs.readFileSync(path.join(LOCAL, ruta), 'utf8'));
    const r = await fetch(BASE + ruta);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    if (obligatorio) throw new Error('No se pudo leer ' + ruta + ': ' + e.message);
    console.warn('  · omitida (' + ruta + '): ' + e.message);
    return null;
  }
}

(async () => {
  const plantilla = fs.readFileSync(path.join(__dirname, 'plantilla.html'), 'utf8');
  if (!plantilla.includes('/*__DATOS__*/null')) throw new Error('La plantilla no tiene el hueco /*__DATOS__*/null');
  // El convertidor y la lista de ligas viven en la plantilla: una sola fuente de verdad.
  const conv = plantilla.split('//<CONVERTIDOR>')[1].split('//</CONVERTIDOR>')[0];
  const ligasSrc = plantilla.match(/const LIGAS = (\[[\s\S]*?\n\]);/)[1];
  const { indiceGM, convertirLiga } = new Function(conv + '; return {indiceGM, convertirLiga};')();
  const LIGAS = new Function('return ' + ligasSrc)();

  console.log('GameMaster…');
  const ix = indiceGM(await leer('gamemaster.json', true));
  const datos = { fecha: ix.fecha || new Date().toISOString().slice(0, 10), ligas: {}, moves: {} };
  for (const L of LIGAS) {
    const rk = await leer('rankings/' + L.pvpoke + '.json', false);
    if (!Array.isArray(rk) || !rk.length) continue;
    datos.ligas[L.id] = convertirLiga(rk, ix, L.cp, TOP, datos.moves);
    console.log('  ' + L.n + ': ' + datos.ligas[L.id].length + ' Pokémon');
  }
  if (!Object.keys(datos.ligas).length) throw new Error('No se ha podido descargar ninguna liga.');

  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  fs.writeFileSync(path.join(RAIZ, 'index.html'), plantilla.replace('/*__DATOS__*/null', () => json));

  // El nombre de la caché cambia con cada meta: así el móvil descarta la versión vieja.
  const version = datos.fecha + '-' + require('crypto').createHash('sha1').update(json + plantilla).digest('hex').slice(0, 8);
  fs.writeFileSync(path.join(RAIZ, 'sw.js'), `/* Generado por tools/build.js. No editar a mano. */
const CACHE = 'team-go-${version}';
const BASICOS = ['./', 'index.html', 'manifest.json', 'icono.svg', 'icono-192.png', 'icono-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const fuente = /fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname);
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
`);
  console.log('Listo: index.html (' + Math.round(fs.statSync(path.join(RAIZ, 'index.html')).size / 1024) + ' KB), meta del ' + datos.fecha + ', caché ' + version);
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
