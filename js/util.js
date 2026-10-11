export const pad = n => String(n).padStart(2, '0');
export const isoDia = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const isoLocal = d => isoDia(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
export const ahoraHHMM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const fechaCierre = () => { const d = new Date(); if (d.getHours() < 5) d.setDate(d.getDate() - 1); return isoDia(d); };
export const diasAtras = n => { const d = new Date(); d.setDate(d.getDate() - n); return isoDia(d); };
export const num = (v, dec = 1) => v == null || isNaN(v) ? '·' : Number(v).toFixed(dec).replace('.', ',');
export const fmtFecha = s => new Date(s + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export function h(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

// Textos que vienen del resumen (Python): fuera los códigos de evidencia "(E1)", "(E2, R2)" y cualquier otro paréntesis.
const CODIGOS = /\s*\((?:[A-Z]\d+)(?:,\s*[A-Z]\d+)*\)/g;
const ESPACIOS = s => s.replace(/\s+/g, ' ').replace(/\s+([.,:;])/g, '$1').trim();
export const limpia = s => s == null ? '' : ESPACIOS(String(s).replace(CODIGOS, '').replace(/\s*\([^()]*\)/g, ''));
// Igual, pero el contenido útil de un paréntesis se queda como "· x" (p. ej. "75,4 kg (+0,4)" → "75,4 kg · +0,4").
export const sinParentesis = s => s == null ? '' : ESPACIOS(String(s).replace(CODIGOS, '').replace(/\s*frente a la semana anterior/g, '').replace(/\s*\(([^()]*)\)/g, (m, x) => x.trim() ? ' · ' + x.trim() : ''));
// Línea corta de novedad: sin paréntesis y, si hay dos frases encadenadas con ":", solo hasta la segunda.
export const breve = s => { const t = sinParentesis(s).split(':'); return (t.length > 2 ? t.slice(0, 2).join(':') : t.join(':')).replace(/[.\s]+$/, ''); };
// Número con signo y menos tipográfico: +0,4 · −0,50 · 0,0.
export const conSigno = (x, dec = 1) => { if (x == null || isNaN(x)) return ''; const t = num(x, dec); return /^-?0,?0*$/.test(t) ? t.replace('-', '') : (x > 0 ? '+' : '') + t.replace('-', '−'); };
export const esCero = (x, dec = 1) => x != null && !isNaN(x) && Number(Number(x).toFixed(dec)) === 0;
// "9 nov" (sin día de la semana).
export const fechaCorta = s => new Date(s + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
// Porcentaje en una pieza: espacio fino que no se parte ("86 %").
export const pct = (x, dec = 0) => (typeof x === 'string' ? x : num(x, dec)) + '\u202f%';
// Días de calendario desde hoy hasta una fecha ISO (mediodía local a mediodía local: con UTC la cuenta se queda corta de noche).
export const diasHasta = (iso, hoy = new Date()) => Math.round((new Date(iso + 'T12:00') - new Date(isoDia(hoy) + 'T12:00')) / 864e5);
// "hoy" · "mañana" · "21 días".
export const cuantoFalta = n => n === 0 ? 'hoy' : n === 1 ? 'mañana' : n + ' días';
// Miles con punto, también con 4 cifras: 1234 → "1.234" (es-ES no agrupa 4 cifras).
export const miles = x => x == null || isNaN(x) ? '·' : String(Math.round(Number(x))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// "lun 12" (día de la semana corto y día del mes).
export const diaSemana = s => { const d = new Date(s + 'T12:00'); return d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '') + ' ' + d.getDate(); };
