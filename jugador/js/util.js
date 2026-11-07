export const pad = n => String(n).padStart(2, '0');
export const isoDia = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const isoLocal = d => isoDia(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
export const ahoraHHMM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
// Día del cierre y de los hábitos: de madrugada (antes de las 05:00) todavía cuenta el día anterior.
export const fechaCierre = (d = new Date()) => { const x = new Date(d); if (x.getHours() < 5) x.setDate(x.getDate() - 1); return isoDia(x); };
export const diasAtras = n => { const d = new Date(); d.setDate(d.getDate() - n); return isoDia(d); };
export const num = (v, dec = 1) => v == null || isNaN(v) ? '·' : Number(v).toFixed(dec).replace('.', ',');
export const fechaCorta = s => new Date(s + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
export const diaSemana = s => { const d = new Date(s + 'T12:00'); return d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '') + ' ' + d.getDate(); };
export const CLAVE_DIA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
export const edad = (nacimiento, hoy = new Date()) => {
  if (!nacimiento) return null; const n = new Date(nacimiento + 'T12:00'); let e = hoy.getFullYear() - n.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), n.getMonth(), n.getDate())) e--; return e;
};
export function h(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
export const media = xs => { const v = xs.filter(x => typeof x === 'number' && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
