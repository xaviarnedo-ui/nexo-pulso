import test from 'node:test';
import assert from 'node:assert/strict';
import { diasHasta, cuantoFalta, miles, diaSemana, fechaCierrePorDefecto, fechaDeComida, ultimaComidaDe } from '../js/util.js';

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

test('cierre por defecto: de madrugada y por la mañana sin el de ayer es el de ayer', () => {
  const con = [{ fecha: '2026-10-31' }], sin = [{ fecha: '2026-10-30' }];
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 10, 1, 2, 0)), '2026-10-31');      // madrugada
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 10, 1, 7, 0)), '2026-10-31');      // mañana, ayer sin hacer
  assert.equal(fechaCierrePorDefecto(con, new Date(2026, 10, 1, 7, 0)), '2026-11-01');      // mañana, ayer ya hecho
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 10, 1, 12, 0)), '2026-11-01');     // a partir de las 12 es el de hoy
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 10, 1, 22, 0)), '2026-11-01');     // noche
  assert.equal(fechaCierrePorDefecto(con, new Date(2026, 10, 1, 4, 59)), '2026-10-31');     // el corte de las 05:00 se mantiene
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 10, 1, 5, 0)), '2026-10-31');      // 05:00 con ayer sin hacer
  assert.equal(fechaCierrePorDefecto([], new Date(2026, 10, 1, 7, 0)), '2026-10-31');       // primer día
  assert.equal(fechaCierrePorDefecto(sin, new Date(2026, 2, 1, 8, 0)), '2026-02-28');       // cruce de mes
});

test('última comida = inicio del ayuno: la de madrugada cuenta como del día anterior', () => {
  assert.equal(fechaDeComida('2026-10-31T22:00'), '2026-10-31');
  assert.equal(fechaDeComida('2026-11-01T00:30'), '2026-10-31');
  assert.equal(fechaDeComida('2026-11-01T04:59'), '2026-10-31');
  assert.equal(fechaDeComida('2026-11-01T05:00'), '2026-11-01');
  assert.equal(fechaDeComida('2026-03-01T01:00'), '2026-02-28');
});

test('última comida de un día: del ayuno en curso o de los ya hechos; null si no hay', () => {
  const hechos = [{ inicio: '2026-10-30T23:45' }, { inicio: '2026-10-29T22:06' }];
  assert.equal(ultimaComidaDe('2026-10-31', { inicio: '2026-10-31T22:00' }, hechos), '22:00');
  assert.equal(ultimaComidaDe('2026-10-30', null, hechos), '23:45');
  assert.equal(ultimaComidaDe('2026-10-30', { inicio: '2026-10-31T22:00' }, hechos), '23:45');
  assert.equal(ultimaComidaDe('2026-10-31', null, hechos), null);
  assert.equal(ultimaComidaDe('2026-10-31', null, [{ inicio: '2026-10-31T20:00' }, { inicio: '2026-11-01T00:20' }]), '00:20');   // la más tardía
  assert.equal(ultimaComidaDe('2026-10-31', null, undefined), null);
});

test('horas entre dos horas locales de ayuno', async () => {
  const { horasEntre } = await import('../js/util.js');
  assert.equal(horasEntre('2026-11-11T20:38', '2026-11-12T07:33'), 10.92);
  assert.equal(horasEntre('2026-11-10T20:50', '2026-11-11T09:02'), 12.2);
});

test('error al editar un ayuno: formato, orden, futuro y duración', async () => {
  const { errorAyuno } = await import('../js/util.js');
  const ahora = new Date(2026, 10, 12, 21, 0);
  assert.equal(errorAyuno('2026-11-11T20:38', '2026-11-12T07:33', ahora), null);
  assert.equal(errorAyuno('2026-11-12T20:30', null, ahora), null);                       // ayuno en curso: solo el inicio
  assert.match(errorAyuno('', '2026-11-12T07:33', ahora), /fecha y hora/);
  assert.match(errorAyuno('2026-11-12T07:33', '2026-11-12T07:33', ahora), /posterior/);
  assert.match(errorAyuno('2026-11-12T07:33', '2026-11-11T20:00', ahora), /posterior/);
  assert.match(errorAyuno('2026-11-12T21:30', null, ahora), /futuro/);
  assert.match(errorAyuno('2026-11-11T20:00', '2026-11-12T21:30', ahora), /futuro/);
  assert.match(errorAyuno('2026-11-08T20:00', '2026-11-12T08:00', ahora), /72 h/);
});
