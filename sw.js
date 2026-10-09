// Service worker: la app funciona sin conexión una vez visitada.
// Sube VERSION cada vez que publiques cambios para que los navegadores renueven la caché.
const VERSION = 'mx-v2';
const SHELL = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/reader.js',
  'manifest.webmanifest', 'img/icon.svg', 'data/content.json', 'data/diagram.css',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
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
        const res = await fetch(req);
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
