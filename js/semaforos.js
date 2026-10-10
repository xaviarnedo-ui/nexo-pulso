// Semáforos de NEXO Pulso: funciones puras (sin DOM) que convierten un valor en 'verde' | 'ambar' | 'rojo' | 'gris'.
// gris = se muestra como dato, sin juicio (o no hay dato). Todos los umbrales viven aquí, con nombre.

// FC en reposo sobre la base (lpm). Mismos cortes que motor/pulso_resumen.py (FC_AMBAR, FC_ROJO).
// Entre 2 y 3 (valores con decimales) cuenta como verde, igual que el resumen.
export const FC_AMBAR = 3, FC_ROJO = 5;
// Sueño frente a tu necesidad (%).
export const SUENO_VERDE = 90, SUENO_AMBAR = 80;
// Tiempo fácil (%).
export const FACIL_VERDE = 80, FACIL_AMBAR = 70;
// Subida máxima de km frente a la semana anterior (%).
export const VOLUMEN_MAX_PCT = 30;
// Ritmo de peso (kg/semana): verde de -0,8 a -0,3; ámbar entre -0,3 y 0 o por debajo de -0,8; rojo si sube.
export const RITMO_PESO_MIN = -0.8, RITMO_PESO_MAX = -0.3;
// Proteína media (g).
export const PROTEINA_VERDE = 135, PROTEINA_AMBAR = 120;
// Índice de forma y sus pilares.
export const INDICE_VERDE = 50, INDICE_AMBAR = 45;
// Cierres de 7 días, escala 1-5.
export const SENSACION_VERDE = 3.5, SENSACION_AMBAR = 2.5;
export const ESTRES_VERDE = 2.5, ESTRES_AMBAR = 3.5;

const hay = x => typeof x === 'number' && Number.isFinite(x);
const EPS = 1e-9;   // los cortes se comparan con tolerancia: 39 frente a 30 es +30 % exacto aunque 30*1.3 no lo sea en coma flotante

export function colorHRV(hrvBajo, sobreBase) {
  if (hrvBajo == null) return 'gris';
  if (!hrvBajo) return 'verde';
  return hay(sobreBase) && sobreBase >= FC_ROJO - EPS ? 'rojo' : 'ambar';
}
export function colorFC(sobreBase) {
  if (!hay(sobreBase)) return 'gris';
  if (sobreBase >= FC_ROJO - EPS) return 'rojo';
  return sobreBase >= FC_AMBAR - EPS ? 'ambar' : 'verde';
}
export function colorSueno(pct) {
  if (!hay(pct)) return 'gris';
  return pct >= SUENO_VERDE - EPS ? 'verde' : pct >= SUENO_AMBAR - EPS ? 'ambar' : 'rojo';
}
// enCurso: la semana aún no ha acabado (el motor no juzga el recuento hasta cerrarla): solo avisa si ya se pasa del máximo.
export function colorRango(n, rango, enCurso = false) {
  if (!hay(n) || !Array.isArray(rango) || !hay(rango[0]) || !hay(rango[1])) return 'gris';
  if (enCurso) return n > rango[1] ? 'ambar' : 'gris';
  return n >= rango[0] && n <= rango[1] ? 'verde' : 'ambar';
}
export function colorFacil(pct) {
  if (!hay(pct)) return 'gris';
  return pct >= FACIL_VERDE - EPS ? 'verde' : pct >= FACIL_AMBAR - EPS ? 'ambar' : 'rojo';
}
export function colorVolumen(km, kmPrevio) {
  if (!hay(km)) return 'gris';
  if (!hay(kmPrevio) || kmPrevio <= 0) return 'verde';
  return km > kmPrevio * (1 + VOLUMEN_MAX_PCT / 100) + EPS ? 'rojo' : 'verde';
}
export function colorRitmoPeso(r) {
  if (!hay(r)) return 'gris';
  if (r > 0) return 'rojo';
  return r <= RITMO_PESO_MAX + EPS && r >= RITMO_PESO_MIN - EPS ? 'verde' : 'ambar';
}
export function colorProteina(g) {
  if (!hay(g)) return 'gris';
  return g >= PROTEINA_VERDE - EPS ? 'verde' : g >= PROTEINA_AMBAR - EPS ? 'ambar' : 'rojo';
}
export function colorIndice(x) {
  if (!hay(x)) return 'gris';
  return x >= INDICE_VERDE - EPS ? 'verde' : x >= INDICE_AMBAR - EPS ? 'ambar' : 'rojo';
}
export function colorSensacion(x) {
  if (!hay(x)) return 'gris';
  return x >= SENSACION_VERDE - EPS ? 'verde' : x >= SENSACION_AMBAR - EPS ? 'ambar' : 'rojo';
}
export function colorEstres(x) {
  if (!hay(x)) return 'gris';
  return x <= ESTRES_VERDE + EPS ? 'verde' : x <= ESTRES_AMBAR + EPS ? 'ambar' : 'rojo';
}
export function colorSintomas(n) {
  if (!hay(n)) return 'gris';
  return n > 0 ? 'rojo' : 'verde';
}

const GRAVEDAD = { verde: 1, ambar: 2, rojo: 3 };
// El peor de varios colores; el gris no cuenta. Sin nada que juzgar, gris.
export function peor(colores) {
  let p = 'gris';
  for (const c of colores || []) if ((GRAVEDAD[c] || 0) > (GRAVEDAD[p] || 0)) p = c;
  return p;
}

// Color de una semana de la pestaña Carrera: futura o sin plan, gris; con avisos o fuera de lo previsto, ámbar; si no, verde.
export function colorSemana(s) {
  if (!s || s.futura) return 'gris';
  if ((s.avisos || []).length) return 'ambar';
  return s.objetivo ? colorRango(s.running, s.objetivo.running, !!s.actual) : 'gris';
}
// Km de la última semana anterior a `s` con carreras (para el +30 %): como el motor, las semanas sin km no cuentan. null si no hay.
export function kmSemanaAnterior(semanas, s) {
  const lista = semanas || [], i = lista.findIndex(x => x.lunes === s.lunes);
  for (let j = (i < 0 ? lista.length : i) - 1; j >= 0; j--) if (!lista[j].futura && hay(lista[j].km) && lista[j].km > 0) return lista[j].km;
  return null;
}

// Síntomas marcados en los cierres desde `desde` (AAAA-MM-DD) en adelante.
export function hayEnfermo(cierres, desde) { return (cierres || []).some(x => x.fecha >= desde && x.enfermo); }

// Cierres con síntomas desde `desde`; null si no hay ningún cierre en esa ventana (nada que juzgar).
export function sintomasRecientes(cierres, desde) {
  const v = (cierres || []).filter(x => x.fecha >= desde);
  return v.length ? v.filter(x => x.enfermo).length : null;
}

export const FRASE_SIN_DATOS = 'Sin datos suficientes esta semana.';
export const TEXTO_ENFERMO = 'Has marcado síntomas: descanso o algo muy suave (E5).';
export const FRASE_PROTEINA_BAJA = 'Proteína muy por debajo de la meta: sube la ingesta.';
// Estado de la Fatiga con el resumen y los cierres de los últimos 2 días: un síntoma lo pasa a rojo al momento.
export function estadoFatiga(fatiga, cierres, desde) {
  if (hayEnfermo(cierres, desde)) return { estado: 'rojo', texto: TEXTO_ENFERMO };
  if (!fatiga || !GRAVEDAD[fatiga.estado]) return { estado: 'gris', texto: FRASE_SIN_DATOS };
  return { estado: fatiga.estado, texto: fatiga.texto || FRASE_SIN_DATOS };
}

const FRASES = {
  forma: { verde: 'En tu nivel o por encima.', ambar: 'Algo por debajo de tu base.', rojo: 'Por debajo de tu base: prioriza recuperar.' },
  carrera: { verde: 'Semana dentro del plan.', ambar: 'Revisa la semana: algo se sale del plan.', rojo: 'Semana fuera del plan.' },
  cuerpo: { verde: 'Vas al ritmo de la meta.', ambar: 'Ajusta: el ritmo o la proteína no cuadran.', rojo: 'El peso sube: revisa la semana.' },
};
export function frase(tab, color) { return (FRASES[tab] && FRASES[tab][color]) || FRASE_SIN_DATOS; }
// En Cuerpo el rojo también puede venir de la proteína: entonces no se dice que el peso sube.
export function fraseCuerpo(color, colorRitmo) { return color === 'rojo' && colorRitmo !== 'rojo' ? FRASE_PROTEINA_BAJA : frase('cuerpo', color); }
