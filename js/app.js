import { sesion, pedirCodigo, verificarCodigo, leerCierres, leerAyunoActual, leerAyunos, ultimoResumen, leerAjustes } from './datos.js';
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
let actual = (location.hash || '#hoy').slice(1);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

async function recargar() {
  const [c, a, aa, r, aj] = await Promise.all([leerCierres(diasAtras(30)), leerAyunos(diasAtras(30) + 'T00:00'), leerAyunoActual(), ultimoResumen(), leerAjustes()]);
  Object.assign(estado, { cierres: c, ayunos: a, ayunoActual: aa, resumen: r, ajustes: aj });
  pintar();
}

function ir(tab) { actual = PESTANAS[tab] ? tab : 'hoy'; history.replaceState(null, '', '#' + actual); pintar(); vista.focus(); window.scrollTo(0, 0); }

function pintar() {
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
  const c = h('section', 'card'); c.appendChild(h('h1', null, 'NEXO Pulso')); c.appendChild(h('p', 'lbl', 'Entra con tu email: te llega un código de 6 dígitos.'));
  const email = h('input'); email.type = 'email'; email.autocomplete = 'email'; email.placeholder = 'nombre@ejemplo.com';
  const codigo = h('input'); codigo.inputMode = 'numeric'; codigo.autocomplete = 'one-time-code'; codigo.placeholder = '123456'; codigo.hidden = true;
  const btn = h('button', 'btn primario', 'Enviarme el código'); const m = h('div', 'msg', msg || '');
  btn.onclick = async () => {
    m.className = 'msg'; m.textContent = '';
    try {
      if (codigo.hidden) { await pedirCodigo(email.value.trim()); codigo.hidden = false; btn.textContent = 'Entrar'; m.textContent = 'Código enviado. Mira tu correo.'; codigo.focus(); }
      else { await verificarCodigo(email.value.trim(), codigo.value.trim()); arrancar(); }
    } catch (e) { m.className = 'msg err'; m.textContent = 'No ha funcionado: ' + (e.message || e) + '. Revisa el email o el código.'; }
  };
  [email, codigo, btn, m].forEach(x => c.appendChild(x)); vista.appendChild(c);
}

async function arrancar() {
  if (!(await sesion())) return pintarLogin();
  document.getElementById('tabs').hidden = false; document.getElementById('btn-ajustes').hidden = false;
  try { await recargar(); } catch (e) { vista.textContent = ''; vista.appendChild(h('div', 'aviso', 'No se han podido cargar tus datos: ' + (e.message || e))); }
}

document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => ir(b.dataset.tab)));
document.getElementById('btn-ajustes').addEventListener('click', () => ir('ajustes'));
document.addEventListener('visibilitychange', () => { if (!document.hidden && estado.ajustes) recargar().catch(() => {}); });
window.addEventListener('online', pintar); window.addEventListener('offline', pintar);
arrancar();
