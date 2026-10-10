import { guardarCierre, empezarAyuno, romperAyuno, guardarAjustes } from '../datos.js';
import { h, num, pad, isoDia, isoLocal, ahoraHHMM, fechaCierre } from '../util.js';
import { anillo, racha } from '../graficos.js';

const PREGUNTAS = [
  ['alcohol', 'Alcohol hoy', 'c3', [['0', '0'], ['1-2', '1–2'], ['3+', '3+']]],
  ['cafeina_tarde', 'Café o cafeína después de las 15:30', 'c2', [[false, 'No'], [true, 'Sí']]],
  ['balance', 'Balance calórico de hoy', 'c3', [['deficit', 'Déficit'], ['mantenimiento', 'Normal'], ['superavit', 'De más']], 'déficit = comprobado con Fitia y WHOOP'],
  ['estres', 'Estrés del día', 'c5', [1, 2, 3, 4, 5].map(x => [x, String(x)]), '1 = nada · 5 = mucho'],
  ['sensacion', 'Cómo te has sentido', 'c5', [1, 2, 3, 4, 5].map(x => [x, String(x)]), '1 = fatal · 5 = genial'],
  ['rpe', 'Esfuerzo de la sesión principal', 'c6', [[null, '—'], [2, '≤2'], [4, '3–4'], [6, '5–6'], [8, '7–8'], [10, '9–10']], '— = sin sesión hoy'],
  ['molestia', 'Molestia o dolor', 'c3', [['no', 'No'], ['leve', 'Leve'], ['limita', 'Me limita']]],
  ['enfermo', 'Síntomas de enfermedad', 'c2', [[false, 'No'], [true, 'Sí']]],
];
const ETIQ = { deficit: 'déficit', mantenimiento: 'normal', superavit: 'de más' };
let form = null, editando = false, horaTocada = false, tick = null;

function inicioDesdeComida(fecha, comida) { const d = new Date(fecha + 'T12:00'); if (Number(comida.split(':')[0]) < 5) d.setDate(d.getDate() + 1); return isoDia(d) + 'T' + comida; }

function tarjetaAyuno(v, estado, recargar) {
  const c = h('section', 'card'); const a = estado.ayunoActual;
  const fila = h('div', 'fila'); const info = h('div', 'crece');
  const horas = a ? (Date.now() - new Date(a.inicio)) / 36e5 : 0;
  const txt = a ? `${Math.floor(horas)}:${pad(Math.floor((horas % 1) * 60))}` : '—';
  fila.appendChild(anillo(a ? horas / 16 : 0, 'var(--accent)', txt));
  info.appendChild(h('h2', null, a ? 'Ayuno en curso' : 'Sin ayuno en curso'));
  info.appendChild(h('div', 'lbl', a ? 'desde las ' + a.inicio.slice(11) + (a.inicio.slice(0, 10) !== isoDia(new Date()) ? ' de ayer' : '') : 'Empieza al guardar el cierre o a mano.'));
  const media = estado.ayunos.slice(0, 7); if (media.length) info.appendChild(h('div', 'pie', 'Media de tus 7 últimos: ' + num(media.reduce((s, x) => s + Number(x.horas), 0) / media.length) + ' h'));
  fila.appendChild(info); c.appendChild(fila);
  const hora = h('input'); hora.type = 'time'; hora.value = ahoraHHMM(); hora.oninput = () => { horaTocada = true; };
  const q = h('div', 'q'); q.appendChild(h('span', 't', a ? 'Hora de la primera comida' : 'Hora de la última comida')); q.appendChild(hora);
  const btn = h('button', 'btn', a ? 'Rompo el ayuno' : 'Empiezo el ayuno'); const m = h('div', 'msg');
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      const d = new Date(); const [hh, mm] = hora.value.split(':').map(Number); d.setHours(hh, mm, 0, 0); if (d > new Date()) d.setDate(d.getDate() - 1);
      if (a) await romperAyuno(a.inicio, isoLocal(d)); else await empezarAyuno(isoLocal(d));
      horaTocada = false; await recargar();
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); btn.disabled = false; }
  };
  const fila2 = h('div', 'fila'); q.classList.add('crece'); fila2.appendChild(q); c.appendChild(fila2); c.appendChild(btn); c.appendChild(m);
  clearInterval(tick); tick = setInterval(() => { if (!horaTocada) hora.value = ahoraHHMM(); }, 30000);
  return c;
}

function tarjetaCierre(estado, recargar, repintar) {
  const fecha = fechaCierre(); const hoy = estado.cierres.find(x => x.fecha === fecha);
  const c = h('section', 'card'); c.appendChild(h('h2', null, 'Cierre del día'));
  if (hoy && !editando) {
    const ch = h('div', 'chips');
    [['Alcohol', hoy.alcohol], ['Café tarde', hoy.cafeina_tarde ? 'sí' : 'no'], ['Última comida', hoy.ultima_comida], ['Balance', ETIQ[hoy.balance] || '—'],
     ['Estrés', hoy.estres], ['Sensación', hoy.sensacion], ['Esfuerzo', hoy.rpe == null ? 'sin sesión' : hoy.rpe],
     ['Molestia', hoy.molestia + (hoy.molestia_zona ? ' (' + hoy.molestia_zona + ')' : '')], ['Enfermo', hoy.enfermo ? 'sí' : 'no']]
      .forEach(([k, val]) => ch.appendChild(h('span', 'chip', k + ': ' + val)));
    const e = h('button', 'btn', 'Editar'); e.onclick = () => { editando = true; form = null; repintar(); };
    c.appendChild(ch); c.appendChild(e); return c;
  }
  if (!form) { form = { alcohol: null, cafeina_tarde: null, balance: null, estres: null, sensacion: null, rpe: undefined, molestia: null, enfermo: null, ultima_comida: '', molestia_zona: '' }; if (hoy) Object.assign(form, hoy); }
  const guardar = h('button', 'btn primario', 'Guardar cierre'); const m = h('div', 'msg');
  const completo = () => form.alcohol !== null && form.cafeina_tarde !== null && form.ultima_comida && form.balance && form.estres && form.sensacion && form.rpe !== undefined && form.molestia && form.enfermo !== null;
  const zona = h('input'); zona.type = 'text'; zona.placeholder = 'Zona (opcional)'; zona.value = form.molestia_zona || ''; zona.oninput = () => { form.molestia_zona = zona.value; };
  for (const [campo, titulo, cols, ops, ayuda] of PREGUNTAS) {
    const q = h('div', 'q'); const t = h('span', 't', titulo); if (ayuda) { t.appendChild(document.createTextNode(' ')); t.appendChild(h('small', null, ayuda)); } q.appendChild(t);
    const g = h('div', 'opciones ' + cols);
    for (const [val, et] of ops) { const b = h('button', null, et); b.type = 'button'; b.setAttribute('aria-pressed', form[campo] === val ? 'true' : 'false');
      b.onclick = () => { form[campo] = val; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); zona.hidden = !(form.molestia === 'leve' || form.molestia === 'limita'); guardar.disabled = !completo(); }; g.appendChild(b); }
    q.appendChild(g); if (campo === 'molestia') { zona.hidden = !(form.molestia === 'leve' || form.molestia === 'limita'); q.appendChild(zona); }
    c.appendChild(q);
    if (campo === 'cafeina_tarde') { const qc = h('div', 'q'); qc.appendChild(h('span', 't', 'Última comida')); const t2 = h('input'); t2.type = 'time'; t2.value = form.ultima_comida || ''; t2.oninput = () => { form.ultima_comida = t2.value; guardar.disabled = !completo(); }; qc.appendChild(t2); c.appendChild(qc); }
  }
  guardar.disabled = !completo();
  guardar.onclick = async () => {
    guardar.disabled = true; m.className = 'msg'; m.textContent = 'Guardando…';
    try {
      const fila = { fecha, alcohol: form.alcohol, cafeina_tarde: form.cafeina_tarde, ultima_comida: form.ultima_comida, balance: form.balance, estres: form.estres, sensacion: form.sensacion,
        rpe: form.rpe, molestia: form.molestia, molestia_zona: zona.hidden ? '' : (form.molestia_zona || '').trim(), enfermo: form.enfermo };
      await guardarCierre(fila);
      const inicio = inicioDesdeComida(fecha, form.ultima_comida);
      if (!estado.ayunoActual || estado.ayunoActual.inicio !== inicio) await empezarAyuno(inicio);
      editando = false; form = null; await recargar();
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); guardar.disabled = false; }
  };
  c.appendChild(guardar); c.appendChild(m); return c;
}

export function pintar(v, estado, { recargar, ir }) {
  const repintar = () => { v.textContent = ''; pintar(v, estado, { recargar, ir }); };
  v.appendChild(h('h1', null, 'Hoy'));
  const r = estado.resumen, a = estado.ajustes;
  if (r && (!a || !a.resumen_visto || new Date(r.creado) > new Date(a.resumen_visto))) {
    const b = h('button', 'aviso'); const t = h('div', 'crece'); t.appendChild(h('h2', null, 'Resumen nuevo de la semana'));
    (r.datos.novedades || []).forEach(n => t.appendChild(h('div', 'lbl', n))); b.appendChild(t);
    b.onclick = async () => { await guardarAjustes({ resumen_visto: new Date().toISOString() }); await recargar(); };
    v.appendChild(b);
  }
  v.appendChild(tarjetaAyuno(v, estado, recargar));
  v.appendChild(tarjetaCierre(estado, recargar, repintar));
  const rc = h('section', 'card'); const hechas = new Set(estado.cierres.map(x => x.fecha));
  rc.appendChild(h('div', 'entre')).append(h('h2', null, 'Racha de cierres'), h('span', 'lbl', hechas.size + ' en 30 días'));
  rc.appendChild(racha(hechas)); v.appendChild(rc);
}
