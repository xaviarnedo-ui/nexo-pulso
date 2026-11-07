import { leerToken, cargar } from './datos.js';
import { h } from './util.js';
import * as hoy from './hoy.js';
import * as menu from './menu.js';
import * as perfil from './perfil.js';
import * as formulario from './formulario.js';

const vista = document.getElementById('vista'), tabs = document.getElementById('tabs');
const estado = { perfil: null };
const PESTANAS = { hoy, menu, perfil };
let actual = Object.hasOwn(PESTANAS, (location.hash || '').slice(1)) ? location.hash.slice(1) : 'hoy';
let editandoForm = false;

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

const mensaje = (titulo, texto) => {
  tabs.hidden = true; vista.textContent = '';
  const c = h('section', 'card'); c.appendChild(h('h1', null, titulo)); c.appendChild(h('p', 'lbl', texto)); vista.appendChild(c);
};

async function recargar() {
  const r = await cargar();
  if (!r) return mensaje('Enlace no válido', 'Abre otra vez el enlace que te mandó el entrenador. Si no funciona, pídele uno nuevo.');
  Object.assign(estado, r);
  pintar();
}

function ir(tab) { actual = tab; history.replaceState(null, '', location.pathname + location.search + '#' + tab); pintar(); window.scrollTo(0, 0); }

function pintar() {
  if (!estado.perfil) return;
  vista.textContent = '';
  if (!estado.formulario || editandoForm) {
    tabs.hidden = true;
    if (!estado.formulario) {
      const c = h('section', 'card'); c.appendChild(h('div', 'destacado', 'Hola, ' + estado.perfil.nombre.split(' ')[0]));
      c.appendChild(h('div', 'lbl', 'Antes de empezar necesito conocerte: alergias, lo que te gusta y cómo es tu día. Son unos 5 minutos y es lo que hace que el menú sea tuyo de verdad.'));
      vista.appendChild(c);
    }
    const caja = h('div', 'form-caja'); vista.appendChild(caja);
    formulario.pintar(caja, estado.formulario && estado.formulario.respuestas, async () => { editandoForm = false; await recargar(); });
    return;
  }
  tabs.hidden = false;
  tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === actual ? 'page' : 'false'));
  if (!navigator.onLine) vista.appendChild(h('div', 'aviso', 'Sin conexión: no se guardará nada hasta que vuelva.'));
  PESTANAS[actual].pintar(vista, estado, { recargar, ir, editarFormulario: () => { editandoForm = true; pintar(); window.scrollTo(0, 0); } });
}

tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => ir(b.dataset.tab)));
document.addEventListener('visibilitychange', () => { if (!document.hidden && estado.perfil && !editandoForm && estado.formulario) recargar().catch(() => {}); });
window.addEventListener('online', pintar); window.addEventListener('offline', pintar);

(async function arrancar() {
  if (!leerToken()) return mensaje('Falta tu enlace', 'Abre el enlace personal que te mandó el entrenador.');
  try { await recargar(); }
  catch (e) { mensaje('Sin conexión', 'No se han podido cargar tus datos. Abre la app cuando tengas red.'); }
})();
