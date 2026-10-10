import { h, num } from '../util.js';
import { linea } from '../graficos.js';
import { dato, tarjetaEstado } from '../filas.js';
import { colorIndice, peor, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }
const signo = x => x == null ? '' : (x > 0 ? '+' : '') + num(x);

const NOMBRE = { aerobico: 'Aeróbico', fuerza: 'Fuerza', composicion: 'Composición' };
export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Forma'); const f = r.datos.forma;
  const pilares = f.pilares || [];
  v.appendChild(h('h1', null, 'Forma'));
  const global = peor([colorIndice(f.indice), ...pilares.map(p => colorIndice(p.valor))]);
  v.appendChild(tarjetaEstado(global, frase('forma', global)));
  const c = h('section', 'card'); const top = h('div', 'entre');
  const izq = h('div'); izq.appendChild(h('div', 'lbl', 'Índice de forma')); izq.appendChild(h('div', 'cifra grande', num(f.indice)));
  const der = h('div'); der.style.textAlign = 'right'; der.appendChild(h('div', 'cifra media ' + (f.cambio > 0 ? 'sube' : f.cambio < 0 ? 'baja' : ''), signo(f.cambio))); der.appendChild(h('div', 'pie', 'frente a la semana anterior'));
  top.append(izq, der); c.appendChild(top);
  c.appendChild(linea((f.serie || []).filter(s => s.valor != null).map(s => ({ y: Number(s.valor) })), { meta: 50 }));
  const l = h('div', 'lista'); pilares.forEach(p => l.appendChild(dato(NOMBRE[p.nombre] || p.nombre, num(p.valor), signo(p.cambio), colorIndice(p.valor)))); c.appendChild(l); v.appendChild(c);
  const m = h('section', 'card'); m.appendChild(h('h2', null, 'Marcadores')); const lm = h('div', 'lista');
  if (f.vo2max) lm.appendChild(dato('VO2max', num(f.vo2max.valor), `(${num(f.vo2max.rango[0])}–${num(f.vo2max.rango[1])})`, 'gris'));
  (f.fuerza || []).forEach(x => lm.appendChild(dato(x.nombre, num(x.valor, 2), x.unidad, 'gris'))); m.appendChild(lm); v.appendChild(m);
  if ((f.poblacion || []).length) {
    const p = h('section', 'card'); p.appendChild(h('h2', null, 'Frente a ' + (f.grupo || 'tu grupo de edad')));
    // Todo en escala "mejor que" (% de la población por debajo de ti); el rango ya viene en esa escala.
    f.poblacion.forEach(x => { const m = x.mejor_que ?? x.percentil;
      p.appendChild(dato(x.nombre, m == null ? '·' : 'mejor que ' + Math.round(m) + ' %', x.rango ? `(${Math.round(x.rango[0])}–${Math.round(x.rango[1])} %)` : '', 'gris'));
      const b = h('div', 'barra'); const s = h('span'); s.style.width = (m == null ? 0 : m) + '%';
      if (x.rango) { const banda = h('i'); banda.style.left = x.rango[0] + '%'; banda.style.width = (x.rango[1] - x.rango[0]) + '%'; b.appendChild(banda); }
      b.appendChild(s); p.appendChild(b); });
    v.appendChild(p);
  }
}
