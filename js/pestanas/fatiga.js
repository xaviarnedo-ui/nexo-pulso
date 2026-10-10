import { h, num, fmtFecha, diasAtras } from '../util.js';
import { anillo, lineaFranja } from '../graficos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }
function dato(etq, valor, extra, cls) { const e = h('div', 'entre'); e.appendChild(h('span', null, etq)); const s = h('span', 'cifra' + (cls ? ' ' + cls : ''), valor); if (extra) s.appendChild(h('span', 'pie', ' ' + extra)); e.appendChild(s); return e; }
const signo = x => x == null ? '' : (x > 0 ? '+' : '') + num(x);

const COLOR = { verde: 'var(--verde)', ambar: 'var(--ambar)', rojo: 'var(--rojo)' }, NOMBRE = { verde: 'Verde', ambar: 'Ámbar', rojo: 'Rojo' };
const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Fatiga'); const t = r.datos.fatiga;
  const recientes = estado.cierres.filter(x => x.fecha >= diasAtras(2));
  let est = t.estado, texto = t.texto;
  if (recientes.some(x => x.enfermo)) { est = 'rojo'; texto = 'Has marcado síntomas: descanso o algo muy suave (E5).'; }
  v.appendChild(h('h1', null, 'Fatiga'));
  const c = h('section', 'card'); const f = h('div', 'fila');
  f.appendChild(anillo({ verde: 1, ambar: 0.6, rojo: 0.25 }[est], COLOR[est], NOMBRE[est]));
  const d = h('div', 'crece'); d.appendChild(h('h2', null, texto)); if (t.hrv_bajo) d.appendChild(h('div', 'lbl', 'Tu HRV de 7 días está por debajo de tu franja.')); f.appendChild(d); c.appendChild(f); v.appendChild(c);
  const g = h('section', 'card'); g.appendChild(h('div', 'entre')).append(h('h2', null, 'HRV 7 días'), h('span', 'lbl', 'banda = tu franja normal'));
  // lo/hi pueden ser null (sin franja): Number(null) valdría 0 y pintaría la banda hasta cero.
  g.appendChild(lineaFranja(t.hrv.serie.filter(p => p.hrv7 != null).map(p => ({ y: Number(p.hrv7), lo: p.lo == null ? null : Number(p.lo), hi: p.hi == null ? null : Number(p.hi) })))); v.appendChild(g);
  const l = h('section', 'card'); const li = h('div', 'lista');
  if (t.fc_reposo.valor != null) li.appendChild(dato('FC en reposo', num(t.fc_reposo.valor, 0), `base ${num(t.fc_reposo.base, 0)} (${signo(t.fc_reposo.sobre_base)})`, t.fc_reposo.sobre_base >= 3 ? 'baja' : ''));
  if (t.sueno_pct != null) li.appendChild(dato('Sueño frente a tu necesidad', t.sueno_pct + ' %', '7 días'));
  if (t.carga) li.appendChild(dato('Carga (strain) 7 días', num(t.carga.semana, 0), `media de 4 semanas ${num(t.carga.media_4, 0)}`));
  l.appendChild(li); v.appendChild(l);
  const s = h('section', 'card'); s.appendChild(h('h2', null, 'Cómo te sientes (tus cierres de 7 días)')); const ls = h('div', 'lista'); const sem = estado.cierres.filter(x => x.fecha >= diasAtras(6));
  ls.appendChild(dato('Sensación media', num(media(sem.map(x => x.sensacion))), '1–5'));
  ls.appendChild(dato('Estrés medio', num(media(sem.map(x => x.estres))), '1–5'));
  ls.appendChild(dato('Días con molestia', String(sem.filter(x => x.molestia && x.molestia !== 'no').length), 'de ' + sem.length));
  ls.appendChild(dato('Días con síntomas', String(sem.filter(x => x.enfermo).length), 'de ' + sem.length));
  s.appendChild(ls); v.appendChild(s);
}
