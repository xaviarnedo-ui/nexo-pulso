import { h, num, pad, isoDia, isoLocal, ahoraHHMM, fechaCierre, media, diasAtras } from './util.js';
import { anillo, linea } from './graficos.js';
import { guardarPeso, empezarAyuno, romperAyuno, guardarCheck, guardarCierre } from './datos.js';

let tick = null, horaTocada = false;
let formCierre = null, formFecha = null;   // el cierre a medias sobrevive a los repintados

const cabecera = (t, pie) => { const c = h('div', 'cabecera'); c.appendChild(h('h2', null, t)); if (pie) c.appendChild(h('span', 'pie', pie)); return c; };

// ------------------------------------------------------------------ ayuno
function dibujaAnillo(caja, inicio, meta) {
  const horas = inicio ? Math.max(0, (Date.now() - new Date(inicio)) / 36e5) : 0;
  const txt = inicio ? `${Math.floor(horas)}:${pad(Math.floor((horas % 1) * 60))}` : '—';
  caja.textContent = ''; caja.appendChild(anillo(inicio ? horas / meta : 0, horas >= meta ? 'var(--verde)' : 'var(--accent)', txt));
}

function tarjetaAyuno(estado, recargar) {
  const c = h('section', 'card'), meta = estado.perfil.ayuno_horas || 12, inicio = estado.ayuno_actual;
  const fila = h('div', 'fila'), info = h('div', 'crece'), caja = h('div');
  dibujaAnillo(caja, inicio, meta); fila.appendChild(caja);
  const horas = inicio ? (Date.now() - new Date(inicio)) / 36e5 : 0;
  info.appendChild(h('div', 'destacado', inicio ? (horas >= meta ? 'Objetivo conseguido' : 'Ayuno en curso') : 'Sin ayuno en curso'));
  info.appendChild(h('div', 'lbl', inicio ? 'desde las ' + inicio.slice(11) + (inicio.slice(0, 10) !== isoDia(new Date()) ? ' de ayer' : '') + ' · objetivo ' + meta + ' h'
    : 'Cuando acabes de cenar, pon la hora: el objetivo son ' + meta + ' h sin comer.'));
  const ult = estado.ayunos.slice(0, 7);
  if (ult.length) info.appendChild(h('div', 'pie', 'Media de los últimos ' + ult.length + ': ' + num(ult.reduce((s, x) => s + Number(x.horas), 0) / ult.length) + ' h'));
  fila.appendChild(info); c.appendChild(fila);
  const hora = h('input'); hora.type = 'time'; hora.value = ahoraHHMM(); hora.oninput = () => { horaTocada = true; };
  const q = h('div', 'q'); q.appendChild(h('span', 't', inicio ? 'Hora de la primera comida' : 'Hora de la última comida')); q.appendChild(hora); c.appendChild(q);
  const btn = h('button', 'btn', inicio ? 'Rompo el ayuno' : 'Empiezo el ayuno'), m = h('div', 'msg');
  btn.onclick = async () => {
    if (!hora.value) { m.className = 'msg err'; m.textContent = 'Pon una hora.'; return; }
    const d = new Date(); const [hh, mm] = hora.value.split(':').map(Number); d.setHours(hh, mm, 0, 0); if (d > new Date()) d.setDate(d.getDate() - 1);
    if (inicio && d <= new Date(inicio)) { m.className = 'msg err'; m.textContent = 'La hora tiene que ser posterior al inicio del ayuno.'; return; }
    btn.disabled = true; m.className = 'msg'; m.textContent = '';
    try { if (inicio) await romperAyuno(inicio, isoLocal(d)); else await empezarAyuno(isoLocal(d)); horaTocada = false; await recargar(); }
    catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido guardar. Prueba otra vez.'; btn.disabled = false; }
  };
  c.appendChild(btn); c.appendChild(m);
  clearInterval(tick);
  tick = setInterval(() => { if (!caja.isConnected) { clearInterval(tick); return; } dibujaAnillo(caja, inicio, meta); if (!horaTocada) hora.value = ahoraHHMM(); }, 30000);
  return c;
}

// ------------------------------------------------------------------- peso
// Media móvil de 7 días: el peso de un día sube y baja por el agua; la media enseña la tendencia real.
export function tendencia(pesos, hasta = isoDia(new Date())) {
  const en = (a, b) => pesos.filter(p => p.fecha > diasAtras2(hasta, b) && p.fecha <= diasAtras2(hasta, a)).map(p => Number(p.kg));
  return { actual: media(en(0, 7)), anterior: media(en(7, 14)) };
}
const diasAtras2 = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() - n); return isoDia(d); };

function tarjetaPeso(estado, recargar) {
  const hoyIso = isoDia(new Date()), c = h('section', 'card'), pesos = estado.pesos;
  const hoy = pesos.find(p => p.fecha === hoyIso), t = tendencia(pesos);
  c.appendChild(cabecera('Peso', t.actual != null ? 'media 7 días ' + num(t.actual) + ' kg' : null));
  if (t.actual != null && t.anterior != null) {
    const d = t.actual - t.anterior;
    c.appendChild(h('div', 'lbl', (Math.abs(d) < 0.05 ? 'Igual que la semana anterior' : (d > 0 ? 'Subes ' : 'Bajas ') + num(Math.abs(d)) + ' kg frente a la semana anterior')));
  }
  const fila = h('div', 'fila'); const i = h('input'); i.type = 'text'; i.inputMode = 'decimal'; i.placeholder = 'kg'; i.value = hoy ? String(hoy.kg).replace('.', ',') : ''; i.setAttribute('aria-label', 'Peso en kg'); i.style.flex = '1';
  const b = h('button', 'btn', hoy ? 'Actualizar' : 'Guardar'), m = h('div', 'msg');
  b.onclick = async () => {
    const kg = parseFloat(i.value.replace(',', '.'));
    if (!(kg >= 35 && kg <= 160)) { m.className = 'msg err'; m.textContent = 'Pon un peso válido, por ejemplo 72,4.'; return; }
    b.disabled = true; m.className = 'msg'; m.textContent = '';
    try { await guardarPeso(hoyIso, Math.round(kg * 10) / 10); await recargar(); }
    catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido guardar. Prueba otra vez.'; b.disabled = false; }
  };
  fila.append(i, b); c.appendChild(fila); c.appendChild(m);
  c.appendChild(h('div', 'pie', 'Pésate por la mañana, tras ir al baño y antes de comer.'));
  const serie = [...Array(21)].map((_, k) => { const f = diasAtras2(hoyIso, 20 - k), p = pesos.find(x => x.fecha === f); return { y: p ? Number(p.kg) : null }; });
  if (serie.filter(s => s.y != null).length >= 2) c.appendChild(linea(serie));
  return c;
}

// ----------------------------------------------------------------- hábitos
function tarjetaHabitos(estado, recargar, repintar) {
  const fecha = fechaCierre(), c = h('section', 'card');
  const hechos = new Map(estado.checks.filter(x => x.fecha === fecha).map(x => [x.habito_id, x.hecho]));
  const n = estado.habitos.filter(x => hechos.get(x.id)).length;
  c.appendChild(cabecera('Hábitos de hoy', n + ' de ' + estado.habitos.length));
  const lista = h('div', 'habitos'); const m = h('div', 'msg');
  estado.habitos.forEach(x => {
    const on = hechos.get(x.id) === true;
    const b = h('button', 'habito'); b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.append(h('span', 'emoji', x.emoji), h('span', 'crece', x.nombre), h('span', 'tic', on ? '✓' : ''));
    b.onclick = async () => {
      const nuevo = !on; b.disabled = true;
      try { await guardarCheck(fecha, x.id, nuevo); const i = estado.checks.findIndex(k => k.fecha === fecha && k.habito_id === x.id);
        if (i >= 0) estado.checks[i].hecho = nuevo; else estado.checks.push({ fecha, habito_id: x.id, hecho: nuevo }); repintar(); }
      catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido guardar. Prueba otra vez.'; b.disabled = false; }
    };
    lista.appendChild(b);
  });
  c.appendChild(lista); c.appendChild(m); return c;
}

// -------------------------------------------------------------------- cierre
const PREG = [
  ['menu', '¿Has seguido el menú?', 'c3', [['si', 'Sí'], ['casi', 'Casi'], ['no', 'No']]],
  ['hambre', 'Hambre durante el día', 'c5', [1, 2, 3, 4, 5].map(x => [x, String(x)]), '1 = ninguna · 5 = mucha'],
  ['energia', 'Energía', 'c5', [1, 2, 3, 4, 5].map(x => [x, String(x)]), '1 = sin fuerzas · 5 = a tope'],
  ['sueno', 'Cómo has dormido', 'c5', [1, 2, 3, 4, 5].map(x => [x, String(x)]), '1 = fatal · 5 = genial'],
];
function tarjetaCierre(estado, recargar) {
  const fecha = fechaCierre(), c = h('section', 'card'), previo = estado.cierres.find(x => x.fecha === fecha);
  c.appendChild(cabecera('Cierre del día', previo ? 'hecho ✓' : null));
  if (formFecha !== fecha) { formCierre = null; formFecha = null; }
  if (!formCierre) { formCierre = { menu: null, hambre: null, energia: null, sueno: null, nota: '' }; formFecha = fecha; if (previo) Object.assign(formCierre, previo); }
  const f = formCierre, guardar = h('button', 'btn primario', previo ? 'Actualizar cierre' : 'Guardar cierre'), m = h('div', 'msg');
  const completo = () => f.menu && f.hambre && f.energia && f.sueno;
  for (const [campo, titulo, cols, ops, ayuda] of PREG) {
    const q = h('div', 'q'), t = h('span', 't', titulo); if (ayuda) { t.appendChild(document.createTextNode(' ')); t.appendChild(h('small', null, ayuda)); } q.appendChild(t);
    const g = h('div', 'opciones ' + cols);
    for (const [val, et] of ops) {
      const b = h('button', null, et); b.type = 'button'; b.setAttribute('aria-pressed', f[campo] === val ? 'true' : 'false');
      b.onclick = () => { f[campo] = val; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); guardar.disabled = !completo(); };
      g.appendChild(b);
    }
    q.appendChild(g); c.appendChild(q);
  }
  const nota = h('input'); nota.type = 'text'; nota.maxLength = 300; nota.placeholder = 'Algo que contar (opcional)'; nota.value = f.nota || ''; nota.oninput = () => { f.nota = nota.value; };
  c.appendChild(nota);
  guardar.disabled = !completo();
  guardar.onclick = async () => {
    guardar.disabled = true; m.className = 'msg'; m.textContent = 'Guardando…';
    try { await guardarCierre(fecha, f); formCierre = null; formFecha = null; await recargar(); }
    catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido guardar. Prueba otra vez.'; guardar.disabled = false; }
  };
  c.appendChild(guardar); c.appendChild(m); return c;
}

export function pintar(v, estado, { recargar, ir }) {
  clearInterval(tick);
  const repintar = () => { v.textContent = ''; pintar(v, estado, { recargar, ir }); };
  v.appendChild(h('h1', null, 'Hola, ' + estado.perfil.nombre.split(' ')[0]));
  if (!estado.menu) {
    const a = h('div', 'aviso'); const t = h('div', 'crece');
    t.appendChild(h('div', 'titulo-aviso', 'Tu menú está en preparación'));
    t.appendChild(h('div', 'vineta', 'En cuanto esté listo lo verás en la pestaña Menú.')); a.appendChild(t); v.appendChild(a);
  }
  if (estado.perfil.ayuno_horas !== 0) v.appendChild(tarjetaAyuno(estado, recargar));   // 0 = no quiere ayunar: sin reloj
  v.appendChild(tarjetaPeso(estado, recargar));
  v.appendChild(tarjetaHabitos(estado, recargar, repintar));
  v.appendChild(tarjetaCierre(estado, recargar));
}
