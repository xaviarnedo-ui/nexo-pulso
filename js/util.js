export const pad = n => String(n).padStart(2, '0');
export const isoDia = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const isoLocal = d => isoDia(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
export const ahoraHHMM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const fechaCierre = () => { const d = new Date(); if (d.getHours() < 5) d.setDate(d.getDate() - 1); return isoDia(d); };
export const diasAtras = n => { const d = new Date(); d.setDate(d.getDate() - n); return isoDia(d); };
export const num = (v, dec = 1) => v == null || isNaN(v) ? '·' : Number(v).toFixed(dec).replace('.', ',');
export const fmtFecha = s => new Date(s + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export function h(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
