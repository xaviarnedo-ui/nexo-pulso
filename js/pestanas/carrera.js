import { h, num, fmtFecha, diasAtras, isoDia } from '../util.js';
import { barras } from '../graficos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }
function dato(etq, valor, extra, cls) { const e = h('div', 'entre'); e.appendChild(h('span', null, etq)); const s = h('span', 'cifra' + (cls ? ' ' + cls : ''), valor); if (extra) s.appendChild(h('span', 'pie', ' ' + extra)); e.appendChild(s); return e; }

const AV = { running: 'nº de carreras fuera de lo previsto', crossfit: 'nº de CrossFit fuera de lo previsto', volumen: 'km +30 % sobre la semana anterior (R1)', intensidad: 'menos del 70 % del tiempo fácil (E2)' };
export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Carrera');
  if (!r.datos.carrera) { v.appendChild(h('h1', null, 'Carrera')); v.appendChild(h('section', 'card', 'Sin objetivo de carrera en el resumen.')); return; }
  const c = r.datos.carrera;
  v.appendChild(h('h1', null, 'Carrera'));
  const top = h('section', 'card'); const e = h('div', 'entre');
  const i = h('div'); i.appendChild(h('div', 'lbl', c.carrera));
  // Días de calendario (medianoche local a mediodía local): con UTC la cuenta se queda corta de noche.
  const dias = Math.round((new Date(c.fecha + 'T12:00') - new Date(isoDia(new Date()) + 'T12:00')) / 864e5);
  i.appendChild(h('div', 'cifra grande', String(Math.max(0, dias))));
  i.appendChild(h('div', 'pie', 'días · ' + fmtFecha(c.fecha)));
  const o = h('div'); o.style.textAlign = 'right'; (c.objetivos || []).forEach(x => { o.appendChild(h('div', 'cifra media', x.tiempo)); o.appendChild(h('div', 'pie', x.nivel + ' · ' + x.ritmo)); });
  e.append(i, o); top.appendChild(e); v.appendChild(top);
  const sem = c.semanas || [];
  const g = h('section', 'card'); g.appendChild(h('div', 'entre')).append(h('h2', null, 'Semanas frente al plan'), h('span', 'lbl', 'banda = carreras previstas'));
  g.appendChild(barras(sem.map(s => ({ v: s.running, lo: s.objetivo && s.objetivo.running[0], hi: s.objetivo && s.objetivo.running[1], futura: s.futura, actual: s.actual }))));
  g.appendChild(h('div', 'pie', 'Carreras por semana; en discontinuo, las que quedan.')); v.appendChild(g);
  const act = sem.find(s => s.actual) || [...sem].reverse().find(s => !s.futura);
  if (act) {
    const k = h('section', 'card'); k.appendChild(h('h2', null, (act.actual ? 'Esta semana' : 'Última semana') + (act.fase ? ' · ' + act.fase : '')));
    const l = h('div', 'lista'); l.appendChild(dato('Carreras', String(act.running), act.objetivo ? `previstas ${act.objetivo.running[0]}–${act.objetivo.running[1]}` : ''));
    l.appendChild(dato('Km', num(act.km, 0))); if (act.tirada_km) l.appendChild(dato('Tirada larga', num(act.tirada_km) + ' km'));
    l.appendChild(dato('CrossFit', String(act.crossfit))); if (act.facil_pct != null) l.appendChild(dato('% fácil', act.facil_pct + ' %', 'objetivo ~80 %', act.facil_pct < 70 ? 'baja' : 'sube'));
    k.appendChild(l); (act.avisos || []).forEach(a => k.appendChild(h('div', 'estado-pill ambar', AV[a] || a))); v.appendChild(k);
  }
  if ((c.ritmos || []).length) { const rr = h('section', 'card'); rr.appendChild(h('h2', null, 'Ritmos de referencia')); const l = h('div', 'lista'); c.ritmos.forEach(x => l.appendChild(dato(x.tipo, x.valor))); rr.appendChild(l); v.appendChild(rr); }
}
