import { h } from './util.js';
import { punto, insignia } from './graficos.js';

const NOMBRE = { verde: 'Verde', ambar: 'Ámbar', rojo: 'Rojo', gris: 'Sin datos' };

// Fila de indicador: punto de estado, etiqueta a la izquierda, valor a la derecha en mono. Sin color, no lleva punto.
export function dato(etq, valor, extra, color, cls) {
  const e = h('div', 'entre fila-ind');
  if (color) e.appendChild(punto(color));
  e.appendChild(h('span', 'etq', etq));
  const s = h('span', 'cifra' + (cls ? ' ' + cls : ''), valor);
  if (extra) s.appendChild(h('span', 'pie', ' ' + extra));
  e.appendChild(s); return e;
}

// Tarjeta de estado de la pestaña: insignia de color a la izquierda; palabra del estado y frase en negrita a la derecha.
export function tarjetaEstado(color, texto) {
  const c = h('section', 'card estado-card'); c.dataset.color = NOMBRE[color] ? color : 'gris';
  c.appendChild(insignia(color, 44));
  const d = h('div', 'crece'); d.appendChild(h('div', 'estado-nombre', NOMBRE[color] || NOMBRE.gris)); d.appendChild(h('div', 'estado-frase', texto));
  c.appendChild(d); return c;
}
