-- Pulso · Jugador: nombre con el que la app saluda al jugador (alias). El nombre real no cambia (menús, panel y antropometría lo usan).
-- Se pega y se ejecuta en el SQL Editor de Supabase. Solo cambia jug_cargar (añade 'alias' al perfil) y pone «Juli» a Julián.

alter table jug_jugadores add column if not exists alias text;
update jug_jugadores set alias = 'Juli' where nombre ilike 'Jose Julian%';

create or replace function jug_cargar(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare j jug_jugadores; r jsonb;
begin
  select * into j from jug_jugadores where token = p_token and activo;
  if not found then return null; end if;
  select jsonb_build_object(
    'perfil', jsonb_build_object('nombre', j.nombre, 'posicion', j.posicion, 'altura_cm', j.altura_cm, 'peso_kg', j.peso_kg,
                                 'grasa_pct', j.grasa_pct, 'ayuno_horas', j.ayuno_horas, 'alias', j.alias),
    'formulario', (select jsonb_build_object('respuestas', f.respuestas, 'enviado', f.enviado) from jug_formulario f where f.jugador_id = j.id),
    'pesos',   coalesce((select jsonb_agg(jsonb_build_object('fecha', fecha, 'kg', kg) order by fecha)
                         from jug_pesos where jugador_id = j.id and fecha >= current_date - 90), '[]'::jsonb),
    'ayuno_actual', (select a.inicio from jug_ayuno_actual a where a.jugador_id = j.id),
    'ayunos',  coalesce((select jsonb_agg(jsonb_build_object('inicio', inicio, 'fin', fin, 'horas', horas) order by inicio desc)
                         from (select * from jug_ayunos where jugador_id = j.id order by inicio desc limit 30) x), '[]'::jsonb),
    'habitos', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'emoji', h.emoji, 'nombre', h.nombre) order by h.orden)
                         from jug_habitos h
                         where h.activo
                           and (not exists (select 1 from jug_habitos_jugador a where a.jugador_id = j.id)
                                or exists (select 1 from jug_habitos_jugador a where a.jugador_id = j.id and a.habito_id = h.id))), '[]'::jsonb),
    'checks',  coalesce((select jsonb_agg(jsonb_build_object('fecha', fecha, 'habito_id', habito_id, 'hecho', hecho))
                         from jug_checks where jugador_id = j.id and fecha >= current_date - 14), '[]'::jsonb),
    'cierres', coalesce((select jsonb_agg(to_jsonb(c) - 'jugador_id' order by fecha desc)
                         from (select * from jug_cierres where jugador_id = j.id order by fecha desc limit 14) c), '[]'::jsonb),
    'menu',    (select m.datos from jug_menus m where m.jugador_id = j.id)
  ) into r;
  return r;
end $$;
