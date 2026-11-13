// Pulso · Jugador: caché de la interfaz (nunca de datos). Los datos van siempre por red.
const CACHE = 'pulso-jugador-v3';
const V = '?v=3';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const BASE = ['./', 'index.html', 'styles.css' + V, 'js/app.js' + V, 'manifest.json']
  .concat(['config', 'util', 'datos', 'graficos', 'formulario', 'hoy', 'menu', 'perfil'].map(m => `js/${m}.js`));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => { await c.addAll(BASE); try { await c.put(SUPABASE_JS, await fetch(SUPABASE_JS)); } catch (x) { /* la próxima vez */ } }));
  self.skipWaiting();
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'GET' && e.request.url === SUPABASE_JS) {
    e.respondWith(caches.match(SUPABASE_JS).then(r => r || fetch(e.request).then(f => { if (f.ok) { const c = f.clone(); caches.open(CACHE).then(x => x.put(SUPABASE_JS, c)); } return f; })));
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
