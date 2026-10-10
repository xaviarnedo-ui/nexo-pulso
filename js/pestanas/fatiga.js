import { h, num, diasAtras } from '../util.js';
import { lineaFranja, punto } from '../graficos.js';
import { dato, tarjetaEstado } from '../filas.js';
import { colorHRV, colorFC, colorSueno, colorSintomas, colorSensacion, colorEstres, estadoFatiga, hayEnfermo, sintomasRecientes } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }
const signo = x => x == null ? '' : (x > 0 ? '+' : '') + num(x);

const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const numeros = a => a.filter(x => typeof x === 'number' && Number.isFinite(x));
export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Fatiga'); const t = r.datos.fatiga;
  const desde = diasAtras(2);
  const { estado: est, texto } = estadoFatiga(t, estado.cierres, desde);
  v.appendChild(h('h1', null, 'Fatiga'));
  v.appendChild(tarjetaEstado(est, texto));
  const serie = ((t.hrv && t.hrv.serie) || []).filter(p => p.hrv7 != null);
  const fr = t.fc_reposo || {};
  const g = h('section', 'card'); const cab = h('div', 'entre fila-ind'); cab.append(punto(colorHRV(t.hrv_bajo, fr.sobre_base)), h('h2', 'etq', 'HRV 7 días'), h('span', 'cifra', serie.length ? num(serie[serie.length - 1].hrv7, 0) + ' ms' : '·')); g.appendChild(cab);
  // lo/hi pueden ser null (sin franja): Number(null) valdría 0 y pintaría la banda hasta cero.
  if (serie.length) g.appendChild(lineaFranja(serie.map(p => ({ y: Number(p.hrv7), lo: p.lo == null ? null : Number(p.lo), hi: p.hi == null ? null : Number(p.hi) })))); v.appendChild(g);
  const l = h('section', 'card'); const li = h('div', 'lista');
  if (fr.valor != null) { const extra = fr.base == null ? '' : `base ${num(fr.base, 0)}` + (fr.sobre_base == null ? '' : ` (${signo(fr.sobre_base)})`);
    li.appendChild(dato('FC en reposo', num(fr.valor, 0), extra, colorFC(fr.sobre_base))); }
  if (t.sueno_pct != null) li.appendChild(dato('Sueño frente a tu necesidad', t.sueno_pct + ' %', '7 días', colorSueno(t.sueno_pct)));
  if (t.carga) li.appendChild(dato('Carga (strain) 7 días', num(t.carga.semana, 0), `media de 4 semanas ${num(t.carga.media_4, 0)}`, 'gris'));
  if (li.children.length) { l.appendChild(li); v.appendChild(l); }
  const s = h('section', 'card'); s.appendChild(h('h2', null, 'Cómo te sientes (tus cierres de 7 días)')); const ls = h('div', 'lista'); const sem = estado.cierres.filter(x => x.fecha >= diasAtras(6));
  const sens = media(numeros(sem.map(x => x.sensacion))), estr = media(numeros(sem.map(x => x.estres)));
  ls.appendChild(dato('Sensación media', num(sens), '1–5', colorSensacion(sens)));
  ls.appendChild(dato('Estrés medio', num(estr), '1–5', colorEstres(estr)));
  ls.appendChild(dato('Días con molestia', String(sem.filter(x => x.molestia && x.molestia !== 'no').length), 'de ' + sem.length, 'gris'));
  // Misma ventana que la regla E5 (2 días) para el número y el punto.
  const sint = sintomasRecientes(estado.cierres, desde), n2 = estado.cierres.filter(x => x.fecha >= desde).length;
  ls.appendChild(dato('Síntomas (2 días)', sint == null ? '·' : String(sint), sint == null ? '' : 'de ' + n2, colorSintomas(sint)));
  s.appendChild(ls); v.appendChild(s);
}
