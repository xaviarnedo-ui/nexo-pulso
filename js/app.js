import { sesion, entrar, leerCierres, leerAyunoActual, leerAyunos, ultimoResumen, leerAjustes } from './datos.js';
import { h, diasAtras, fmtFecha } from './util.js';
import * as hoy from './pestanas/hoy.js';
import * as forma from './pestanas/forma.js';
import * as fatiga from './pestanas/fatiga.js';
import * as carrera from './pestanas/carrera.js';
import * as cuerpo from './pestanas/cuerpo.js';
import * as ajustes from './pestanas/ajustes.js';

const PESTANAS = { hoy, forma, fatiga, carrera, cuerpo, ajustes };
const vista = document.getElementById('vista');
const estado = { cierres: [], ayunos: [], ayunoActual: null, resumen: null, ajustes: null };
const valida = t => Object.hasOwn(PESTANAS, t) ? t : 'hoy';
let actual = valida((location.hash || '#hoy').slice(1));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

async function recargar() {
  const [c, a, aa, r, aj] = await Promise.all([leerCierres(diasAtras(30)), leerAyunos(diasAtras(30) + 'T00:00'), leerAyunoActual(), ultimoResumen(), leerAjustes()]);
  Object.assign(estado, { cierres: c, ayunos: a, ayunoActual: aa, resumen: r, ajustes: aj });
  pintar();
}

function ir(tab) { actual = valida(tab); history.replaceState(null, '', '#' + actual); pintar(); vista.focus(); window.scrollTo(0, 0); }

function pintar() {
  if (!estado.ajustes) return;   // sin sesión o sin datos cargados: no repintar (no tapar el login ni pintar nulos)
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === actual ? 'page' : 'false'));
  const r = estado.resumen;
  document.getElementById('cab-sub').textContent = actual === 'hoy' || actual === 'ajustes' || !r
    ? new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'datos del ' + fmtFecha(r.datos_hasta);
  vista.textContent = '';
  if (!navigator.onLine) vista.appendChild(h('div', 'aviso', 'Sin conexión: no se guardará nada hasta que vuelva.'));
  PESTANAS[actual].pintar(vista, estado, { recargar, ir });
}

function pintarLogin(msg) {
  document.getElementById('tabs').hidden = true; document.getElementById('btn-ajustes').hidden = true;
  vista.textContent = '';
  const c = h('section', 'card'); c.appendChild(h('h1', null, 'NEXO Pulso')); c.appendChild(h('p', 'lbl', 'Entra con tu email y tu contraseña.'));
  const f = h('form'); f.style.cssText = 'display:flex;flex-direction:column;gap:10px';
  const email = h('input'); email.type = 'email'; email.autocomplete = 'username'; email.placeholder = 'nombre@ejemplo.com'; email.setAttribute('aria-label', 'Email');
  const pass = h('input'); pass.type = 'password'; pass.autocomplete = 'current-password'; pass.placeholder = 'Contraseña'; pass.setAttribute('aria-label', 'Contraseña');
  const btn = h('button', 'btn primario', 'Entrar'); btn.type = 'submit';
  const m = h('div', 'msg', msg || '');
  f.onsubmit = async e => {
    e.preventDefault(); m.className = 'msg'; m.textContent = ''; btn.disabled = true;
    try { await entrar(email.value.trim(), pass.value); arrancar(); }
    catch (err) { m.className = 'msg err'; m.textContent = 'No ha funcionado: revisa el email y la contraseña.'; }
    finally { btn.disabled = false; }
  };
  [email, pass, btn].forEach(x => f.appendChild(x)); c.appendChild(f); c.appendChild(m); vista.appendChild(c);
}

const sinRed = e => !navigator.onLine || e instanceof TypeError || /fetch|network/i.test((e && e.message) || '');
let sinConexionPintado = false;   // el aviso de arranque se retira solo al volver la red
function avisoSinConexion() {
  sinConexionPintado = true;
  document.getElementById('tabs').hidden = true; document.getElementById('btn-ajustes').hidden = true;
  vista.textContent = '';
  vista.appendChild(h('div', 'aviso', 'Sin conexión: abre la app cuando vuelva la red.'));
}

async function arrancar() {
  let s;
  sinConexionPintado = false;
  try { s = await sesion(); }
  catch (e) { return sinRed(e) ? avisoSinConexion() : pintarLogin(); }   // sin red no se puede ni renovar la sesión; con red, a entrar de nuevo
  if (!s) return pintarLogin();
  document.getElementById('tabs').hidden = false; document.getElementById('btn-ajustes').hidden = false;
  try { await recargar(); }
  catch (e) {
    vista.textContent = '';
    if (sinRed(e)) sinConexionPintado = true;
    vista.appendChild(h('div', 'aviso', sinRed(e) ? 'Sin conexión: abre la app cuando vuelva la red.' : 'No se han podido cargar tus datos: ' + (e.message || e)));
  }
}

document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => ir(b.dataset.tab)));
document.getElementById('btn-ajustes').addEventListener('click', () => ir('ajustes'));
document.addEventListener('visibilitychange', () => { if (!document.hidden && estado.ajustes) recargar().catch(() => {}); });
window.addEventListener('online', () => { if (sinConexionPintado) arrancar(); else pintar(); }); window.addEventListener('offline', pintar);
arrancar();
