import { h, num, conSigno, esCero, limpia, pct } from '../util.js';
import { lineaZonas, etiquetasSemanas } from '../graficos.js';
import { dato, tarjetaEstado, cabecera, heroe, cambio, tesela } from '../filas.js';
import { colorIndice, peor, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

const NOMBRE = { aerobico: 'Aeróbico', fuerza: 'Fuerza', composicion: 'Composición' };
// Nombre corto de un marcador: sin paréntesis y solo la parte antes de " · " ("Press banca · 1RM est. / peso" → "Press banca").
const CORTO = { '% de grasa corporal': '% grasa' };
const corto = s => { const t = limpia(s).split(' · ')[0]; return CORTO[t] || t; };
const tono = x => x > 0 ? 'sube' : x < 0 ? 'baja' : '';
const GRAV = { verde: 1, ambar: 2, rojo: 3 };
const PREFIJO = { verde: 'Índice en tu base', ambar: 'Índice algo por debajo', rojo: 'Índice por debajo' };
// Frase del estado: si el color peor no sale del índice sino de algún pilar, se dice cuál ("Índice en tu base; aeróbico, algo por debajo.").
function fraseForma(indice, pilares, global) {
  const ci = colorIndice(indice), gi = GRAV[ci] || 0;
  const bajan = pilares.filter(p => (GRAV[colorIndice(p.valor)] || 0) > gi).map(p => (NOMBRE[p.nombre] || p.nombre).toLowerCase());
  if (!bajan.length || (global !== 'ambar' && global !== 'rojo')) return frase('forma', global);
  const quien = bajan.length > 1 ? bajan.slice(0, -1).join(', ') + ' y ' + bajan[bajan.length - 1] : bajan[0];
  const pre = PREFIJO[ci] || 'Índice sin datos';
  return global === 'rojo' ? `${pre}; ${quien}, por debajo: prioriza recuperar.` : `${pre}; ${quien}, algo por debajo.`;
}

export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Forma'); const f = r.datos.forma;
  const pilares = f.pilares || [];
  v.appendChild(h('h1', null, 'Forma'));
  const global = peor([colorIndice(f.indice), ...pilares.map(p => colorIndice(p.valor))]);
  v.appendChild(tarjetaEstado(global, fraseForma(f.indice, pilares, global)));

  const c = h('section', 'card');
  const pill = f.cambio == null || esCero(f.cambio) ? null : cambio(conSigno(f.cambio), tono(f.cambio));
  if (pill) pill.title = 'frente a la semana anterior';
  c.appendChild(heroe('Índice de forma', num(f.indice), null, { extra: pill }));
  // Últimas semanas sobre las zonas del índice: rojo < 45, ámbar 45–50, verde ≥ 50 (tu base).
  const sem = (f.serie || []).filter(s => s.valor != null).slice(-6).map((s, i, a) => ({ lunes: s.semana, y: Number(s.valor), actual: i === a.length - 1 }));
  if (sem.length) {
    c.appendChild(lineaZonas(sem, { corte: 50, colorDe: colorIndice,
      zonas: [{ de: -1e9, a: 45, color: 'rojo' }, { de: 45, a: 50, color: 'ambar' }, { de: 50, a: 1e9, color: 'verde' }] }));
    c.appendChild(etiquetasSemanas(sem));
    c.appendChild(h('div', 'pie', 'Verde ≥ 50, tu base · ámbar 45–50 · rojo < 45'));
  }
  if (pilares.length) {
    const t = h('div', 'teselas t3');
    pilares.forEach(p => {
      const ts = tesela(NOMBRE[p.nombre] || p.nombre, num(p.valor), colorIndice(p.valor));
      if (p.cambio != null && !esCero(p.cambio)) ts.appendChild(h('div', 'sec ' + tono(p.cambio), conSigno(p.cambio)));
      t.appendChild(ts);
    });
    c.appendChild(t);
  }
  v.appendChild(c);

  const marc = [];
  if (f.vo2max) marc.push(dato('VO2max', num(f.vo2max.valor), f.vo2max.rango ? `rango probable ${num(f.vo2max.rango[0])}–${num(f.vo2max.rango[1])}` : ''));
  // Fuerza: el valor es el 1RM estimado en kg y debajo, cuántas veces tu peso; resúmenes anteriores sin kg, el valor relativo.
  (f.fuerza || []).forEach(x => {
    const rel = num(x.valor, 2) + (/peso/.test(x.unidad || '') ? '×' : ' ' + (x.unidad || '')).trimEnd();
    if (x.rm1_kg != null) marc.push(dato(corto(x.nombre) + ' · 1RM est.', num(x.rm1_kg, 0) + ' kg', /peso/.test(x.unidad || '') ? num(x.valor, 2) + '× tu peso' : rel));
    else marc.push(dato(corto(x.nombre), rel));
  });
  if (marc.length) { const m = h('section', 'card'); m.appendChild(cabecera('Marcadores')); const lm = h('div', 'lista'); marc.forEach(x => lm.appendChild(x)); m.appendChild(lm); v.appendChild(m); }

  if ((f.poblacion || []).length) {
    const p = h('section', 'card'); p.appendChild(cabecera('Frente a tu grupo', f.grupo || ''));
    // Todo en escala "mejor que" (% de la población por debajo de ti); la banda clara de la barra es el rango.
    const l = h('div', 'lista');
    f.poblacion.forEach(x => { const m = x.mejor_que ?? x.percentil;
      const fila = dato(corto(x.nombre), m == null ? '·' : 'mejor que ' + pct(Math.round(m)));
      const b = h('div', 'barra'); const s = h('span'); s.style.width = (m == null ? 0 : m) + '%';
      if (x.rango) { const banda = h('i'); banda.style.left = x.rango[0] + '%'; banda.style.width = (x.rango[1] - x.rango[0]) + '%'; b.appendChild(banda); }
      b.appendChild(s);
      const caja = h('div', 'pob'); caja.append(fila, b); l.appendChild(caja); });
    p.appendChild(l); v.appendChild(p);
  }
}
