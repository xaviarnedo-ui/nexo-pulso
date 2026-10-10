import { h, limpia } from './util.js';
import { punto, insignia } from './graficos.js';

const NOMBRE = { verde: 'Verde', ambar: 'Ámbar', rojo: 'Rojo', gris: 'Sin datos' };

// Fila de indicador en una línea: punto de estado · etiqueta corta · valor a la derecha.
// sec (opcional): segunda línea pequeña bajo el valor, sin paréntesis. color: 'verde' | 'ambar' | 'rojo' | 'gris' (hueco
// vacío, alinea con las filas que sí llevan punto) o nada (sin hueco: tarjetas que son todo datos).
export function dato(etq, valor, sec, color, cls) {
  const e = h('div', 'entre fila-ind');
  if (color) e.appendChild(punto(color));
  e.appendChild(h('span', 'etq', etq));
  const d = h('span', 'val');
  d.appendChild(h('span', 'cifra' + (cls ? ' ' + cls : ''), valor));
  if (sec) d.appendChild(h('span', 'sec', sec));
  e.appendChild(d); return e;
}

// Cabecera de tarjeta: título (estilo etiqueta) y, a la derecha, un dato de contexto pequeño.
export function cabecera(titulo, sub) {
  const e = h('div', 'cabecera'); e.appendChild(h('h2', null, titulo));
  if (sub) e.appendChild(h('span', 'pie', sub));
  return e;
}

// Cifra protagonista de una tarjeta: etiqueta (con punto si se juzga), número grande y unidad pequeña; extra al lado del número.
export function heroe(etq, valor, unidad, { color, extra } = {}) {
  const c = h('div', 'heroe');
  const l = h('div', 'lbl'); if (color) l.appendChild(punto(color)); l.appendChild(h('span', null, etq)); c.appendChild(l);
  const n = h('div', 'heroe-cifra'); n.appendChild(h('span', 'cifra grande', valor));
  if (unidad) n.appendChild(h('span', 'unidad', unidad));
  if (extra) n.appendChild(extra);
  c.appendChild(n); return c;
}

// Pastilla de cambio (+0,5): verde si mejora, roja si empeora, neutra si no se juzga.
export function cambio(texto, tono) { return h('span', 'cambio' + (tono ? ' ' + tono : ''), texto); }

// Tesela: etiqueta pequeña arriba; debajo, el valor mediano con su punto si se juzga. Para rejillas de 2 o 3.
export function tesela(etq, valor, color) {
  const t = h('div', 'tesela'); t.appendChild(h('div', 'lbl', etq));
  const n = h('div', 'tesela-valor'); if (color && color !== 'gris') n.appendChild(punto(color)); n.appendChild(h('span', 'cifra media', valor));
  t.appendChild(n); return t;
}

// Estado de la pestaña: insignia de color, palabra del estado y frase. Sin datos (gris): solo una línea discreta.
export function tarjetaEstado(color, texto) {
  const frase = limpia(texto);
  if (!NOMBRE[color] || color === 'gris') { const l = h('div', 'estado-linea'); l.append(insignia('gris', 18), h('span', null, frase)); return l; }
  const c = h('section', 'card estado-card'); c.dataset.color = color;
  c.appendChild(insignia(color, 36));
  const d = h('div', 'crece'); d.appendChild(h('div', 'estado-nombre', NOMBRE[color])); d.appendChild(h('div', 'estado-frase', frase));
  c.appendChild(d); return c;
}
