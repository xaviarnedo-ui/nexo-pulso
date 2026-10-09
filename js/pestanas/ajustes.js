import { guardarAjustes, guardarSuscripcion, borrarSuscripcion, salir } from '../datos.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { h } from '../util.js';

const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };

// Suscripción de ESTE móvil (el aviso de ajustes es por usuario; la suscripción es por dispositivo).
async function suscripcionLocal() {
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
  return reg && 'pushManager' in reg ? reg.pushManager.getSubscription() : null;
}

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
        if (!(await activarAvisos(m))) { m.className = 'msg err'; return; }   // el mensaje de activarAvisos se queda visible
        await guardarAjustes({ avisos: true });
        m.className = 'msg ok'; m.textContent = 'Avisos activados.'; etiqueta(await suscripcionLocal());
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
