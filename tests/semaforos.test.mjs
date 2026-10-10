import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/semaforos.js';

const tabla = (fn, casos) => { for (const [entrada, esperado] of casos) assert.equal(fn(...[].concat(entrada)), esperado, `${fn.name}(${[].concat(entrada)})`); };

test('HRV: no bajo verde, bajo ámbar, bajo con FC >= 5 rojo, sin dato gris', () => {
  assert.equal(S.colorHRV(false, 0), 'verde');
  assert.equal(S.colorHRV(false, 6), 'verde');          // sin HRV baja, la FC sola no pinta la HRV de rojo
  assert.equal(S.colorHRV(true, 0), 'ambar');
  assert.equal(S.colorHRV(true, 4.9), 'ambar');
  assert.equal(S.colorHRV(true, 5), 'rojo');
  assert.equal(S.colorHRV(true, null), 'ambar');        // HRV baja y FC desconocida: ámbar
  assert.equal(S.colorHRV(null, 3), 'gris');
  assert.equal(S.colorHRV(undefined, 3), 'gris');
});

test('FC en reposo sobre la base: <=2 verde, 3-4 ámbar, >=5 rojo', () => {
  tabla(S.colorFC, [[-1, 'verde'], [0, 'verde'], [2, 'verde'], [2.9, 'verde'], [3, 'ambar'], [4, 'ambar'], [4.9, 'ambar'], [5, 'rojo'], [9, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Sueño frente a la necesidad: >=85 verde, 80-84 ámbar, <80 rojo', () => {
  tabla(S.colorSueno, [[100, 'verde'], [90, 'verde'], [85, 'verde'], [84, 'ambar'], [80, 'ambar'], [79, 'rojo'], [0, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Rango: dentro verde, fuera ámbar, sin dato gris', () => {
  assert.equal(S.colorRango(2, [2, 3]), 'verde');
  assert.equal(S.colorRango(3, [2, 3]), 'verde');
  assert.equal(S.colorRango(1, [2, 3]), 'ambar');
  assert.equal(S.colorRango(4, [2, 3]), 'ambar');
  assert.equal(S.colorRango(0, [0, 1]), 'verde');
  assert.equal(S.colorRango(null, [2, 3]), 'gris');
  assert.equal(S.colorRango(2, null), 'gris');
  assert.equal(S.colorRango(2, undefined), 'gris');
  assert.equal(S.colorRango(2, [null, 3]), 'gris');
  assert.equal(S.colorRango(2, [2]), 'gris');
});

test('% fácil: >=80 verde, 70-79 ámbar, <70 rojo', () => {
  tabla(S.colorFacil, [[95, 'verde'], [80, 'verde'], [79, 'ambar'], [70, 'ambar'], [69, 'rojo'], [0, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Volumen frente a la semana anterior: hasta +30 % verde, más rojo, sin anterior verde', () => {
  assert.equal(S.colorVolumen(130, 100), 'verde');      // +30 % exacto
  assert.equal(S.colorVolumen(131, 100), 'rojo');       // +31 %
  assert.equal(S.colorVolumen(50, 100), 'verde');       // baja
  assert.equal(S.colorVolumen(39, 30), 'verde');        // +30 % exacto con decimales de coma flotante
  assert.equal(S.colorVolumen(40, 30), 'rojo');
  assert.equal(S.colorVolumen(20, null), 'verde');      // sin semana anterior
  assert.equal(S.colorVolumen(20, undefined), 'verde');
  assert.equal(S.colorVolumen(20, 0), 'verde');         // anterior sin carrera: no hay base
  assert.equal(S.colorVolumen(null, 100), 'gris');
  assert.equal(S.colorVolumen(undefined, 100), 'gris');
});

test('Ritmo de peso (kg/sem): -0,8..-0,3 verde; -0,3..0 y < -0,8 ámbar; > 0 rojo', () => {
  tabla(S.colorRitmoPeso, [[-0.3, 'verde'], [-0.31, 'verde'], [-0.5, 'verde'], [-0.6, 'verde'], [-0.61, 'verde'], [-0.8, 'verde'],
    [-0.81, 'ambar'], [-1.5, 'ambar'], [-0.29, 'ambar'], [-0.01, 'ambar'], [0, 'ambar'], [0.01, 'rojo'], [0.5, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Índice de forma y pilares: >=50 verde, 45-49,9 ámbar, <45 rojo', () => {
  tabla(S.colorIndice, [[60, 'verde'], [50, 'verde'], [49.9, 'ambar'], [45, 'ambar'], [44.9, 'rojo'], [0, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Sensación media: >=3,5 verde, 2,5-3,4 ámbar, <2,5 rojo', () => {
  tabla(S.colorSensacion, [[5, 'verde'], [3.5, 'verde'], [3.4, 'ambar'], [2.5, 'ambar'], [2.4, 'rojo'], [1, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Estrés medio: <=2,5 verde, 2,6-3,5 ámbar, >3,5 rojo', () => {
  tabla(S.colorEstres, [[1, 'verde'], [2.5, 'verde'], [2.6, 'ambar'], [3.5, 'ambar'], [3.6, 'rojo'], [5, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('Síntomas: ninguno verde, alguno rojo, sin dato gris', () => {
  tabla(S.colorSintomas, [[0, 'verde'], [1, 'rojo'], [3, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
});

test('peor: rojo > ámbar > verde; ignora gris; vacío o todo gris es gris', () => {
  assert.equal(S.peor(['verde', 'ambar', 'rojo']), 'rojo');
  assert.equal(S.peor(['verde', 'ambar']), 'ambar');
  assert.equal(S.peor(['verde', 'verde']), 'verde');
  assert.equal(S.peor(['gris', 'verde']), 'verde');
  assert.equal(S.peor(['gris', 'gris', 'ambar']), 'ambar');
  assert.equal(S.peor(['gris', 'gris']), 'gris');
  assert.equal(S.peor([]), 'gris');
  assert.equal(S.peor(undefined), 'gris');
  assert.equal(S.peor([null, undefined, 'rojo']), 'rojo');
});

test('Umbrales: constantes con nombre y exportadas', () => {
  assert.deepEqual([S.FC_AMBAR, S.FC_ROJO], [3, 5]);
  assert.deepEqual([S.SUENO_VERDE, S.SUENO_AMBAR], [85, 80]);
  assert.deepEqual([S.FACIL_VERDE, S.FACIL_AMBAR], [80, 70]);
  assert.equal(S.VOLUMEN_MAX_PCT, 30);
  assert.deepEqual([S.RITMO_PESO_MIN, S.RITMO_PESO_MAX], [-0.8, -0.3]);
  assert.deepEqual([S.ACWR_MIN, S.ACWR_MAX_VERDE, S.ACWR_MAX_AMBAR], [0.8, 1.3, 1.5]);
  assert.deepEqual([S.INDICE_VERDE, S.INDICE_AMBAR], [50, 45]);
  assert.deepEqual([S.SENSACION_VERDE, S.SENSACION_AMBAR], [3.5, 2.5]);
  assert.deepEqual([S.ESTRES_VERDE, S.ESTRES_AMBAR], [2.5, 3.5]);
});

test('colorSemana: ámbar con avisos o fuera de plan, verde dentro, gris futura o sin plan', () => {
  const base = { futura: false, objetivo: { running: [2, 3], crossfit: [2, 3] }, running: 2, avisos: [] };
  assert.equal(S.colorSemana(base), 'verde');
  assert.equal(S.colorSemana({ ...base, avisos: ['intensidad'] }), 'ambar');
  assert.equal(S.colorSemana({ ...base, running: 4 }), 'ambar');
  assert.equal(S.colorSemana({ ...base, running: 1 }), 'ambar');
  assert.equal(S.colorSemana({ ...base, futura: true }), 'gris');
  assert.equal(S.colorSemana({ ...base, objetivo: null }), 'gris');
  assert.equal(S.colorSemana({ ...base, objetivo: null, avisos: ['volumen'] }), 'ambar');
  assert.equal(S.colorSemana({ ...base, avisos: undefined }), 'verde');
  assert.equal(S.colorSemana(null), 'gris');
});

test('kmSemanaAnterior: km de la semana no futura anterior, o null', () => {
  const sem = [{ lunes: 'a', km: 10, futura: false }, { lunes: 'b', km: 20, futura: false }, { lunes: 'c', km: 0, futura: true }];
  assert.equal(S.kmSemanaAnterior(sem, sem[1]), 10);
  assert.equal(S.kmSemanaAnterior(sem, sem[0]), null);
  assert.equal(S.kmSemanaAnterior(sem, sem[2]), 20);
  assert.equal(S.kmSemanaAnterior([], { lunes: 'z' }), null);
  assert.equal(S.kmSemanaAnterior(null, sem[0]), null);
});

test('hayEnfermo y estadoFatiga: síntomas recientes suben a rojo con su texto', () => {
  const cierres = [{ fecha: '2026-10-05', enfermo: true }, { fecha: '2026-10-08', enfermo: false }, { fecha: '2026-10-09', enfermo: false }];
  assert.equal(S.hayEnfermo(cierres, '2026-10-08'), false);
  assert.equal(S.hayEnfermo(cierres, '2026-10-05'), true);
  assert.equal(S.hayEnfermo([], '2026-10-05'), false);
  assert.equal(S.hayEnfermo(null, '2026-10-05'), false);
  const t = { estado: 'verde', texto: 'Todo en orden.', hrv_bajo: false, fc_reposo: { sobre_base: 1 } };
  assert.deepEqual(S.estadoFatiga(t, cierres, '2026-10-08'), { estado: 'verde', texto: 'Todo en orden.' });
  const e = S.estadoFatiga(t, cierres, '2026-10-05');
  assert.equal(e.estado, 'rojo');
  assert.equal(e.texto, S.TEXTO_ENFERMO);
  assert.deepEqual(S.estadoFatiga(null, [], '2026-10-05'), { estado: 'gris', texto: S.FRASE_SIN_DATOS });
  assert.equal(S.estadoFatiga(null, cierres, '2026-10-05').estado, 'rojo');
  assert.equal(S.estadoFatiga({ estado: 'raro' }, [], '2026-10-05').estado, 'gris');   // sin hrv_bajo ni FC: nada que juzgar
});

test('estadoFatiga: el color sale de HRV y FC, no del estado del resumen; el síntoma solo cuenta si es reciente', () => {
  const f = (estado, hrv_bajo, sobre_base, texto) => ({ estado, texto, hrv_bajo, fc_reposo: { sobre_base } });
  const hoy = '2026-10-13', desde = '2026-10-11';
  // El resumen dice rojo (arrastraba un síntoma viejo), pero no hay síntomas en directo y HRV y FC están normales.
  assert.deepEqual(S.estadoFatiga(f('rojo', false, 1, 'texto viejo'), [{ fecha: '2026-10-06', enfermo: true }], desde), { estado: 'verde', texto: S.FRASES_FATIGA.verde });
  // Ámbar: HRV baja o FC >= 3; rojo: ambas.
  assert.equal(S.estadoFatiga(f('verde', true, 1), [], desde).estado, 'ambar');
  assert.equal(S.estadoFatiga(f('verde', false, 3), [], desde).estado, 'ambar');
  assert.equal(S.estadoFatiga(f('verde', true, 5), [], desde).estado, 'rojo');
  assert.equal(S.estadoFatiga(f('verde', true, null), [], desde).estado, 'ambar');
  assert.equal(S.estadoFatiga(f('verde', false, 9), [], desde).estado, 'ambar');   // FC alta sola no llega a rojo
  // La frase del resumen se usa solo cuando coincide con el color calculado.
  assert.equal(S.estadoFatiga(f('ambar', true, 1, 'frase del resumen'), [], desde).texto, 'frase del resumen');
  assert.equal(S.estadoFatiga(f('rojo', true, 1, 'frase del resumen'), [], desde).texto, S.FRASES_FATIGA.ambar);
  // Síntomas en directo de los últimos 2 días: rojo con su texto, aunque todo lo demás esté bien.
  const e = S.estadoFatiga(f('verde', false, 0, 'ok'), [{ fecha: hoy, enfermo: true }], desde);
  assert.deepEqual(e, { estado: 'rojo', texto: S.TEXTO_ENFERMO });
  // Sin datos: gris.
  assert.equal(S.estadoFatiga({ hrv_bajo: null, fc_reposo: {} }, [], desde).estado, 'gris');
  assert.equal(S.estadoFatiga({}, [], desde).estado, 'gris');
});

test('frase: textos por pestaña y color; gris = sin datos', () => {
  assert.equal(S.frase('forma', 'verde'), 'En tu nivel o por encima.');
  assert.equal(S.frase('forma', 'ambar'), 'Algo por debajo de tu base.');
  assert.equal(S.frase('forma', 'rojo'), 'Por debajo de tu base: prioriza recuperar.');
  assert.equal(S.frase('carrera', 'verde'), 'Semana dentro del plan.');
  assert.equal(S.frase('carrera', 'ambar'), 'Revisa la semana: algo se sale del plan.');
  assert.equal(S.frase('carrera', 'rojo'), 'Semana fuera del plan.');
  assert.equal(S.frase('cuerpo', 'verde'), 'Vas al ritmo de la meta.');
  assert.equal(S.frase('cuerpo', 'ambar'), 'Ajusta el ritmo: no cuadra con la meta.');
  assert.equal(S.frase('cuerpo', 'rojo'), 'El peso sube: revisa la semana.');
  for (const t of ['forma', 'carrera', 'cuerpo']) assert.equal(S.frase(t, 'gris'), 'Sin datos suficientes esta semana.');
});

test('Semana en curso: el recuento solo avisa si ya pasa del máximo; si no, gris', () => {
  assert.equal(S.colorRango(1, [2, 3], true), 'gris');
  assert.equal(S.colorRango(2, [2, 3], true), 'gris');
  assert.equal(S.colorRango(3, [2, 3], true), 'gris');
  assert.equal(S.colorRango(4, [2, 3], true), 'ambar');
  assert.equal(S.colorRango(1, [2, 3], false), 'ambar');   // semana pasada
  assert.equal(S.colorRango(1, [2, 3]), 'ambar');
  assert.equal(S.colorRango(null, [2, 3], true), 'gris');
});

test('colorSemana de la semana en curso', () => {
  const base = { futura: false, actual: true, objetivo: { running: [2, 3], crossfit: [2, 3] }, running: 1, avisos: [] };
  assert.equal(S.colorSemana(base), 'gris');
  assert.equal(S.colorSemana({ ...base, running: 4 }), 'ambar');
  assert.equal(S.colorSemana({ ...base, avisos: ['intensidad'] }), 'ambar');
  assert.equal(S.colorSemana({ ...base, actual: false }), 'ambar');   // la misma semana ya cerrada
});

test('kmSemanaAnterior salta las semanas sin km (como el motor)', () => {
  const sem = [{ lunes: 'a', km: 10 }, { lunes: 'b', km: 0 }, { lunes: 'c', km: 14 }];
  assert.equal(S.kmSemanaAnterior(sem, sem[2]), 10);
  assert.equal(S.colorVolumen(14, S.kmSemanaAnterior(sem, sem[2])), 'rojo');   // +40 %
  assert.equal(S.kmSemanaAnterior(sem, sem[1]), 10);
  const nulos = [{ lunes: 'a', km: null }, { lunes: 'b', km: 5 }];
  assert.equal(S.kmSemanaAnterior(nulos, nulos[1]), null);
});

test('sintomasRecientes: nº de cierres con síntomas en la ventana, null si no hay cierres', () => {
  const c = [{ fecha: '2026-10-05', enfermo: true }, { fecha: '2026-10-08', enfermo: false }, { fecha: '2026-10-09', enfermo: true }];
  assert.equal(S.sintomasRecientes(c, '2026-10-08'), 1);
  assert.equal(S.sintomasRecientes(c, '2026-10-06'), 1);
  assert.equal(S.sintomasRecientes(c, '2026-10-10'), null);
  assert.equal(S.sintomasRecientes([], '2026-10-08'), null);
  assert.equal(S.sintomasRecientes(null, '2026-10-08'), null);
  assert.equal(S.colorSintomas(S.sintomasRecientes(c, '2026-10-10')), 'gris');
  assert.equal(S.colorSintomas(S.sintomasRecientes([{ fecha: '2026-10-09', enfermo: false }], '2026-10-08')), 'verde');
});

test('Carga aguda:crónica: 0,8-1,3 verde; 1,3-1,5 y < 0,8 ámbar; > 1,5 rojo; sin dato gris', () => {
  tabla(S.colorACWR, [[0.79, 'ambar'], [0.8, 'verde'], [0.96, 'verde'], [1.3, 'verde'], [1.31, 'ambar'], [1.5, 'ambar'], [1.51, 'rojo'], [2.4, 'rojo'], [0, 'ambar'], [null, 'gris'], [undefined, 'gris'], [NaN, 'gris']]);
});

test('ratioCarga: usa el ratio del resumen o lo calcula con semana y media_4', () => {
  assert.equal(S.ratioCarga({ semana: 88, media_4: 92, ratio: 0.96 }), 0.96);
  assert.equal(S.ratioCarga({ semana: 88, media_4: 92 }), 0.96);
  assert.equal(S.ratioCarga({ semana: 88, media_4: 0 }), null);
  assert.equal(S.ratioCarga({ semana: 88, media_4: null }), null);
  assert.equal(S.ratioCarga({ ratio: null, semana: 100, media_4: 80 }), 1.25);
  assert.equal(S.ratioCarga(null), null);
});

test('fraseACWR: una frase por zona', () => {
  assert.equal(S.fraseACWR(1), 'Carga estable.');
  assert.equal(S.fraseACWR(1.4), 'Subida de carga: vigila la recuperación.');
  assert.equal(S.fraseACWR(0.7), 'Carga baja frente a tu media.');
  assert.equal(S.fraseACWR(1.6), 'Subida brusca de carga: reduce y prioriza recuperar.');
  assert.equal(S.fraseACWR(null), '');
});
