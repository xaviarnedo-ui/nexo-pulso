import { guardarAjustes, guardarSuscripcion, borrarSuscripcion, salir } from '../datos.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { h } from '../util.js';

const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };

async function activarAvisos(m) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) { m.textContent = 'Este navegador no admite avisos. En iPhone, añade la app a la pantalla de inicio y ábrela desde ahí.'; return false; }
  if ((await Notification.requestPermission()) !== 'granted') { m.textContent = 'Sin permiso para avisos. Actívalo en Ajustes del iPhone → Notificaciones → Pulso.'; return false; }
  const reg = await navigator.serviceWorker.ready;
  const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC_KEY) });
  await guardarSuscripcion(s); return true;
}

export function pintar(v, estado, { recargar, ir }) {
  const a = estado.ajustes || {};
  v.appendChild(h('h1', null, 'Ajustes'));
  const c = h('section', 'card'); const m = h('div', 'msg');
  const avisos = h('button', 'btn', a.avisos ? 'Avisos activados en este móvil · desactivar' : 'Activar avisos en este móvil');
  avisos.onclick = async () => {
    try {
      if (!a.avisos) { if (await activarAvisos(m)) { await guardarAjustes({ avisos: true }); m.className = 'msg ok'; m.textContent = 'Avisos activados.'; } }
      else { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) { await borrarSuscripcion(s.endpoint); await s.unsubscribe(); } await guardarAjustes({ avisos: false }); }
      await recargar(); ir('ajustes');
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); }
  };
  const hora = h('div', 'q'); hora.appendChild(h('span', 't', 'Hora del recordatorio del cierre'));
  const sel = h('div', 'opciones c5');
  [20, 21, 22, 23, 0].forEach(x => { const b = h('button', null, String(x).padStart(2, '0') + ':00'); b.setAttribute('aria-pressed', a.hora_aviso === x ? 'true' : 'false');
    b.onclick = async () => { await guardarAjustes({ hora_aviso: x }); await recargar(); ir('ajustes'); }; sel.appendChild(b); });
  hora.appendChild(sel);
  hora.appendChild(h('span', 'pie', 'Solo te avisa si a esa hora aún no has hecho el cierre.'));
  const out = h('button', 'btn', 'Cerrar sesión'); out.onclick = async () => { await salir(); location.reload(); };
  [avisos, m, hora, out].forEach(x => c.appendChild(x)); v.appendChild(c);
}
