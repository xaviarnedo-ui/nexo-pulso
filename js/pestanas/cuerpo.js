import { h, num, conSigno, esCero, fechaCorta, pct, sinParentesis } from '../util.js';
import { linea } from '../graficos.js';
import { dato, tarjetaEstado, cabecera, heroe } from '../filas.js';
import { colorRitmoPeso, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Cuerpo'); const c = r.datos.cuerpo;
  const cRitmo = colorRitmoPeso(c.ritmo_kg_sem);   // lo que se registra en Fitia no siempre es fiable: la comida no puntúa
  v.appendChild(h('h1', null, 'Cuerpo'));
  v.appendChild(tarjetaEstado(cRitmo, frase('cuerpo', cRitmo)));

  if (c.peso) {
    // El juicio es la tendencia (fila con punto); el cambio de una semana es solo contexto, en gris.
    const p = h('section', 'card');
    p.appendChild(heroe('Peso · media de la semana', num(c.peso.media), 'kg'));
    if (c.peso.cambio != null) p.lastChild.appendChild(h('div', 'pie', (esCero(c.peso.cambio) ? 'igual que la semana anterior' : conSigno(c.peso.cambio) + ' kg esta semana')));
    p.appendChild(linea((c.peso.serie || []).map(s => ({ y: s.media == null ? null : Number(s.media) })), { meta: c.meta }));
    if (c.meta) p.appendChild(h('div', 'pie', 'Meta ' + num(c.meta) + ' kg' + (c.fecha_estimada ? ' · ~' + fechaCorta(c.fecha_estimada) : '')));
    const l = h('div', 'lista');
    if (c.ritmo_kg_sem != null) l.appendChild(dato('Tendencia', conSigno(c.ritmo_kg_sem, 2) + ' kg/sem', 'meta −0,3 a −0,6', cRitmo));
    if (c.grasa_pct && c.grasa_pct.media != null) l.appendChild(dato('% grasa', pct(c.grasa_pct.media, 1), c.grasa_pct.cambio == null || esCero(c.grasa_pct.cambio) ? '' : conSigno(c.grasa_pct.cambio) + ' esta semana', 'gris'));
    if (l.children.length) p.appendChild(l);
    v.appendChild(p);
  }

  if (c.nutricion) {
    // Lo que deberías comer según tu plan (no lo registrado en Fitia): sin puntos, no es un juicio.
    const nu = c.nutricion, dias = nu.objetivo || [];
    const kcal = nu.kcal_semana != null ? nu.kcal_semana : (() => { const k = dias.map(x => x.kcal).filter(Number.isFinite); return k.length ? Math.round(k.reduce((s, x) => s + x, 0) / k.length) : null; })();
    const n = h('section', 'card'); n.appendChild(cabecera('Comida · plan'));
    const l = h('div', 'lista');
    l.appendChild(dato('Kcal media prevista', kcal == null ? '·' : num(kcal, 0) + ' kcal/día'));
    l.appendChild(dato('Proteína', nu.proteina_g == null ? '·' : num(nu.proteina_g, 0) + ' g/día'));
    n.appendChild(l);
    if (dias.length) {
      const d = h('details', 'plan'); d.appendChild(h('summary', null, 'Según la carga del día'));
      const ld = h('div', 'lista');
      dias.forEach(x => ld.appendChild(dato(sinParentesis(x.tipo), x.kcal == null ? '·' : num(x.kcal, 0) + ' kcal',
        `P ${num(x.proteina_g, 0)} · H ${num(x.hidratos_g, 0)} · G ${num(x.grasa_g, 0)} g`)));
      d.appendChild(ld); n.appendChild(d);
    }
    v.appendChild(n);
  }

  const a = estado.ayunos.filter(x => x.horas != null && Number.isFinite(Number(x.horas))).slice(0, 7);
  if (a.length) {
    const y = h('section', 'card'); y.appendChild(cabecera('Ayuno')); const l = h('div', 'lista');
    l.appendChild(dato('Media ' + a.length + ' últimos', num(a.reduce((s, x) => s + Number(x.horas), 0) / a.length) + ' h'));
    l.appendChild(dato('Más largo', num(Math.max(...a.map(x => Number(x.horas)))) + ' h'));
    y.appendChild(l); v.appendChild(y);
  }
}
