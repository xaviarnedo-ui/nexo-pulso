import { h, num, edad, fechaCorta } from './util.js';
import { linea } from './graficos.js';
import { tendencia } from './hoy.js';
import { suscripcionLocal, activarAvisos, desactivarAvisos } from './avisos.js';
import { avisosEstado, avisosGuardar } from './datos.js';

// Avisos: el entrenador puede escribir al jugador y la app le recuerda el peso (08:00) y el cierre (22:00).
function tarjetaAvisos() {
  const c = h('section', 'card'), cab = h('div', 'cabecera'); cab.appendChild(h('h2', null, 'Avisos')); c.appendChild(cab);
  c.appendChild(h('div', 'lbl', 'El entrenador puede escribirte y la app te recuerda apuntar el peso por la mañana y cerrar el día por la noche.'));
  const m = h('div', 'msg'), btn = h('button', 'btn', 'Comprobando…'); btn.type = 'button'; btn.disabled = true;
  const rec = h('div', 'q'); rec.appendChild(h('span', 't', 'Recordatorios de peso y cierre'));
  const sel = h('div', 'opciones c2'), bs = h('button', null, 'Sí'), bn = h('button', null, 'No'); bs.type = bn.type = 'button'; sel.append(bs, bn); rec.appendChild(sel); rec.hidden = true;
  const pintaRec = on => { bs.setAttribute('aria-pressed', on ? 'true' : 'false'); bn.setAttribute('aria-pressed', on ? 'false' : 'true'); };
  const etiqueta = s => { btn.textContent = s ? 'Avisos activados en este móvil · desactivar' : 'Activar avisos en este móvil'; rec.hidden = !s; };
  (async () => {
    try { const s = await suscripcionLocal(); etiqueta(s); if (s) pintaRec((await avisosEstado(s.endpoint)).recordatorios); }
    catch (e) { etiqueta(null); }
    btn.disabled = false;
  })();
  btn.onclick = async () => {
    btn.disabled = true; m.className = 'msg'; m.textContent = '';
    try {
      if (await suscripcionLocal()) { await desactivarAvisos(); etiqueta(null); m.className = 'msg ok'; m.textContent = 'Avisos desactivados en este móvil.'; }
      else { const s = await activarAvisos(); etiqueta(s); pintaRec((await avisosEstado(s.endpoint)).recordatorios); m.className = 'msg ok'; m.textContent = 'Avisos activados.'; }
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || 'No se ha podido. Prueba otra vez.'; }
    btn.disabled = false;
  };
  [bs, bn].forEach((b, i) => { b.onclick = async () => { try { await avisosGuardar(i === 0); pintaRec(i === 0); } catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido guardar.'; } }; });
  c.append(btn, rec, m);
  c.appendChild(h('div', 'pie', 'En iPhone: Compartir → Añadir a pantalla de inicio, y abre la app desde ahí para activar los avisos.'));
  return c;
}


export function pintar(v, estado, { editarFormulario }) {
  const p = estado.perfil;
  v.appendChild(h('h1', null, 'Tú'));
  const c = h('section', 'card'); const cab = h('div', 'cabecera'); cab.appendChild(h('h2', null, 'Tu perfil')); c.appendChild(cab);
  const fila = (a, b) => { const e = h('div', 'entre fila-ind'); e.appendChild(h('span', 'etq', a)); e.appendChild(h('span', 'cifra', b)); return e; };
  const l = h('div', 'lista');
  l.appendChild(fila('Posición', p.posicion || '—'));
  if (p.altura_cm) l.appendChild(fila('Altura', num(p.altura_cm, 0) + ' cm'));
  if (p.peso_kg) l.appendChild(fila('Peso en la última antropometría', num(p.peso_kg) + ' kg'));
  l.appendChild(fila('Objetivo de ayuno', (p.ayuno_horas || 12) + ' h'));
  c.appendChild(l); v.appendChild(c);
  v.appendChild(tarjetaAvisos());

  const t = tendencia(estado.pesos);
  const pw = h('section', 'card'); const cab2 = h('div', 'cabecera'); cab2.appendChild(h('h2', null, 'Evolución del peso')); pw.appendChild(cab2);
  if (estado.pesos.length >= 2) {
    const serie = estado.pesos.map(x => ({ y: Number(x.kg) })); pw.appendChild(linea(serie));
    pw.appendChild(h('div', 'lbl', 'Del ' + fechaCorta(estado.pesos[0].fecha) + ' al ' + fechaCorta(estado.pesos[estado.pesos.length - 1].fecha) + ' · media de la última semana ' + num(t.actual) + ' kg'));
  } else pw.appendChild(h('div', 'lbl', 'Apunta tu peso unos días y aquí verás la evolución.'));
  v.appendChild(pw);

  const f = h('section', 'card'); f.appendChild(h('div', 'destacado', 'Tu formulario'));
  f.appendChild(h('div', 'lbl', 'Enviado el ' + new Date(estado.formulario.enviado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) + '. Si algo cambia (una alergia, algo que ya no te gusta), corrígelo y avisa al entrenador.'));
  const b = h('button', 'btn', 'Editar mis respuestas'); b.onclick = editarFormulario; f.appendChild(b); v.appendChild(f);
}
