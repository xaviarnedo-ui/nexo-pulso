import { guardarCierre, empezarAyuno, romperAyuno, editarAyuno, guardarAjustes, ponerUltimaComida } from '../datos.js';
import { h, num, pad, isoDia, isoLocal, ahoraHHMM, fechaCierre, fechaCierrePorDefecto, diasAtras, fechaCorta, breve, diaSemana, fechaDeComida, ultimaComidaDe, errorAyuno } from '../util.js';
import { anillo, racha, punto } from '../graficos.js';
import { cabecera } from '../filas.js';
import { estadoFatiga, hayEnfermo } from '../semaforos.js';

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
// Estado de la pestaña que sobrevive a los repintados. formFecha es el día de cierre al que pertenece el formulario.
let form = null, formFecha = null, editando = false, horaTocada = false, tick = null;
// Día elegido a mano en la tarjeta del cierre (ayer u hoy) y el día en que se eligió: al cambiar de día vuelve el valor por defecto.
let elegida = null, eligioEn = null;


function dibujaAnillo(caja, a) {
  const horas = a ? Math.max(0, (Date.now() - new Date(a.inicio)) / 36e5) : 0;
  const txt = a ? `${Math.floor(horas)}:${pad(Math.floor((horas % 1) * 60))}` : '—';
  caja.textContent = '';
  caja.appendChild(anillo(a ? horas / 16 : 0, 'var(--accent)', txt));
}

function tarjetaAyuno(v, estado, recargar) {
  const c = h('section', 'card'); const a = estado.ayunoActual;
  const fila = h('div', 'fila'); const info = h('div', 'crece'); const caja = h('div');
  dibujaAnillo(caja, a);
  fila.appendChild(caja);
  info.appendChild(h('div', 'destacado', a ? 'Ayuno en curso' : 'Sin ayuno en curso'));
  info.appendChild(h('div', 'lbl', a ? 'desde las ' + a.inicio.slice(11) + (a.inicio.slice(0, 10) !== isoDia(new Date()) ? ' de ayer' : '') : 'Pon la hora de tu última comida: el cierre la toma de aquí.'));
  const media = estado.ayunos.slice(0, 7); if (media.length) info.appendChild(h('div', 'pie', 'Media ' + media.length + ' últimos: ' + num(media.reduce((s, x) => s + Number(x.horas), 0) / media.length) + ' h'));
  fila.appendChild(info); c.appendChild(fila);
  const hora = h('input'); hora.type = 'time'; hora.value = ahoraHHMM(); hora.oninput = () => { horaTocada = true; };
  const q = h('div', 'q'); q.appendChild(h('span', 't', a ? 'Hora de la primera comida' : 'Hora de la última comida')); q.appendChild(hora);
  const btn = h('button', 'btn', a ? 'Rompo el ayuno' : 'Empiezo el ayuno'); const m = h('div', 'msg');
  const avisoErr = t => { m.className = 'msg err'; m.textContent = t; };
  btn.onclick = async () => {
    if (!hora.value) return avisoErr('Pon una hora.');
    const d = new Date(); const [hh, mm] = hora.value.split(':').map(Number); d.setHours(hh, mm, 0, 0); if (d > new Date()) d.setDate(d.getDate() - 1);
    if (a && d <= new Date(a.inicio)) return avisoErr('La hora de la primera comida tiene que ser posterior al inicio del ayuno.');
    btn.disabled = true; m.className = 'msg'; m.textContent = '';
    try {
      if (a) await romperAyuno(a.inicio, isoLocal(d));
      else { await empezarAyuno(isoLocal(d)); await ponerUltimaComida(fechaDeComida(isoLocal(d)), isoLocal(d).slice(11, 16)); }
      horaTocada = false; await recargar();
    } catch (e) { avisoErr(e.message || String(e)); btn.disabled = false; }
  };
  const fila2 = h('div', 'fila'); q.classList.add('crece'); fila2.appendChild(q); c.appendChild(fila2); c.appendChild(btn); c.appendChild(m);
  const corregir = editorAyunos(estado, recargar); if (corregir) c.appendChild(corregir);
  // El contador vive: cada 30 s redibuja el anillo y, si no se ha tocado la hora, la actualiza.
  // Se para cuando el anillo ya no está en la página (otra pestaña o repintado).
  clearInterval(tick);
  tick = setInterval(() => {
    if (!caja.isConnected) { clearInterval(tick); return; }
    dibujaAnillo(caja, a);
    if (!horaTocada) hora.value = ahoraHHMM();
  }, 30000);
  return c;
}

// «Corregir horas» (plegado): el inicio del ayuno en curso y el inicio y el final de los 3 últimos ayunos hechos.
const fechaHora = (etiqueta, valor) => {
  const q = h('label', 'q'); q.appendChild(h('span', 't', etiqueta));
  const i = h('input'); i.type = 'datetime-local'; i.value = valor; i.max = isoLocal(new Date()); q.appendChild(i);
  return [q, i];
};
const cuando = iso => diaSemana(iso.slice(0, 10)) + ' ' + iso.slice(11);

function editorAyunos(estado, recargar) {
  const a = estado.ayunoActual;
  const hechos = estado.ayunos.filter(x => x.fin).slice(0, 3);
  if (!a && !hechos.length) return null;
  const d = h('details', 'corregir'); d.appendChild(h('summary', 'lbl', 'Corregir horas'));
  const l = h('div', 'lista'); d.appendChild(l);
  const filas = (a ? [{ actual: true, inicio: a.inicio, texto: 'En curso · desde ' + cuando(a.inicio) }] : [])
    .concat(hechos.map(x => ({ inicio: x.inicio, fin: x.fin, texto: cuando(x.inicio) + ' → ' + x.fin.slice(11) + ' · ' + num(x.horas) + ' h' })));
  for (const x of filas) {
    const fila = h('div', 'entre-bloque');
    const cab = h('div', 'entre'); cab.appendChild(h('span', null, x.texto));
    const abrir = h('button', 'btn', 'Editar'); cab.appendChild(abrir); fila.appendChild(cab);
    const panel = h('div', 'panel-ayuno'); panel.hidden = true;
    const [qi, ini] = fechaHora('Empezó (última comida)', x.inicio); panel.appendChild(qi);
    let fin = null; if (!x.actual) { const [qf, f] = fechaHora('Terminó (primera comida)', x.fin); panel.appendChild(qf); fin = f; }
    const botones = h('div', 'fila'); const guardar = h('button', 'btn primario', 'Guardar'); const cancelar = h('button', 'btn', 'Cancelar');
    botones.appendChild(cancelar); botones.appendChild(guardar); panel.appendChild(botones);
    const m = h('div', 'msg'); panel.appendChild(m);
    abrir.onclick = () => { panel.hidden = false; abrir.hidden = true; };
    cancelar.onclick = () => { panel.hidden = true; abrir.hidden = false; ini.value = x.inicio; if (fin) fin.value = x.fin; m.textContent = ''; };
    guardar.onclick = async () => {
      let err = errorAyuno(ini.value, fin ? fin.value : null);
      if (!err && fin && a && fin.value > a.inicio) err = 'Se solapa con el ayuno en curso.';
      if (err) { m.className = 'msg err'; m.textContent = err; return; }
      guardar.disabled = true; m.className = 'msg'; m.textContent = '';
      try {
        if (x.actual) await empezarAyuno(ini.value);
        else await editarAyuno(x.inicio, ini.value, fin.value);
        await ponerUltimaComida(fechaDeComida(ini.value), ini.value.slice(11, 16));
        await recargar();
      } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); guardar.disabled = false; }
    };
    fila.appendChild(panel); l.appendChild(fila);
  }
  return d;
}

function tarjetaCierre(estado, recargar, repintar) {
  const hoyIso = isoDia(new Date()), ayerIso = diasAtras(1);
  if (eligioEn !== hoyIso || ![hoyIso, ayerIso].includes(elegida)) { elegida = null; eligioEn = null; }
  const fecha = elegida || fechaCierrePorDefecto(estado.cierres);
  const previo = estado.cierres.find(x => x.fecha === fecha);
  const pasado = fecha !== hoyIso;            // los rótulos hablan de ayer, no de hoy
  const etiq = t => pasado ? t.replace(/\bhoy\b/, 'ayer') : t;
  // Un formulario a medias de otro día no se reutiliza.
  if (form && formFecha !== fecha) { form = null; formFecha = null; editando = false; }
  const c = h('section', 'card'); c.appendChild(cabecera('Cierre del día'));
  // Selector de día: si por la noche se olvida, por la mañana se registra el de ayer con su fecha.
  const sel = h('div', 'opciones c2'); sel.style.marginBottom = '4px';
  for (const [iso, nombre] of [[ayerIso, 'Ayer'], [hoyIso, 'Hoy']]) {
    const hecho = estado.cierres.some(x => x.fecha === iso);
    const b = h('button', null, nombre + ' · ' + diaSemana(iso) + (hecho ? ' ✓' : '')); b.type = 'button'; b.setAttribute('aria-pressed', iso === fecha ? 'true' : 'false');
    b.onclick = () => { elegida = iso; eligioEn = hoyIso; form = null; formFecha = null; editando = false; repintar(); };
    sel.appendChild(b);
  }
  c.appendChild(sel);
  if (pasado && !previo) c.appendChild(h('div', 'lbl', 'Se guarda con la fecha de ayer.'));
  const hoy = previo;
  if (hoy && !editando) {
    const ch = h('div', 'chips');
    [['Alcohol', hoy.alcohol], ['Café tarde', hoy.cafeina_tarde ? 'sí' : 'no'], ['Última comida', hoy.ultima_comida || '—'], ['Balance', ETIQ[hoy.balance] || '—'],
     ['Estrés', hoy.estres], ['Sensación', hoy.sensacion], ['Esfuerzo', hoy.rpe == null ? 'sin sesión' : hoy.rpe],
     ['Molestia', hoy.molestia + (hoy.molestia_zona ? ' · ' + hoy.molestia_zona : '')], ['Enfermo', hoy.enfermo ? 'sí' : 'no']]
      .forEach(([k, val]) => ch.appendChild(h('span', 'chip', k + ': ' + val)));
    const e = h('button', 'btn', 'Editar'); e.onclick = () => { editando = true; form = null; formFecha = null; elegida = fecha; eligioEn = hoyIso; repintar(); };
    c.appendChild(ch); c.appendChild(e); return c;
  }
  if (!form) { form = { alcohol: null, cafeina_tarde: null, balance: null, estres: null, sensacion: null, rpe: undefined, molestia: null, enfermo: null, molestia_zona: '' }; formFecha = fecha; if (hoy) Object.assign(form, hoy); }
  const guardar = h('button', 'btn primario', 'Guardar cierre'); const m = h('div', 'msg');
  const completo = () => form.alcohol !== null && form.cafeina_tarde !== null && form.balance && form.estres && form.sensacion && form.rpe !== undefined && form.molestia && form.enfermo !== null;
  const zona = h('input'); zona.type = 'text'; zona.placeholder = 'Zona (opcional)'; zona.value = form.molestia_zona || ''; zona.oninput = () => { form.molestia_zona = zona.value; };
  for (const [campo, titulo, cols, ops, ayuda] of PREGUNTAS) {
    const q = h('div', 'q'); const t = h('span', 't', etiq(titulo)); if (ayuda) { t.appendChild(document.createTextNode(' ')); t.appendChild(h('small', null, etiq(ayuda))); } q.appendChild(t);
    const g = h('div', 'opciones ' + cols);
    for (const [val, et] of ops) { const b = h('button', null, et); b.type = 'button'; b.setAttribute('aria-pressed', form[campo] === val ? 'true' : 'false');
      b.onclick = () => { form[campo] = val; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); zona.hidden = !(form.molestia === 'leve' || form.molestia === 'limita'); guardar.disabled = !completo(); }; g.appendChild(b); }
    q.appendChild(g); if (campo === 'molestia') { zona.hidden = !(form.molestia === 'leve' || form.molestia === 'limita'); q.appendChild(zona); }
    c.appendChild(q);
  }
  const comida = ultimaComidaDe(fecha, estado.ayunoActual, estado.ayunos) || (previo && previo.ultima_comida) || null;
  c.appendChild(h('div', 'lbl', comida ? 'Última comida: ' + comida + ' (la hora de inicio de tu ayuno)' : 'Sin hora de última comida: ponla en el ayuno de arriba.'));
  guardar.disabled = !completo();
  guardar.onclick = async () => {
    if (!form) return;
    guardar.disabled = true; m.className = 'msg'; m.textContent = 'Guardando…';
    try {
      const fila = { fecha, alcohol: form.alcohol, cafeina_tarde: form.cafeina_tarde, ultima_comida: comida, balance: form.balance, estres: form.estres, sensacion: form.sensacion,
        rpe: form.rpe, molestia: form.molestia, molestia_zona: zona.hidden ? '' : (form.molestia_zona || '').trim(), enfermo: form.enfermo };
      await guardarCierre(fila);
      // Solo tras guardar: así un fallo no pierde lo escrito. Hay que soltar el formulario antes de recargar,
      // porque el repintado que hace recargar debe mostrar los chips y no el formulario.
      form = null; formFecha = null; editando = false; elegida = fecha; eligioEn = hoyIso;
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); guardar.disabled = false; return; }
    try { await recargar(); }
    catch (e) { m.className = 'msg err'; m.textContent = 'Cierre guardado. No se han podido recargar los datos.'; }
  };
  c.appendChild(guardar); c.appendChild(m); return c;
}

const NOMBRE_ESTADO = { verde: 'verde', ambar: 'ámbar', rojo: 'roja', gris: 'sin datos' };
// Franja de estado: dos pastillas (recuperación, con la misma lógica que Fatiga; toca para ir a Fatiga · cierre de hoy)
// y, debajo, en pequeño, de qué día son los datos (o que el rojo viene de los síntomas de un cierre reciente).
function franjaEstado(estado, ir) {
  const caja = h('div', 'franja'), f = h('div', 'franja-estado'), r = estado.resumen;
  const desde = diasAtras(2), vivo = hayEnfermo(estado.cierres, desde);
  const rec = estadoFatiga(r && r.datos.fatiga, estado.cierres, desde).estado;
  const b = h('button'); b.type = 'button'; b.setAttribute('aria-label', 'Recuperación ' + NOMBRE_ESTADO[rec] + '. Ver Fatiga');
  b.append(punto(rec, true), h('span', null, 'Recuperación ' + NOMBRE_ESTADO[rec])); b.onclick = () => ir('fatiga');
  const dia = fechaCierrePorDefecto(estado.cierres), hecho = estado.cierres.some(x => x.fecha === dia);
  const deAyer = dia === diasAtras(1) && new Date().getHours() >= 5;
  const c = h('div'); c.append(punto(hecho ? 'verde' : 'ambar', true), h('span', null, 'Cierre ' + (deAyer ? 'de ayer ' : '') + (hecho ? 'hecho' : 'pendiente')));
  f.append(b, c); caja.appendChild(f);
  const pie = [vivo ? 'Síntomas en un cierre reciente' : '', r && r.datos_hasta ? 'datos del ' + fechaCorta(r.datos_hasta) : ''].filter(Boolean).join(' · ');
  if (pie) caja.appendChild(h('div', 'franja-pie', pie.charAt(0).toUpperCase() + pie.slice(1)));
  return caja;
}

export function pintar(v, estado, { recargar, ir }) {
  clearInterval(tick);   // cada repintado crea su propio contador; el anterior no debe seguir vivo
  const repintar = () => { v.textContent = ''; pintar(v, estado, { recargar, ir }); };
  v.appendChild(h('h1', null, 'Hoy'));
  v.appendChild(franjaEstado(estado, ir));
  const r = estado.resumen, a = estado.ajustes;
  if (r && (!a || !a.resumen_visto || new Date(r.creado) > new Date(a.resumen_visto))) {
    // Hasta 3 líneas cortas, sin paréntesis ni códigos; tocar la caja la marca como vista.
    const caja = h('div'); const b = h('button', 'aviso'); const t = h('div', 'crece');
    const cab = h('div', 'entre'); cab.append(h('div', 'titulo-aviso', 'Resumen nuevo'), h('span', 'visto', 'Visto')); t.appendChild(cab);
    (r.datos.novedades || []).map(breve).filter(Boolean).slice(0, 3).forEach(n => t.appendChild(h('div', 'vineta', n))); b.appendChild(t);
    const m = h('div', 'msg');
    b.onclick = async () => {
      b.disabled = true; m.className = 'msg'; m.textContent = '';
      try { await guardarAjustes({ resumen_visto: new Date().toISOString() }); await recargar(); }
      catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); b.disabled = false; }
    };
    caja.append(b, m); v.appendChild(caja);
  }
  v.appendChild(tarjetaAyuno(v, estado, recargar));
  v.appendChild(tarjetaCierre(estado, recargar, repintar));
  const rc = h('section', 'card'); const hechas = new Set(estado.cierres.map(x => x.fecha));
  rc.appendChild(cabecera('Racha de cierres', hechas.size + ' en 30 días'));
  rc.appendChild(racha(hechas)); v.appendChild(rc);
}
