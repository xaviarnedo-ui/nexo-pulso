/* NEXO Pulso: caché de la interfaz (sin datos) y notificaciones push. */
const CACHE = 'pulso-v2';
const BASE = ['./', 'index.html', 'styles.css?v=2', 'js/app.js?v=2', 'manifest.json', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;          // Supabase y CDN: siempre red
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
self.addEventListener('push', e => {
  let p = { title: 'NEXO Pulso', body: 'Tienes novedades', url: './' };
  try { p = { ...p, ...e.data.json() }; } catch (x) { /* sin cuerpo */ }
  e.waitUntil(self.registration.showNotification(p.title, { body: p.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: p.url } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => {
    for (const c of cl) { if ('focus' in c) { c.navigate && c.navigate(url); return c.focus(); } }
    return self.clients.openWindow && self.clients.openWindow(url);
  }));
});
