import { h } from './util.js';
import { guardarFormulario } from './datos.js';

// Formulario de entrada: lo que el entrenador necesita para diseñar el menú sin errores.
// tipo: multi (varias opciones; "excl" = opción que borra las demás) · uno (una opción) · texto · hora · aviso
// req: obligatoria · otro: caja de texto que aparece al marcar "Otro/Otra"
export const PASOS = [
  { titulo: 'Salud', intro: 'Esto es lo más importante: lo que pongas aquí no aparecerá nunca en tu menú.', preguntas: [
    { id: 'alergias', tipo: 'multi', req: true, t: '¿Tienes alguna alergia alimentaria?', ayuda: 'Alergia = reacción real (urticaria, hinchazón, falta de aire).',
      opciones: ['Ninguna', 'Frutos secos', 'Cacahuete', 'Marisco', 'Pescado', 'Huevo', 'Leche', 'Gluten (celiaquía)', 'Soja', 'Sésamo', 'Otra'], excl: 'Ninguna', otro: 'Otra' },
    { id: 'intolerancias', tipo: 'multi', req: true, t: '¿Hay alimentos que te sientan mal?', ayuda: 'No es alergia, pero te dan molestias (barriga, gases, pesadez).',
      opciones: ['Ninguno', 'Lactosa', 'Gluten', 'Legumbres', 'Fruta', 'Picante', 'Comidas grasas', 'Cafeína', 'Otro'], excl: 'Ninguno', otro: 'Otro' },
    { id: 'evitas', tipo: 'multi', req: true, t: '¿Evitas algo por religión o convicción?',
      opciones: ['No evito nada', 'Cerdo', 'Carne roja', 'Toda la carne', 'Todo producto animal', 'Otro'], excl: 'No evito nada', otro: 'Otro' },
    { id: 'medico', tipo: 'texto', t: '¿Alguna enfermedad, lesión o medicación que debamos tener en cuenta?', ayuda: 'Anemia, colesterol, reflujo, tiroides… Opcional.' },
    { id: 'relacion', tipo: 'uno', t: 'Cuando piensas en comida y peso, ¿cómo estás?', ayuda: 'Es para cuidarte bien. Opcional; solo lo ve el entrenador.',
      opciones: ['Tranquilo con ello', 'A veces me preocupo de más', 'Vivo muy pendiente de ello', 'Prefiero no contestar'] },
  ] },
  { titulo: 'Gustos', intro: 'Cuanto más acierte con lo que te gusta, más fácil será seguir el menú.', preguntas: [
    { id: 'proteinas', tipo: 'multi', req: true, t: 'Proteínas que comes con gusto', ayuda: 'Marca todas las que te gusten.',
      opciones: ['Pollo', 'Pavo', 'Ternera', 'Cerdo', 'Pescado blanco', 'Salmón o pescado azul', 'Atún', 'Huevos', 'Jamón o embutido magro', 'Queso', 'Yogur, skyr o kéfir', 'Legumbres', 'Tofu o soja', 'Marisco'] },
    { id: 'hidratos', tipo: 'multi', req: true, t: 'Hidratos que comes con gusto',
      opciones: ['Arroz', 'Pasta', 'Patata', 'Boniato', 'Pan', 'Avena o cereales', 'Legumbres', 'Cuscús o quinoa', 'Tortillas o wraps'] },
    { id: 'verduras', tipo: 'multi', req: true, t: 'Verduras que te gustan',
      opciones: ['Ensalada', 'Tomate', 'Brócoli o coliflor', 'Espinacas', 'Calabacín o berenjena', 'Pimiento', 'Judías verdes', 'Zanahoria', 'Champiñones', 'Ninguna me gusta mucho'] },
    { id: 'frutas', tipo: 'multi', req: true, t: 'Frutas que te gustan',
      opciones: ['Plátano', 'Manzana', 'Naranja o mandarina', 'Fresas o frutos rojos', 'Uvas', 'Sandía o melón', 'Kiwi', 'Piña o mango', 'Ninguna me gusta mucho'] },
    { id: 'favoritas', tipo: 'texto', req: true, t: 'Tus comidas favoritas', ayuda: 'Platos que te encantan (paella, hamburguesa, tortilla…). Los que pueda, los meto.' },
    { id: 'odias', tipo: 'texto', req: true, t: 'Lo que NO soportas', ayuda: 'Pon "nada" si comes de todo.' },
    { id: 'caprichos', tipo: 'multi', req: true, t: '¿Qué te cuesta más dejar?',
      opciones: ['Dulces y bollería', 'Refrescos y zumos', 'Fritos y comida rápida', 'Picoteo (patatas, frutos secos)', 'Pan', 'Chocolate', 'Pizza y hamburguesa', 'Alcohol', 'Nada en especial'] },
  ] },
  { titulo: 'Tu día a día', intro: 'Para que el menú se pueda cocinar y comer en tu vida real.', preguntas: [
    { id: 'quien_cocina', tipo: 'uno', req: true, t: '¿Quién cocina en tu casa?',
      opciones: ['Yo', 'Mi familia', 'Piso compartido (cada uno lo suyo)', 'Como en comedor o restaurante', 'Pido a domicilio'] },
    { id: 'cocina_nivel', tipo: 'uno', req: true, t: '¿Cómo cocinas?', opciones: ['Nada', 'Lo básico (plancha, horno, arroz)', 'Bien'] },
    { id: 'tiempo', tipo: 'uno', req: true, t: 'Tiempo para cocinar un día normal', opciones: ['Menos de 15 min', '15 a 30 min', 'Más de 30 min'] },
    { id: 'fuera', tipo: 'uno', req: true, t: 'Comidas fuera de casa o a domicilio por semana', opciones: ['0 o 1', '2 a 4', '5 o más'] },
    { id: 'n_comidas', tipo: 'uno', req: true, t: '¿Cuántas comidas al día prefieres?', opciones: ['3', '4', '5'] },
    { id: 'horas', tipo: 'horas', req: true, t: 'Tus horas normales', ayuda: 'Un día de entreno.',
      campos: [['levantar', 'Me levanto'], ['comida', 'Como'], ['cena', 'Ceno'], ['acostar', 'Me acuesto']] },
    { id: 'desayuno', tipo: 'uno', req: true, t: '¿Desayunas?', opciones: ['Siempre', 'A veces', 'Casi nunca'] },
    { id: 'ayuno', tipo: 'uno', req: true, t: 'Dejar unas 12 horas sin comer por la noche (cenar a las 21:00 y desayunar a las 9:00)', opciones: ['Ya lo hago', 'Me parece bien', 'Me costaría', 'No quiero'] },
  ] },
  { titulo: 'Hábitos y objetivo', intro: 'Última parte.', preguntas: [
    { id: 'agua', tipo: 'uno', req: true, t: 'Agua al día', opciones: ['Menos de 1 litro', '1 a 2 litros', 'Más de 2 litros'] },
    { id: 'refrescos', tipo: 'uno', req: true, t: 'Refrescos, zumos o bebidas energéticas', opciones: ['Nunca', 'Alguno a la semana', 'Casi a diario'] },
    { id: 'cafe', tipo: 'uno', req: true, t: 'Cafés al día', opciones: ['Ninguno', '1 o 2', '3 o más'] },
    { id: 'alcohol', tipo: 'uno', req: true, t: 'Alcohol', opciones: ['Nunca', 'Alguna vez al mes', 'Casi cada fin de semana', 'Más que eso'] },
    { id: 'suplementos', tipo: 'multi', req: true, t: '¿Tomas algún suplemento?',
      opciones: ['Ninguno', 'Creatina', 'Proteína en polvo', 'Cafeína', 'Omega-3', 'Vitamina D', 'Magnesio', 'Hierro', 'Multivitamínico', 'Otro'], excl: 'Ninguno', otro: 'Otro' },
    { id: 'dificultad', tipo: 'multi', req: true, t: '¿Qué se te da peor?',
      opciones: ['Picar entre horas', 'Cenas tarde o copiosas', 'Saltarme comidas', 'Raciones grandes', 'Los fines de semana', 'Hambre por la noche', 'Comer rápido', 'Falta de tiempo para cocinar', 'Comer por aburrimiento o ansiedad'] },
    { id: 'objetivo', tipo: 'uno', req: true, t: '¿Qué te gustaría conseguir?',
      opciones: ['Bajar grasa', 'Mantenerme y rendir mejor', 'Ganar músculo', 'Tener más energía', 'No lo sé'] },
    { id: 'comentarios', tipo: 'texto', t: '¿Algo más que quieras contarme?' },
    { id: 'acepto', tipo: 'aviso', req: true,
      t: 'Entiendo que el entrenador usará estas respuestas solo para diseñar mi menú, y que puedo pedir que las borre cuando quiera.' },
  ] },
];

const BORRADOR = 'pulso-jugador-borrador';
export const respondida = (p, r) => {
  const v = r[p.id];
  if (p.tipo === 'multi') return Array.isArray(v) && v.length > 0 && (!p.otro || !v.includes(p.otro) || (r[p.id + '_otro'] || '').trim());
  if (p.tipo === 'horas') return p.campos.every(([k]) => v && v[k]);
  if (p.tipo === 'aviso') return v === true;
  if (p.tipo === 'texto') return (v || '').trim().length > 0;
  return v != null && v !== '';
};
export const pasoCompleto = (paso, r) => paso.preguntas.every(p => !p.req || respondida(p, r));

function pregunta(p, r, cambio) {
  const q = h('div', 'q'); const t = h('span', 't', p.t); if (p.ayuda) { t.appendChild(document.createTextNode(' ')); t.appendChild(h('small', null, p.ayuda)); }
  if (p.tipo === 'aviso') {
    const b = h('button', 'btn aviso-chk', (r[p.id] ? '✓ ' : '') + p.t); b.type = 'button'; b.setAttribute('aria-pressed', r[p.id] ? 'true' : 'false');
    b.onclick = () => { r[p.id] = !r[p.id]; cambio(true); }; return b;
  }
  q.appendChild(t);
  if (p.tipo === 'texto') {
    const a = h('textarea'); a.rows = 2; a.value = r[p.id] || ''; a.maxLength = 400; a.oninput = () => { r[p.id] = a.value; cambio(false); }; q.appendChild(a);
  } else if (p.tipo === 'horas') {
    const g = h('div', 'horas');
    p.campos.forEach(([k, et]) => {
      const c = h('label', 'hora'); c.appendChild(h('span', null, et));
      const i = h('input'); i.type = 'time'; i.value = (r[p.id] && r[p.id][k]) || ''; i.oninput = () => { r[p.id] = { ...(r[p.id] || {}), [k]: i.value }; cambio(false); };
      c.appendChild(i); g.appendChild(c);
    }); q.appendChild(g);
  } else {
    const multi = p.tipo === 'multi', sel = multi ? (r[p.id] || []) : r[p.id];
    const g = h('div', multi ? 'chips-sel' : 'opciones-col');
    p.opciones.forEach(o => {
      const on = multi ? sel.includes(o) : sel === o;
      const b = h('button', null, o); b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.onclick = () => {
        if (!multi) r[p.id] = o;
        else if (o === p.excl) r[p.id] = on ? [] : [o];
        else { const s = new Set((r[p.id] || []).filter(x => x !== p.excl)); on ? s.delete(o) : s.add(o); r[p.id] = [...s]; }
        cambio(true);
      };
      g.appendChild(b);
    });
    q.appendChild(g);
    if (multi && p.otro && sel.includes(p.otro)) {
      const i = h('input'); i.type = 'text'; i.placeholder = 'Cuál'; i.maxLength = 120; i.value = r[p.id + '_otro'] || ''; i.oninput = () => { r[p.id + '_otro'] = i.value; cambio(false); }; q.appendChild(i);
    }
  }
  return q;
}

// Asistente por pasos. `previas` = respuestas ya enviadas (para editar). `alTerminar` se llama tras guardar.
export function pintar(v, previas, alTerminar) {
  let respuestas = previas ? { ...previas } : null;
  if (!respuestas) { try { respuestas = JSON.parse(localStorage.getItem(BORRADOR) || '{}'); } catch (e) { respuestas = {}; } }
  let paso = 0;
  const dibuja = () => {
    const sc = window.scrollY; v.textContent = '';
    const P = PASOS[paso], ultimo = paso === PASOS.length - 1;
    v.appendChild(h('div', 'progreso-txt', 'Paso ' + (paso + 1) + ' de ' + PASOS.length));
    const barra = h('div', 'barra'); const bi = h('span'); bi.style.width = ((paso + 1) / PASOS.length * 100) + '%'; barra.appendChild(bi); v.appendChild(barra);
    v.appendChild(h('h1', null, P.titulo)); v.appendChild(h('p', 'lbl', P.intro));
    const c = h('section', 'card'); const btn = h('button', 'btn primario', ultimo ? 'Enviar' : 'Siguiente'); btn.type = 'button';
    const m = h('div', 'msg');
    const cambio = redibuja => {
      try { localStorage.setItem(BORRADOR, JSON.stringify(respuestas)); } catch (e) { /* sin almacenamiento */ }
      btn.disabled = !pasoCompleto(P, respuestas);
      if (redibuja) dibuja();
    };
    P.preguntas.forEach(p => c.appendChild(pregunta(p, respuestas, cambio)));
    v.appendChild(c);
    btn.disabled = !pasoCompleto(P, respuestas);
    btn.onclick = async () => {
      if (!ultimo) { paso++; dibuja(); window.scrollTo(0, 0); return; }
      btn.disabled = true; m.className = 'msg'; m.textContent = 'Enviando…';
      try { await guardarFormulario({ ...respuestas, version: 1 }); try { localStorage.removeItem(BORRADOR); } catch (e) { /* nada */ } await alTerminar(); }
      catch (e) { m.className = 'msg err'; m.textContent = 'No se ha podido enviar. Revisa la conexión y prueba otra vez.'; btn.disabled = false; }
    };
    v.appendChild(btn); v.appendChild(m);
    if (paso > 0) { const a = h('button', 'btn atras', 'Atrás'); a.type = 'button'; a.onclick = () => { paso--; dibuja(); window.scrollTo(0, 0); }; v.appendChild(a); }
    window.scrollTo(0, sc);
  };
  dibuja();
}
