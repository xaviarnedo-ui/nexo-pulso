import { h, num, diasAtras, conSigno, pct } from '../util.js';
import { lineaFranja } from '../graficos.js';
import { dato, tarjetaEstado, cabecera, heroe, tesela } from '../filas.js';
import { colorHRV, colorFC, colorSueno, colorSintomas, colorSensacion, colorEstres, estadoFatiga, sintomasRecientes } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

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
  const g = h('section', 'card');
  g.appendChild(heroe('HRV · media de 7 días', serie.length ? num(serie[serie.length - 1].hrv7, 0) : '·', serie.length ? 'ms' : null, { color: colorHRV(t.hrv_bajo, fr.sobre_base) }));
  // lo/hi pueden ser null (sin franja): Number(null) valdría 0 y pintaría la banda hasta cero.
  if (serie.length) {
    g.appendChild(lineaFranja(serie.map(p => ({ y: Number(p.hrv7), lo: p.lo == null ? null : Number(p.lo), hi: p.hi == null ? null : Number(p.hi) }))));
    if (serie.some(p => p.lo != null && p.hi != null)) g.appendChild(h('div', 'pie', 'La banda es tu franja normal.'));
  }
  v.appendChild(g);

  const li = h('div', 'lista');
  if (fr.valor != null) {
    const dif = fr.sobre_base == null ? null : Math.round(fr.sobre_base);   // solo si se nota: +0,1 lpm no es nada
    li.appendChild(dato('FC en reposo', num(fr.valor, 0), dif ? conSigno(dif, 0) + ' sobre tu base' : '', colorFC(fr.sobre_base)));
  }
  if (t.sueno_pct != null) li.appendChild(dato('Sueño', pct(t.sueno_pct), '', colorSueno(t.sueno_pct)));
  if (t.carga) li.appendChild(dato('Carga 7 d', num(t.carga.semana, 0), t.carga.media_4 == null ? '' : 'media ' + num(t.carga.media_4, 0), 'gris'));
  if (li.children.length) { const l = h('section', 'card'); l.appendChild(li); v.appendChild(l); }

  // Tus cierres de los últimos 7 días; los síntomas, en la misma ventana que la regla (2 días) para el número y el punto.
  const sem = estado.cierres.filter(x => x.fecha >= diasAtras(6));
  const sens = media(numeros(sem.map(x => x.sensacion))), estr = media(numeros(sem.map(x => x.estres)));
  const sint = sintomasRecientes(estado.cierres, desde), n2 = estado.cierres.filter(x => x.fecha >= desde).length;
  const s = h('section', 'card'); s.appendChild(cabecera('Cómo te sientes', sem.length === 1 ? '1 cierre en 7 días' : sem.length + ' cierres en 7 días'));
  const tg = h('div', 'teselas t2');
  tg.appendChild(tesela('Sensación', num(sens), colorSensacion(sens)));
  tg.appendChild(tesela('Estrés', num(estr), colorEstres(estr)));
  tg.appendChild(tesela('Molestias', sem.filter(x => x.molestia && x.molestia !== 'no').length + '/' + sem.length, 'gris'));
  tg.appendChild(tesela('Síntomas 2 días', sint == null ? '·' : sint + '/' + n2, colorSintomas(sint)));
  s.appendChild(tg); v.appendChild(s);
}
