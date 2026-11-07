const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const fin = x => typeof x === 'number' && Number.isFinite(x);

export function anillo(frac, color, texto, tam = 96) {
  const r = tam / 2 - 8, c = 2 * Math.PI * r, s = el('svg', { viewBox: `0 0 ${tam} ${tam}`, width: tam, height: tam, 'aria-hidden': 'true' });
  el('circle', { cx: tam / 2, cy: tam / 2, r, fill: 'none', stroke: 'var(--line)', 'stroke-width': 8 }, s);
  el('circle', { cx: tam / 2, cy: tam / 2, r, fill: 'none', stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round',
    'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - Math.max(0, Math.min(1, frac))), transform: `rotate(-90 ${tam / 2} ${tam / 2})` }, s);
  const t = el('text', { x: tam / 2, y: tam / 2 + 5, 'text-anchor': 'middle', style: 'font-family:var(--sans);font-variant-numeric:tabular-nums lining-nums;font-size:15px;fill:var(--ink)' }, s);
  t.textContent = texto; return s;
}

// Línea de una serie [{ y }] con la última marca; meta = línea discontinua opcional.
export function linea(serie, { meta = null, w = 320, h: hh = 96 } = {}) {
  const s = el('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'grafico', role: 'img' });
  const pts = serie.map((p, i) => ({ p, i })).filter(({ p }) => fin(p.y)); if (pts.length < 2) return s;
  const ys = pts.map(({ p }) => p.y).concat(fin(meta) ? [meta] : []);
  const lo = Math.min(...ys), hi = Math.max(...ys), m = (hi - lo || 1) * 0.12;
  const X = i => i / Math.max(1, serie.length - 1) * w, Y = v => hh - (v - (lo - m)) / ((hi + m) - (lo - m)) * hh;
  if (fin(meta)) el('line', { x1: 0, x2: w, y1: Y(meta), y2: Y(meta), stroke: 'var(--muted)', 'stroke-dasharray': '4 4' }, s);
  el('polyline', { points: pts.map(({ p, i }) => `${X(i)},${Y(p.y)}`).join(' '), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s);
  const u = pts[pts.length - 1]; el('circle', { cx: X(u.i), cy: Y(u.p.y), r: 3.5, fill: 'var(--accent)' }, s);
  return s;
}
