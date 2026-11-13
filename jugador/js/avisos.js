import { VAPID_PUBLIC_KEY } from './config.js';
import { pushAlta, pushBaja } from './datos.js';

// Avisos push de este móvil. La suscripción es por dispositivo; el jugador se identifica con su token (datos.js).
const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
export const soportaAvisos = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
// Registro del service worker, o null si no llega en 4 s.
const registroListo = () => Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 4000))]);

export async function suscripcionLocal() {
  if (!soportaAvisos()) return null;
  const reg = await registroListo();
  return reg ? reg.pushManager.getSubscription() : null;
}

// Pide permiso, suscribe y guarda en el servidor. Lanza Error con un mensaje para el jugador.
export async function activarAvisos() {
  if (!soportaAvisos()) throw new Error('Este navegador no admite avisos. En iPhone, añade la app a la pantalla de inicio y ábrela desde ahí.');
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Sin permiso para avisos. Actívalo en Ajustes del móvil → Notificaciones.');
  const reg = await registroListo();
  if (!reg) throw new Error('No se ha podido preparar la app para avisos. Ábrela desde la pantalla de inicio.');
  const previa = await reg.pushManager.getSubscription();
  const s = previa || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC_KEY) });
  try { await pushAlta(s); }
  catch (e) { if (!previa) await s.unsubscribe().catch(() => {}); throw new Error('No se ha podido guardar. Prueba otra vez.'); }
  return s;
}

export async function desactivarAvisos() {
  const s = await suscripcionLocal(); if (!s) return;
  await pushBaja(s.endpoint); await s.unsubscribe();
}
