import { h, num, fmtFecha, fechaCorta, limpia, pct, diasHasta, cuantoFalta } from '../util.js';
import { barras } from '../graficos.js';
import { dato, nota, tarjetaEstado, cabecera, heroe } from '../filas.js';
import { colorRango, colorFacil, colorVolumen, colorSemana, kmSemanaAnterior, peor, frase } from '../semaforos.js';
function sinResumen(v, titulo) { v.appendChild(h('h1', null, titulo)); v.appendChild(h('section', 'card', 'Aún no hay resumen: llega el martes, cuando se actualizan tus datos.')); }

// Avisos que ya se ven como punto en la fila correspondiente; solo se escriben los que no tienen fila.
const AV_CON_FILA = new Set(['running', 'crossfit', 'volumen', 'intensidad']);
const ent = x => x == null ? '·' : String(x);
const BARRA = { verde: 'verde', ambar: 'ambar', gris: 'gris' };
// "< 1:32:00" → "< 1:32"; "1:30:00" → "1:30" (con horas, los :00 finales no dicen nada).
const tiempo = s => String(s || '').replace(/^(.*\d+:\d{2}):00$/, '$1');
// Etiquetas cortas de los ritmos del resumen; lo desconocido, sin paréntesis.
const RITMO = { 'Rodaje fácil y tirada larga': 'Fácil y tirada', 'Umbral (tempo)': 'Umbral', 'Ritmo de media': 'Media' };
// Rango previsto: "2–3", o "3" si los dos extremos coinciden.
const rango = x => x[0] === x[1] ? String(x[0]) : `${x[0]}–${x[1]}`;
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Fechas bajo las barras: el día del lunes y, en la primera semana de cada mes, el mes debajo.
function etiquetasSemanas(sem) {
  const g = h('div', 'semanas-etq'); g.style.gridTemplateColumns = `repeat(${sem.length}, 1fr)`; g.setAttribute('aria-hidden', 'true');
  let mesPrevio = null;
  sem.forEach(s => {
    const d = new Date(s.lunes + 'T12:00'), m = d.getMonth();
    const c = h('span', s.actual ? 'actual' : null, String(d.getDate()));
    c.appendChild(h('span', 'mes', m !== mesPrevio ? MES[m] : ' ')); mesPrevio = m;
    g.appendChild(c);
  });
  return g;
}

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
  // Antes de que empiece el plan no hay semana que juzgar: sin tarjeta de estado.
  if (act) { const global = peor([...Object.values(colores), colorSemana(act)]); v.appendChild(tarjetaEstado(global, frase('carrera', global))); }

  const top = h('section', 'card');
  const dias = Math.max(0, diasHasta(c.fecha));
  const hz = heroe(c.carrera, String(dias), dias === 1 ? 'día' : 'días');
  hz.appendChild(h('div', 'pie', fmtFecha(c.fecha).replace('.', '')));
  top.appendChild(hz);
  if ((c.objetivos || []).length) {
    const l = h('div', 'lista');
    c.objetivos.forEach(x => l.appendChild(dato(x.nivel, [tiempo(x.tiempo), x.ritmo].filter(Boolean).join(' · '))));
    top.appendChild(l);
  }
  v.appendChild(top);

  // Otras carreras antes del objetivo (plan, no juicio: sin punto). Los días se cuentan en el móvil, no al subir el resumen.
  const otras = (c.otras_carreras || []).map(o => ({ ...o, faltan: diasHasta(o.fecha) })).filter(o => o.faltan >= 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (otras.length) {
    const pc = h('section', 'card'); pc.appendChild(cabecera('Próximas carreras'));
    const l = h('div', 'lista');
    otras.forEach(o => {
      l.appendChild(dato(o.corto || limpia(o.nombre), fechaCorta(o.fecha) + ' · ' + cuantoFalta(o.faltan)));
      if (o.detalle) l.appendChild(nota(limpia(o.detalle)));
    });
    pc.appendChild(l); v.appendChild(pc);
  }

  if (sem.length) {
    const g = h('section', 'card'); g.appendChild(cabecera('Plan semanal', 'carreras por semana'));
    g.appendChild(barras(sem.map(s => ({ v: s.running, color: BARRA[colorSemana(s)], futura: s.futura, actual: s.actual,
      ghost: s.objetivo && s.objetivo.running[1], arriba: !s.futura && s.km > 0 ? num(s.km, 0) : null }))));
    g.appendChild(etiquetasSemanas(sem));
    const pie = !act ? 'Empieza el ' + fechaCorta(sem[0].lunes) + '. Las barras claras son lo previsto.' : 'Encima de cada barra, los km.';
    g.appendChild(h('div', 'pie', pie));
    v.appendChild(g);
  }

  if (act) {
    const k = h('section', 'card'); k.appendChild(cabecera(act.actual ? 'Esta semana' : 'Última semana', act.fase || ''));
    const l = h('div', 'lista'); l.appendChild(dato('Carreras', ent(act.running), act.objetivo ? 'previstas ' + rango(act.objetivo.running) : '', colores.running));
    const dif = prev > 0 && act.km != null ? Math.round((act.km / prev - 1) * 100) : null;
    l.appendChild(dato('Km', num(act.km, 0), dif == null ? '' : (dif > 0 ? '+' : dif < 0 ? '−' : '') + Math.abs(dif) + ' % frente a la anterior', colores.volumen));
    if (act.tirada_km) l.appendChild(dato('Tirada larga', num(act.tirada_km) + ' km', '', 'gris'));
    l.appendChild(dato('CrossFit', ent(act.crossfit), act.objetivo ? 'previstos ' + rango(act.objetivo.crossfit) : '', colores.crossfit));
    if (act.facil_pct != null) l.appendChild(dato('% fácil', pct(act.facil_pct), '', colores.facil));
    k.appendChild(l); (act.avisos || []).filter(a => !AV_CON_FILA.has(a)).forEach(a => k.appendChild(h('div', 'estado-pill ambar', limpia(a)))); v.appendChild(k);
  }

  if ((c.ritmos || []).length) {
    const rr = h('section', 'card'); rr.appendChild(cabecera('Ritmos'));
    const l = h('div', 'lista'); c.ritmos.forEach(x => l.appendChild(dato(RITMO[x.tipo] || limpia(x.tipo), limpia(x.valor).replace(/\s*\/km$/, ' /km'))));
    rr.appendChild(l); v.appendChild(rr);
  }
}
