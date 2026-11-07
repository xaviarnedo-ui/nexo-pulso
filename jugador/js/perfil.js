import { h, num, edad, fechaCorta } from './util.js';
import { linea } from './graficos.js';
import { tendencia } from './hoy.js';

export function pintar(v, estado, { editarFormulario }) {
  const p = estado.perfil;
  v.appendChild(h('h1', null, 'Tú'));
  const c = h('section', 'card'); const cab = h('div', 'cabecera'); cab.appendChild(h('h2', null, 'Tu perfil')); c.appendChild(cab);
  const fila = (a, b) => { const e = h('div', 'entre fila-ind'); e.appendChild(h('span', 'etq', a)); e.appendChild(h('span', 'cifra', b)); return e; };
  const l = h('div', 'lista');
  l.appendChild(fila('Posición', p.posicion || '—'));
  if (p.altura_cm) l.appendChild(fila('Altura', num(p.altura_cm, 0) + ' cm'));
  if (p.peso_kg) l.appendChild(fila('Peso en la última antropometría', num(p.peso_kg) + ' kg'));
  l.appendChild(fila('Objetivo de ayuno', (p.ayuno_horas || 12) + ' h'));
  c.appendChild(l); v.appendChild(c);

  const t = tendencia(estado.pesos);
  const pw = h('section', 'card'); const cab2 = h('div', 'cabecera'); cab2.appendChild(h('h2', null, 'Evolución del peso')); pw.appendChild(cab2);
  if (estado.pesos.length >= 2) {
    const serie = estado.pesos.map(x => ({ y: Number(x.kg) })); pw.appendChild(linea(serie));
    pw.appendChild(h('div', 'lbl', 'Del ' + fechaCorta(estado.pesos[0].fecha) + ' al ' + fechaCorta(estado.pesos[estado.pesos.length - 1].fecha) + ' · media de la última semana ' + num(t.actual) + ' kg'));
  } else pw.appendChild(h('div', 'lbl', 'Apunta tu peso unos días y aquí verás la evolución.'));
  v.appendChild(pw);

  const f = h('section', 'card'); f.appendChild(h('div', 'destacado', 'Tu formulario'));
  f.appendChild(h('div', 'lbl', 'Enviado el ' + new Date(estado.formulario.enviado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) + '. Si algo cambia (una alergia, algo que ya no te gusta), corrígelo y avisa al entrenador.'));
  const b = h('button', 'btn', 'Editar mis respuestas'); b.onclick = editarFormulario; f.appendChild(b); v.appendChild(f);
}
