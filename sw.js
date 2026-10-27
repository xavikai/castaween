/* Static game files only. Room traffic, uploads and statistics are never cached. */
importScripts('assets/pwa-files.js');
const OFFLINE = self.CASTAWEEN_OFFLINE;
const root = new URL(self.registration.scope);
const CACHE_PREFIX = 'castaween-game-' + root.pathname + '-';
const CACHE_NAME = CACHE_PREFIX + OFFLINE.version;
const fileURL = file => new URL(file, root).href;
const shellURL = fileURL('index.html');
const coreURLs = new Set(OFFLINE.files.map(fileURL));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < OFFLINE.files.length) {
        const url = fileURL(OFFLINE.files[next++]);
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (!response.ok) throw Error('Offline resource unavailable: ' + url);
        await cache.put(url, response);
      }
    }));
  })());
  // Updates wait until existing game windows close: never interrupt a round.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key);
    await self.clients.claim();
  })());
});

function cacheable(request) {
  if (request.method !== 'GET' || request.headers.has('range')) return false;
  const url = new URL(request.url);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return false;
  const path = url.pathname.slice(root.pathname.length);
  if (url.searchParams.has('qa') || url.searchParams.has('disseny')) return false;
  if (request.mode === 'navigate') return path === '' || path === 'index.html';
  if (coreURLs.has(new URL(url.pathname, root.origin).href)) return true;
  return /^assets\/(?:castanyeres|monstres|escenari|so|ui|vendor)\/.+\.(?:glb|js|json|css|png|jpe?g|webp|mp3|wav|ogg|woff2?)$/i.test(path);
}

async function gameResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  const key = request.mode === 'navigate' ? shellURL : new URL(url.pathname, root.origin).href;
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      // Storage quota errors must never block a successful online request.
      try { await cache.put(key, response.clone()); } catch {}
      return response;
    }
    return (await cache.match(key)) || response;
  } catch (error) {
    const saved = await cache.match(key);
    if (saved) return saved;
    throw error;
  }
}
self.addEventListener('fetch', event => {
  if (cacheable(event.request)) event.respondWith(gameResponse(event.request));
});
