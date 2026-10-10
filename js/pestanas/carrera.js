import { h, num, fmtFecha, isoDia } from '../util.js';
import { barras } from '../graficos.js';
import { dato, tarjetaSemaforo } from '../filas.js';
import { colorRango, colorFacil, colorVolumen, colorSemana, kmSemanaAnterior, peor, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

// Avisos que ya se ven como punto en la fila correspondiente; solo se escriben los que no tienen fila.
const AV_CON_FILA = new Set(['running', 'crossfit', 'volumen', 'intensidad']);
const ent = x => x == null ? '·' : String(x);
const BARRA = { verde: 'verde', ambar: 'ambar', gris: 'gris' };
export function pintar(v, estado) {
  const r = estado.resumen; if (!r) return sinResumen(v, 'Carrera');
  if (!r.datos.carrera) { v.appendChild(h('h1', null, 'Carrera')); v.appendChild(h('section', 'card', 'Sin objetivo de carrera en el resumen.')); return; }
  const c = r.datos.carrera;
  const sem = c.semanas || [];
  const act = sem.find(s => s.actual) || [...sem].reverse().find(s => !s.futura);
  const prev = act ? kmSemanaAnterior(sem, act) : null;
  const colores = act ? {
    running: colorRango(act.running, act.objetivo && act.objetivo.running, act.actual), crossfit: colorRango(act.crossfit, act.objetivo && act.objetivo.crossfit, act.actual),
    facil: colorFacil(act.facil_pct), volumen: colorVolumen(act.km, prev) } : {};
  v.appendChild(h('h1', null, 'Carrera'));
  const global = act ? peor([...Object.values(colores), colorSemana(act)]) : 'gris';
  v.appendChild(tarjetaSemaforo(global, frase('carrera', global)));
  const top = h('section', 'card'); const e = h('div', 'entre');
  const i = h('div'); i.appendChild(h('div', 'lbl', c.carrera));
  // Días de calendario (medianoche local a mediodía local): con UTC la cuenta se queda corta de noche.
  const dias = Math.round((new Date(c.fecha + 'T12:00') - new Date(isoDia(new Date()) + 'T12:00')) / 864e5);
  i.appendChild(h('div', 'cifra grande', String(Math.max(0, dias))));
  i.appendChild(h('div', 'pie', 'días · ' + fmtFecha(c.fecha)));
  const o = h('div'); o.style.textAlign = 'right'; (c.objetivos || []).forEach(x => { o.appendChild(h('div', 'cifra media', x.tiempo)); o.appendChild(h('div', 'pie', x.nivel + ' · ' + x.ritmo)); });
  e.append(i, o); top.appendChild(e); v.appendChild(top);
  const g = h('section', 'card'); g.appendChild(h('h2', null, 'Semanas frente al plan'));
  g.appendChild(barras(sem.map(s => ({ v: s.running, color: BARRA[colorSemana(s)], futura: s.futura, actual: s.actual, ghost: s.objetivo && s.objetivo.running[1] })))); v.appendChild(g);
  if (act) {
    const k = h('section', 'card'); k.appendChild(h('h2', null, (act.actual ? 'Esta semana' : 'Última semana') + (act.fase ? ' · ' + act.fase : '')));
    const l = h('div', 'lista'); l.appendChild(dato('Carreras', ent(act.running), act.objetivo ? `previstas ${act.objetivo.running[0]}–${act.objetivo.running[1]}` : '', colores.running));
    const dif = prev > 0 && act.km != null ? Math.round((act.km / prev - 1) * 100) : null;
    l.appendChild(dato('Km', num(act.km, 0), dif == null ? '' : (dif > 0 ? '+' : '') + dif + ' % frente a la anterior', colores.volumen)); if (act.tirada_km) l.appendChild(dato('Tirada larga', num(act.tirada_km) + ' km', '', 'gris'));
    l.appendChild(dato('CrossFit', ent(act.crossfit), act.objetivo ? `previstos ${act.objetivo.crossfit[0]}–${act.objetivo.crossfit[1]}` : '', colores.crossfit));
    if (act.facil_pct != null) l.appendChild(dato('% fácil', act.facil_pct + ' %', '', colores.facil));
    k.appendChild(l); (act.avisos || []).filter(a => !AV_CON_FILA.has(a)).forEach(a => k.appendChild(h('div', 'estado-pill ambar', a))); v.appendChild(k);
  }
  if ((c.ritmos || []).length) { const rr = h('section', 'card'); rr.appendChild(h('h2', null, 'Ritmos de referencia')); const l = h('div', 'lista'); c.ritmos.forEach(x => l.appendChild(dato(x.tipo, x.valor))); rr.appendChild(l); v.appendChild(rr); }
}
