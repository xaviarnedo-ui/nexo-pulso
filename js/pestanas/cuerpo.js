import { h, num, conSigno, esCero, fechaCorta } from '../util.js';
import { linea } from '../graficos.js';
import { dato, tarjetaEstado, cabecera, heroe } from '../filas.js';
import { colorRitmoPeso, colorProteina, peor, fraseCuerpo } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Cuerpo'); const c = r.datos.cuerpo;
  const cRitmo = colorRitmoPeso(c.ritmo_kg_sem), cProt = colorProteina(c.nutricion && c.nutricion.proteina_g);
  const global = peor([cRitmo, cProt]);
  v.appendChild(h('h1', null, 'Cuerpo'));
  v.appendChild(tarjetaEstado(global, fraseCuerpo(global, cRitmo)));

  if (c.peso) {
    // El juicio es la tendencia (fila con punto); el cambio de una semana es solo contexto, en gris.
    const p = h('section', 'card');
    p.appendChild(heroe('Peso · media de la semana', num(c.peso.media), 'kg'));
    if (c.peso.cambio != null) p.lastChild.appendChild(h('div', 'pie', (esCero(c.peso.cambio) ? 'igual que la semana anterior' : conSigno(c.peso.cambio) + ' kg esta semana')));
    p.appendChild(linea((c.peso.serie || []).map(s => ({ y: s.media == null ? null : Number(s.media) })), { meta: c.meta }));
    if (c.meta) p.appendChild(h('div', 'pie', 'Meta ' + num(c.meta) + ' kg' + (c.fecha_estimada ? ' · ~' + fechaCorta(c.fecha_estimada) : '')));
    const l = h('div', 'lista');
    if (c.ritmo_kg_sem != null) l.appendChild(dato('Tendencia', conSigno(c.ritmo_kg_sem, 2) + ' kg/sem', 'meta −0,3 a −0,6', cRitmo));
    if (c.grasa_pct && c.grasa_pct.media != null) l.appendChild(dato('% grasa', num(c.grasa_pct.media) + ' %', c.grasa_pct.cambio == null || esCero(c.grasa_pct.cambio) ? '' : conSigno(c.grasa_pct.cambio) + ' esta semana', 'gris'));
    if (l.children.length) p.appendChild(l);
    v.appendChild(p);
  }

  if (c.nutricion) {
    const dc = c.nutricion.dias_completos;
    const n = h('section', 'card'); n.appendChild(cabecera('Comida', dc == null ? '' : num(dc, 0) + ' días completos'));
    const l = h('div', 'lista');
    l.appendChild(dato('Kcal medias', num(c.nutricion.kcal, 0), '', 'gris'));
    l.appendChild(dato('Proteína', c.nutricion.proteina_g == null ? '·' : num(c.nutricion.proteina_g, 0) + ' g', 'meta 140', cProt));
    n.appendChild(l); v.appendChild(n);
  }

  const a = estado.ayunos.filter(x => x.horas != null && Number.isFinite(Number(x.horas))).slice(0, 7);
  if (a.length) {
    const y = h('section', 'card'); y.appendChild(cabecera('Ayuno')); const l = h('div', 'lista');
    l.appendChild(dato('Media ' + a.length + ' últimos', num(a.reduce((s, x) => s + Number(x.horas), 0) / a.length) + ' h'));
    l.appendChild(dato('Más largo', num(Math.max(...a.map(x => Number(x.horas)))) + ' h'));
    y.appendChild(l); v.appendChild(y);
  }
}
