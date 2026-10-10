import { h, num, conSigno, esCero, limpia } from '../util.js';
import { linea } from '../graficos.js';
import { dato, tarjetaEstado, cabecera, heroe, cambio, tesela } from '../filas.js';
import { colorIndice, peor, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

const NOMBRE = { aerobico: 'Aeróbico', fuerza: 'Fuerza', composicion: 'Composición' };
// Nombre corto de un marcador: sin paréntesis y solo la parte antes de " · " ("Press banca · 1RM est. / peso" → "Press banca").
const CORTO = { '% de grasa corporal': '% grasa' };
const corto = s => { const t = limpia(s).split(' · ')[0]; return CORTO[t] || t; };
const tono = x => x > 0 ? 'sube' : x < 0 ? 'baja' : '';

export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Forma'); const f = r.datos.forma;
  const pilares = f.pilares || [];
  v.appendChild(h('h1', null, 'Forma'));
  const global = peor([colorIndice(f.indice), ...pilares.map(p => colorIndice(p.valor))]);
  v.appendChild(tarjetaEstado(global, frase('forma', global)));

  const c = h('section', 'card');
  const pill = f.cambio == null || esCero(f.cambio) ? null : cambio(conSigno(f.cambio), tono(f.cambio));
  if (pill) pill.title = 'frente a la semana anterior';
  c.appendChild(heroe('Índice de forma', num(f.indice), null, { extra: pill }));
  c.appendChild(linea((f.serie || []).filter(s => s.valor != null).map(s => ({ y: Number(s.valor) })), { meta: 50, etiqueta: 'base 50' }));
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
  if (f.vo2max) marc.push(dato('VO2max', num(f.vo2max.valor), f.vo2max.rango ? `rango ${num(f.vo2max.rango[0])}–${num(f.vo2max.rango[1])}` : ''));
  (f.fuerza || []).forEach(x => marc.push(dato(corto(x.nombre), num(x.valor, 2) + (/peso/.test(x.unidad || '') ? '×' : ' ' + (x.unidad || '')).trimEnd())));
  if (marc.length) { const m = h('section', 'card'); m.appendChild(cabecera('Marcadores')); const lm = h('div', 'lista'); marc.forEach(x => lm.appendChild(x)); m.appendChild(lm); v.appendChild(m); }

  if ((f.poblacion || []).length) {
    const p = h('section', 'card'); p.appendChild(cabecera('Frente a tu grupo', f.grupo || ''));
    // Todo en escala "mejor que" (% de la población por debajo de ti); la banda clara de la barra es el rango.
    const l = h('div', 'lista');
    f.poblacion.forEach(x => { const m = x.mejor_que ?? x.percentil;
      const fila = dato(corto(x.nombre), m == null ? '·' : 'mejor que ' + Math.round(m) + ' %');
      const b = h('div', 'barra'); const s = h('span'); s.style.width = (m == null ? 0 : m) + '%';
      if (x.rango) { const banda = h('i'); banda.style.left = x.rango[0] + '%'; banda.style.width = (x.rango[1] - x.rango[0]) + '%'; b.appendChild(banda); }
      b.appendChild(s);
      const caja = h('div', 'pob'); caja.append(fila, b); l.appendChild(caja); });
    p.appendChild(l); v.appendChild(p);
  }
}
