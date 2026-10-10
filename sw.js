// Service worker: la app funciona sin conexión una vez visitada.
// Sube VERSION cada vez que publiques cambios para que los navegadores renueven la caché.
const VERSION = 'mx-20261010-1555';
const SHELL = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/reader.js',
  'manifest.webmanifest', 'img/icon.svg', 'img/nuevo-ciclo.png', 'data/library.json', 'data/content.json',
  'data/nuevo-ciclo/content.json', 'data/diagram.css',
  // portadas
  'img/mxxi1.webp', 'img/mxxi2.webp', 'img/mxxi3.webp', 'img/mxxi4.webp', 'img/mxxi5.webp',
  'img/nc1.webp', 'img/nc2.webp', 'img/nc3.webp', 'img/nc4.webp',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // 'reload': saltarse la caché HTTP del navegador, para no guardar como nueva una versión anterior
    await cache.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
    // Precarga de diagramas (pequeños); los textos íntegros se cachean al abrirlos.
    try {
      const files = await (await fetch('data/files.json')).json();
      await cache.addAll(files.filter(f => f.endsWith('.svg')));
    } catch { /* sin lista: se cachean bajo demanda */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  // Código de la app: red primero (para recibir actualizaciones), caché si no hay conexión.
  const isCode = sameOrigin && /\.(html|js|css|webmanifest)$|\/$/.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (isCode) {
      try {
        // sin la caché HTTP del navegador (GitHub Pages da 10 min): siempre la última versión publicada
        const res = await (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' }));
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || cache.match('index.html');
      }
    }
    // Datos y fuentes: caché primero.
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  })());
});
