import test from 'node:test';
import assert from 'node:assert/strict';
import { diasHasta, cuantoFalta, miles, diaSemana } from '../js/util.js';

test('días hasta una fecha: de calendario, también de noche', () => {
  assert.equal(diasHasta('2026-11-01', new Date(2026, 9, 11, 23, 30)), 21);
  assert.equal(diasHasta('2026-11-01', new Date(2026, 9, 11, 0, 10)), 21);
  assert.equal(diasHasta('2026-10-12', new Date(2026, 9, 11, 9)), 1);
  assert.equal(diasHasta('2026-10-11', new Date(2026, 9, 11, 9)), 0);
  assert.equal(diasHasta('2026-10-10', new Date(2026, 9, 11, 9)), -1);
  assert.equal(diasHasta('2026-11-08', new Date(2026, 9, 24, 12)), 15);     // cambio de hora del 25 oct en medio
});

test('cuánto falta: hoy, mañana o N días', () => {
  assert.equal(cuantoFalta(0), 'hoy');
  assert.equal(cuantoFalta(1), 'mañana');
  assert.equal(cuantoFalta(21), '21 días');
});

test('miles con punto desde 4 cifras', () => {
  assert.equal(miles(1234), '1.234');
  assert.equal(miles(527), '527');
  assert.equal(miles(12345.4), '12.345');
  assert.equal(miles(null), '·');
});

test('día de la semana corto', () => {
  assert.equal(diaSemana('2026-10-12'), 'lun 12');
  assert.equal(diaSemana('2026-10-18'), 'dom 18');
});
