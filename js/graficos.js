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

// meta: línea discontinua de referencia; etiqueta (opcional) se escribe al principio, encima de ella.
export function linea(serie, { meta = null, etiqueta = null, w = 320, h: hh = 96 } = {}) {
  const s = lienzo(w, hh); if (!serie.length) return s;
  const pts = serie.map((p, i) => ({ p, i })).filter(({ p }) => fin(p.y)); if (!pts.length) return s;
  const tieneMeta = fin(meta);
  const [lo, hi] = escala(pts.map(({ p }) => p.y).concat(tieneMeta ? [meta] : [])); const X = i => i / Math.max(1, serie.length - 1) * w, Y = v => hh - (v - lo) / (hi - lo) * hh;
  if (tieneMeta) { el('line', { x1: 0, x2: w, y1: Y(meta), y2: Y(meta), stroke: 'var(--muted)', 'stroke-dasharray': '4 4' }, s); if (etiqueta) { const t = el('text', { x: 0, y: Y(meta) - 5, 'text-anchor': 'start' }, s); t.textContent = etiqueta; } }
  el('polyline', { points: pts.map(({ p, i }) => `${X(i)},${Y(p.y)}`).join(' '), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s);
  const u = pts[pts.length - 1]; el('circle', { cx: X(u.i), cy: Y(u.p.y), r: 3.5, fill: 'var(--accent)' }, s);
  return s;
}

const TONO = { verde: 'var(--verde)', ambar: 'var(--ambar)', rojo: 'var(--rojo)', gris: 'var(--muted)' };

// Punto de estado (12 px). El color va por clase; el nombre del color, en aria-label.
export function punto(color, decorativo = false) {
  const c = TONO[color] ? color : 'gris';
  const e = h('span', 'punto ' + c);
  // Gris = dato sin juicio: hueco vacío del mismo ancho (alinea las etiquetas) y nada que leer.
  if (decorativo || c === 'gris') e.setAttribute('aria-hidden', 'true');   // el texto de al lado ya dice el color
  else { e.setAttribute('role', 'img'); e.setAttribute('aria-label', c === 'ambar' ? 'ámbar' : c === 'gris' ? 'sin valoración' : c); }
  return e;
}

// Insignia de estado: círculo de color con un glifo blanco (verde ✓, ámbar !, rojo ×, gris –). tam = diámetro en px.
const GLIFO = { verde: 'M7 12.5l3.2 3.2L17 8.6', ambar: 'M12 6.5v7M12 17.4v.1', rojo: 'M8 8l8 8M16 8l-8 8', gris: 'M7.5 12h9' };
export function insignia(color, tam = 44) {
  const c = TONO[color] ? color : 'gris';
  const s = el('svg', { viewBox: '0 0 24 24', width: tam, height: tam, class: 'insignia ' + c, role: 'img', 'aria-label': 'Estado: ' + (c === 'ambar' ? 'ámbar' : c === 'gris' ? 'sin datos' : c) });
  el('circle', { cx: 12, cy: 12, r: 12, class: 'insignia-fondo' }, s);
  el('path', { d: GLIFO[c], class: 'insignia-glifo', fill: 'none', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
  return s;
}

// Barras por semana. Cada item: { v, color?, futura?, actual?, ghost?, lo?, hi?, arriba? } (arriba: texto sobre la barra, p. ej. los km).
// color 'verde' | 'ambar' | 'gris' pinta la barra; sin color, el estilo anterior (acento) y la banda lo..hi si viene.
// futura dibuja una barra clara a la altura de `ghost` (o `hi`); actual, la barra con contorno.
export function barras(items, { w = 320, h: hh = 96 } = {}) {
  const s = lienzo(w, hh); if (!items.length) return s;
  const conTexto = items.some(i => i.arriba), techo = conTexto ? 18 : 0;   // sitio para el texto encima de la barra más alta
  const max = Math.max(1, ...items.map(i => Math.max(i.v || 0, i.hi || 0, i.ghost || 0))) * (conTexto ? 1 : 1.1), bw = w / items.length;
  items.forEach((it, i) => {
    const x = i * bw + bw * 0.18, ancho = bw * 0.64, Y = v => hh - v / max * (hh - techo);
    if (it.lo != null && it.hi != null) el('rect', { x: i * bw + 2, width: bw - 4, y: Y(it.hi), height: Math.max(1, Y(it.lo) - Y(it.hi)), fill: 'var(--accent-soft)' }, s);
    if (it.futura) {
      const alto = it.ghost || it.hi || 0;
      if (it.color) el('rect', { x, width: ancho, y: Y(alto), height: Math.max(2, hh - Y(alto)), rx: 3, fill: 'var(--futura)' }, s);
      else el('rect', { x, width: ancho, y: Y(alto), height: hh - Y(alto), fill: 'none', stroke: 'var(--line)', 'stroke-dasharray': '3 3', rx: 3 }, s);
    } else {
      const alto = Math.max(it.color ? 3 : 0, hh - Y(it.v || 0));
      const rect = el('rect', { x, width: ancho, y: hh - alto, height: alto, rx: 3, fill: it.color ? (it.color === 'gris' ? 'var(--muted)' : TONO[it.color]) : it.actual ? 'var(--warm)' : 'var(--accent)' }, s);
      if (it.color === 'gris') rect.setAttribute('opacity', 0.45);
      if (it.color && it.actual) { rect.setAttribute('stroke', 'var(--ink)'); rect.setAttribute('stroke-width', 2); }
      if (it.arriba) { const t = el('text', { x: x + ancho / 2, y: hh - alto - 5, 'text-anchor': 'middle' }, s); t.textContent = it.arriba; }
    }
  });
  return s;
}

export function racha(hechas, dias = 14) {
  const r = h('div', 'racha'); const hoy = fechaCierre();
  for (let i = dias - 1; i >= 0; i--) { const f = diasAtras(i); const c = h('span', (hechas.has(f) ? 'si' : '') + (f === hoy ? ' hoy' : '')); c.title = f; r.appendChild(c); }
  return r;
}
