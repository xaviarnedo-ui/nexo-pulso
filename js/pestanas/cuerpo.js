import { h, num, fmtFecha, diasAtras } from '../util.js';
import { linea } from '../graficos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }
function dato(etq, valor, extra, cls) { const e = h('div', 'entre'); e.appendChild(h('span', null, etq)); const s = h('span', 'cifra' + (cls ? ' ' + cls : ''), valor); if (extra) s.appendChild(h('span', 'pie', ' ' + extra)); e.appendChild(s); return e; }
const signo = (x, dec = 1) => x == null ? '' : (x > 0 ? '+' : '') + num(x, dec);

export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Cuerpo'); const c = r.datos.cuerpo;
  v.appendChild(h('h1', null, 'Cuerpo'));
  if (c.peso) {
    const p = h('section', 'card'); const e = h('div', 'entre');
    const i = h('div'); i.appendChild(h('div', 'lbl', 'Peso medio de la semana')); i.appendChild(h('div', 'cifra grande', num(c.peso.media)));
    const d = h('div'); d.style.textAlign = 'right'; if (c.peso.cambio != null) d.appendChild(h('div', 'cifra media ' + (c.peso.cambio < 0 ? 'sube' : c.peso.cambio > 0 ? 'baja' : ''), signo(c.peso.cambio) + ' kg'));
    if (c.meta) d.appendChild(h('div', 'pie', 'meta ' + num(c.meta) + ' kg' + (c.fecha_estimada ? ' · ~' + fmtFecha(c.fecha_estimada) : '')));
    e.append(i, d); p.appendChild(e); p.appendChild(linea(c.peso.serie.map(s => ({ y: s.media == null ? null : Number(s.media) })), { meta: c.meta }));
    const l = h('div', 'lista'); if (c.ritmo_kg_sem != null) l.appendChild(dato('Ritmo', signo(c.ritmo_kg_sem, 2) + ' kg/sem', 'objetivo −0,3 a −0,6'));
    if (c.grasa_pct && c.grasa_pct.media != null) l.appendChild(dato('% de grasa (PICOOC)', num(c.grasa_pct.media) + ' %', signo(c.grasa_pct.cambio)));
    p.appendChild(l); v.appendChild(p);
  }
  if (c.nutricion) {
    const dc = c.nutricion.dias_completos; const etiq = dc == null ? null : num(dc, 0) + ' días completos';
    const n = h('section', 'card'); n.appendChild(h('div', 'entre')).append(h('h2', null, 'Comida (Fitia)'), h('span', 'lbl', etiq));
    const l = h('div', 'lista'); l.appendChild(dato('Kcal medias', num(c.nutricion.kcal, 0))); l.appendChild(dato('Proteína media', num(c.nutricion.proteina_g, 0) + ' g', 'objetivo 140 g'));
    (c.nutricion.objetivo || []).forEach(o => l.appendChild(dato('Objetivo · ' + o.tipo, o.kcal + ' kcal'))); n.appendChild(l); v.appendChild(n);
  }
  const a = estado.ayunos.filter(x => x.horas != null && Number.isFinite(Number(x.horas))).slice(0, 7);
  if (a.length) { const y = h('section', 'card'); y.appendChild(h('h2', null, 'Ayuno')); const l = h('div', 'lista');
    l.appendChild(dato('Media de tus 7 últimos', num(a.reduce((s, x) => s + Number(x.horas), 0) / a.length) + ' h'));
    l.appendChild(dato('El más largo', num(Math.max(...a.map(x => Number(x.horas)))) + ' h')); y.appendChild(l); v.appendChild(y); }
}
