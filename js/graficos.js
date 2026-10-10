import { h, diasAtras, fechaCierre } from './util.js';
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function lienzo(w, hh) { return el('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'grafico', role: 'img' }); }
const fin = x => typeof x === 'number' && Number.isFinite(x);
function escala(vals, pad = 0.08) { const v = vals.filter(fin); if (!v.length) return [0, 1]; const lo = Math.min(...v), hi = Math.max(...v); const m = (hi - lo || 1) * pad; return [lo - m, hi + m]; }

export function anillo(frac, color, texto, tam = 96) {
  const r = tam / 2 - 8, c = 2 * Math.PI * r, s = el('svg', { viewBox: `0 0 ${tam} ${tam}`, width: tam, height: tam, 'aria-hidden': 'true' });
  el('circle', { cx: tam / 2, cy: tam / 2, r, fill: 'none', stroke: 'var(--line)', 'stroke-width': 8 }, s);
  el('circle', { cx: tam / 2, cy: tam / 2, r, fill: 'none', stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round',
    'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - Math.max(0, Math.min(1, frac))), transform: `rotate(-90 ${tam / 2} ${tam / 2})` }, s);
  const t = el('text', { x: tam / 2, y: tam / 2 + 5, 'text-anchor': 'middle', style: 'font-family:var(--mono);font-size:15px;fill:var(--ink)' }, s);
  t.textContent = texto; return s;
}

export function lineaFranja(serie, { w = 320, h: hh = 96 } = {}) {
  const s = lienzo(w, hh); if (!serie.length) return s;
  const ptsLinea = serie.map((p, i) => ({ p, i })).filter(({ p }) => fin(p.y));
  const ptsBanda = serie.map((p, i) => ({ p, i })).filter(({ p }) => fin(p.lo) && fin(p.hi));
  const [lo, hi] = escala(serie.flatMap(p => [p.y, p.lo, p.hi])); const X = i => i / Math.max(1, serie.length - 1) * w, Y = v => hh - (v - lo) / (hi - lo) * hh;
  if (ptsBanda.length) { const banda = ptsBanda.map(({ p, i }) => `${X(i)},${Y(p.hi)}`).concat([...ptsBanda].reverse().map(({ p, i }) => `${X(i)},${Y(p.lo)}`)); el('polygon', { points: banda.join(' '), fill: 'var(--accent-soft)' }, s); }
  if (ptsLinea.length) el('polyline', { points: ptsLinea.map(({ p, i }) => `${X(i)},${Y(p.y)}`).join(' '), fill: 'none', stroke: 'var(--warm)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s);
  return s;
}

export function linea(serie, { meta = null, w = 320, h: hh = 96 } = {}) {
  const s = lienzo(w, hh); if (!serie.length) return s;
  const pts = serie.map((p, i) => ({ p, i })).filter(({ p }) => fin(p.y)); if (!pts.length) return s;
  const tieneMeta = fin(meta);
  const [lo, hi] = escala(pts.map(({ p }) => p.y).concat(tieneMeta ? [meta] : [])); const X = i => i / Math.max(1, serie.length - 1) * w, Y = v => hh - (v - lo) / (hi - lo) * hh;
  if (tieneMeta) { el('line', { x1: 0, x2: w, y1: Y(meta), y2: Y(meta), stroke: 'var(--muted)', 'stroke-dasharray': '4 4' }, s); const t = el('text', { x: w, y: Y(meta) - 4, 'text-anchor': 'end' }, s); t.textContent = 'meta ' + String(meta).replace('.', ','); }
  el('polyline', { points: pts.map(({ p, i }) => `${X(i)},${Y(p.y)}`).join(' '), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s);
  const u = pts[pts.length - 1]; el('circle', { cx: X(u.i), cy: Y(u.p.y), r: 3.5, fill: 'var(--accent)' }, s);
  return s;
}

export function barras(items, { w = 320, h: hh = 96 } = {}) {
  const s = lienzo(w, hh); if (!items.length) return s;
  const max = Math.max(1, ...items.map(i => Math.max(i.v || 0, i.hi || 0))) * 1.1, bw = w / items.length;
  items.forEach((it, i) => {
    const x = i * bw + bw * 0.18, ancho = bw * 0.64, Y = v => hh - v / max * hh;
    if (it.lo != null && it.hi != null) el('rect', { x: i * bw + 2, width: bw - 4, y: Y(it.hi), height: Math.max(1, Y(it.lo) - Y(it.hi)), fill: 'var(--accent-soft)' }, s);
    if (it.futura) el('rect', { x, width: ancho, y: Y(it.hi || 0), height: hh - Y(it.hi || 0), fill: 'none', stroke: 'var(--line)', 'stroke-dasharray': '3 3', rx: 3 }, s);
    else el('rect', { x, width: ancho, y: Y(it.v || 0), height: hh - Y(it.v || 0), rx: 3, fill: it.actual ? 'var(--warm)' : 'var(--accent)' }, s);
  });
  return s;
}

export function racha(hechas, dias = 14) {
  const r = h('div', 'racha'); const hoy = fechaCierre();
  for (let i = dias - 1; i >= 0; i--) { const f = diasAtras(i); const c = h('span', (hechas.has(f) ? 'si' : '') + (f === hoy ? ' hoy' : '')); c.title = f; r.appendChild(c); }
  return r;
}
