import { h, CLAVE_DIA, fechaCorta } from './util.js';

const NOMBRE_TIPO = { entreno: 'Entreno', entreno_fuerte: 'Fuerte', vispera: 'Víspera', partido: 'Partido', recuperacion: 'Recuperac.', descanso: 'Descanso' };
let tipoElegido = null, varianteElegida = 0;

const cab = (t, pie) => { const c = h('div', 'cabecera'); c.appendChild(h('h2', null, t)); if (pie) c.appendChild(h('span', 'pie', pie)); return c; };
const macros = x => [x.kcal != null ? x.kcal + ' kcal' : null, x.p != null ? 'P ' + x.p : null, x.c != null ? 'H ' + x.c : null, x.g != null ? 'G ' + x.g : null].filter(Boolean).join(' · ');

export function pintar(v, estado) {
  v.appendChild(h('h1', null, 'Menú'));
  const m = estado.menu;
  if (!m) {
    const c = h('section', 'card'); c.appendChild(h('div', 'destacado', 'Todavía no tienes menú'));
    c.appendChild(h('div', 'lbl', 'El entrenador lo prepara con tu perfil y lo que has contestado en el formulario. Lo verás aquí en cuanto esté listo.')); v.appendChild(c); return;
  }
  const hoyClave = CLAVE_DIA[new Date().getDay()], tipos = Object.keys(m.tipos);
  if (!tipoElegido || !m.tipos[tipoElegido]) tipoElegido = (m.semana && m.semana[hoyClave] && m.tipos[m.semana[hoyClave]]) ? m.semana[hoyClave] : tipos[0];
  const tipo = m.tipos[tipoElegido];
  if (varianteElegida >= tipo.variantes.length) varianteElegida = 0;
  const repintar = () => { v.textContent = ''; pintar(v, estado); };

  const o = h('section', 'card'); o.appendChild(cab('Tu objetivo diario', m.actualizado ? 'menú del ' + fechaCorta(m.actualizado) : null));
  if (m.objetivo) { o.appendChild(h('div', 'media cifra', m.objetivo.kcal + ' kcal')); o.appendChild(h('div', 'lbl', 'Proteína ' + m.objetivo.proteina + ' g · hidratos ' + m.objetivo.hidratos + ' g · grasa ' + m.objetivo.grasa + ' g (un día de entreno)')); }
  if (m.objetivo && m.objetivo.texto) o.appendChild(h('div', 'pie', m.objetivo.texto));
  v.appendChild(o);

  if (hoyClave === 'lun' && m.tipos.recuperacion) v.appendChild(h('div', 'lbl', 'Es lunes: si jugaste ayer, elige Recuperación; si no, Entreno.'));
  const sel = h('div', 'opciones c' + Math.min(6, tipos.length));
  tipos.forEach(k => { const b = h('button', null, NOMBRE_TIPO[k] || k); b.type = 'button'; b.setAttribute('aria-pressed', k === tipoElegido ? 'true' : 'false'); b.onclick = () => { tipoElegido = k; varianteElegida = 0; repintar(); }; sel.appendChild(b); });
  v.appendChild(sel);
  if (tipo.variantes.length > 1) {
    const vs = h('div', 'opciones c' + Math.min(4, tipo.variantes.length));
    tipo.variantes.forEach((x, i) => { const b = h('button', null, 'Opción ' + (i + 1)); b.type = 'button'; b.setAttribute('aria-pressed', i === varianteElegida ? 'true' : 'false'); b.onclick = () => { varianteElegida = i; repintar(); }; vs.appendChild(b); });
    v.appendChild(vs);
  }

  const dia = tipo.variantes[varianteElegida], c = h('section', 'card');
  c.appendChild(cab(tipo.nombre || NOMBRE_TIPO[tipoElegido], dia.total ? macros(dia.total) : null));
  if (tipo.nota) c.appendChild(h('div', 'lbl', tipo.nota));
  dia.comidas.forEach(co => {
    const bloque = h('div', 'comida'); const t = h('div', 'entre');
    t.appendChild(h('span', 'subtitulo', co.nombre + (co.hora ? ' · ' + co.hora : ''))); if (co.kcal) t.appendChild(h('span', 'sec', macros(co)));
    bloque.appendChild(t);
    co.platos.forEach(p => {
      if (typeof p === 'string') { bloque.appendChild(h('div', 'plato', p)); return; }
      const tp = h('div', 'entre'); tp.appendChild(h('span', 'plato-t', p.t));
      if (p.m && co.platos.length > 1) tp.appendChild(h('span', 'sec', macros({ kcal: p.m[0], p: p.m[1], c: p.m[2], g: p.m[3] }))); bloque.appendChild(tp); (p.i || []).forEach(x => bloque.appendChild(h('div', 'plato', x)));
    });
    c.appendChild(bloque);
  });
  v.appendChild(c);

  if (m.consejos && m.consejos.length) { const k = h('section', 'card'); k.appendChild(cab('Para que funcione')); m.consejos.forEach(x => k.appendChild(h('div', 'vineta-txt', x))); v.appendChild(k); }
  if (m.evitar && m.evitar.length) { const k = h('section', 'card'); k.appendChild(cab('Fuera de tu menú')); k.appendChild(h('div', 'lbl', m.evitar.join(', '))); v.appendChild(k); }
}
