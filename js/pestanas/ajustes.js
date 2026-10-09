import { guardarAjustes, guardarSuscripcion, borrarSuscripcion, salir } from '../datos.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { h } from '../util.js';

const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };

// Registro del service worker, o null si no llega en 4 s (p. ej. si su registro falló).
async function registroListo() {
  if (!('serviceWorker' in navigator)) return null;
  return Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 4000))]);
}

// Suscripción de ESTE móvil (el aviso de ajustes es por usuario; la suscripción es por dispositivo).
async function suscripcionLocal() {
  const reg = await registroListo();
  return reg && 'pushManager' in reg ? reg.pushManager.getSubscription() : null;
}

// Pide permiso y crea la suscripción (sin guardarla). Devuelve { s, previa } o null si no se ha podido.
// previa = la suscripción que ya existía antes de este clic (si existía), para poder deshacer solo la nueva.
async function activarAvisos(m) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) { m.textContent = 'Este navegador no admite avisos. En iPhone, añade la app a la pantalla de inicio y ábrela desde ahí.'; return null; }
  if ((await Notification.requestPermission()) !== 'granted') { m.textContent = 'Sin permiso para avisos. Actívalo en Ajustes del iPhone → Notificaciones → Pulso.'; return null; }
  const reg = await registroListo();
  if (!reg) { m.textContent = 'No se ha podido preparar la app para avisos. Ábrela desde la pantalla de inicio.'; return null; }
  const previa = await reg.pushManager.getSubscription();
  const s = previa || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC_KEY) });
  return { s, previa };
}

export function pintar(v, estado, { recargar, ir }) {
  const a = estado.ajustes || {};
  v.appendChild(h('h1', null, 'Ajustes'));
  const c = h('section', 'card'); const m = h('div', 'msg');
  const avisos = h('button', 'btn', 'Comprobando avisos…');
  avisos.disabled = true;
  const etiqueta = s => { avisos.textContent = s ? 'Avisos activados en este móvil · desactivar' : 'Activar avisos en este móvil'; };
  // Estado real de este móvil, calculado tras pintar (pintar es síncrono).
  (async () => { try { etiqueta(await suscripcionLocal()); } catch (e) { etiqueta(null); } avisos.disabled = false; })();
  avisos.onclick = async () => {
    avisos.disabled = true;
    try {
      const s = await suscripcionLocal();
      if (!s) {
        const r = await activarAvisos(m);
        if (!r) { m.className = 'msg err'; return; }   // el mensaje de activarAvisos se queda visible
        try {
          await guardarSuscripcion(r.s);
          await guardarAjustes({ avisos: true });
        } catch (e) {
          // Deshacer lo que este clic creó, para que el siguiente clic vuelva a intentar la activación.
          if (!r.previa) { await r.s.unsubscribe().catch(() => {}); await borrarSuscripcion(r.s.endpoint).catch(() => {}); }
          m.className = 'msg err'; m.textContent = e.message || String(e); etiqueta(null); return;
        }
        m.className = 'msg ok'; m.textContent = 'Avisos activados.'; etiqueta(r.s);
      } else {
        await borrarSuscripcion(s.endpoint); await s.unsubscribe();   // avisos (usuario) sigue true en otros dispositivos
        m.className = 'msg ok'; m.textContent = 'Avisos desactivados en este móvil.'; etiqueta(null);
      }
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); }
    finally { avisos.disabled = false; }
  };
  const hora = h('div', 'q'); hora.appendChild(h('span', 't', 'Hora del recordatorio del cierre'));
  const sel = h('div', 'opciones c5');
  [20, 21, 22, 23, 0].forEach(x => { const b = h('button', null, String(x).padStart(2, '0') + ':00'); b.setAttribute('aria-pressed', a.hora_aviso === x ? 'true' : 'false');
    b.onclick = async () => {
      try { await guardarAjustes({ hora_aviso: x }); await recargar(); ir('ajustes'); }
      catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); }
    }; sel.appendChild(b); });
  hora.appendChild(sel);
  hora.appendChild(h('span', 'pie', 'Solo te avisa si a esa hora aún no has hecho el cierre.'));
  const out = h('button', 'btn', 'Cerrar sesión'); out.onclick = async () => { await salir(); location.reload(); };
  [avisos, m, hora, out].forEach(x => c.appendChild(x)); v.appendChild(c);
}
