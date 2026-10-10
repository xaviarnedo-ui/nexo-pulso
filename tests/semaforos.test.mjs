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

test('Sueño frente a la necesidad: >=90 verde, 80-89 ámbar, <80 rojo', () => {
  tabla(S.colorSueno, [[100, 'verde'], [90, 'verde'], [89, 'ambar'], [80, 'ambar'], [79, 'rojo'], [0, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
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

test('Proteína media: >=135 verde, 120-134 ámbar, <120 rojo', () => {
  tabla(S.colorProteina, [[150, 'verde'], [135, 'verde'], [134, 'ambar'], [120, 'ambar'], [119, 'rojo'], [0, 'rojo'], [null, 'gris'], [undefined, 'gris']]);
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
  assert.deepEqual([S.SUENO_VERDE, S.SUENO_AMBAR], [90, 80]);
  assert.deepEqual([S.FACIL_VERDE, S.FACIL_AMBAR], [80, 70]);
  assert.equal(S.VOLUMEN_MAX_PCT, 30);
  assert.deepEqual([S.RITMO_PESO_MIN, S.RITMO_PESO_MAX], [-0.8, -0.3]);
  assert.deepEqual([S.PROTEINA_VERDE, S.PROTEINA_AMBAR], [135, 120]);
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
  const t = { estado: 'verde', texto: 'Todo en orden.' };
  assert.deepEqual(S.estadoFatiga(t, cierres, '2026-10-08'), { estado: 'verde', texto: 'Todo en orden.' });
  const e = S.estadoFatiga(t, cierres, '2026-10-05');
  assert.equal(e.estado, 'rojo');
  assert.equal(e.texto, S.TEXTO_ENFERMO);
  assert.deepEqual(S.estadoFatiga(null, [], '2026-10-05'), { estado: 'gris', texto: S.FRASE_SIN_DATOS });
  assert.equal(S.estadoFatiga(null, cierres, '2026-10-05').estado, 'rojo');
  assert.equal(S.estadoFatiga({ estado: 'raro' }, [], '2026-10-05').estado, 'gris');
  assert.equal(S.estadoFatiga({ estado: 'ambar' }, [], '2026-10-05').texto, S.FRASE_SIN_DATOS);
});

test('frase: textos por pestaña y color; gris = sin datos', () => {
  assert.equal(S.frase('forma', 'verde'), 'En tu nivel o por encima.');
  assert.equal(S.frase('forma', 'ambar'), 'Algo por debajo de tu base.');
  assert.equal(S.frase('forma', 'rojo'), 'Por debajo de tu base: prioriza recuperar.');
  assert.equal(S.frase('carrera', 'verde'), 'Semana dentro del plan.');
  assert.equal(S.frase('carrera', 'ambar'), 'Revisa la semana: algo se sale del plan.');
  assert.equal(S.frase('carrera', 'rojo'), 'Semana fuera del plan.');
  assert.equal(S.frase('cuerpo', 'verde'), 'Vas al ritmo de la meta.');
  assert.equal(S.frase('cuerpo', 'ambar'), 'Ajusta: el ritmo o la proteína no cuadran.');
  assert.equal(S.frase('cuerpo', 'rojo'), 'El peso sube: revisa la semana.');
  for (const t of ['forma', 'carrera', 'cuerpo']) assert.equal(S.frase(t, 'gris'), 'Sin datos suficientes esta semana.');
});

test('fraseCuerpo: el rojo por proteína no afirma que el peso sube', () => {
  assert.equal(S.fraseCuerpo('rojo', 'rojo'), 'El peso sube: revisa la semana.');
  assert.equal(S.fraseCuerpo('rojo', 'verde'), S.FRASE_PROTEINA_BAJA);
  assert.equal(S.fraseCuerpo('rojo', 'gris'), S.FRASE_PROTEINA_BAJA);
  assert.equal(S.fraseCuerpo('ambar', 'ambar'), 'Ajusta: el ritmo o la proteína no cuadran.');
  assert.equal(S.fraseCuerpo('gris', 'gris'), 'Sin datos suficientes esta semana.');
});
