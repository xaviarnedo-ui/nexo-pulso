import { h } from './util.js';
import { punto, semaforo } from './graficos.js';

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

// Semáforo grande de la pestaña: las luces a la izquierda y una frase en negrita a la derecha.
export function tarjetaSemaforo(color, texto) {
  const c = h('section', 'card semaforo'); c.dataset.color = color;
  c.appendChild(semaforo(color, 92));
  const d = h('div', 'crece'); d.appendChild(h('div', 'semaforo-estado', NOMBRE[color] || NOMBRE.gris)); d.appendChild(h('div', 'semaforo-frase', texto));
  c.appendChild(d); return c;
}
