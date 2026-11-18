-- Pulso · Jugador: cierre del día nuevo (basado en el cierre de Pulso personal + comida y ultraprocesados).
-- Se pega y se ejecuta en el SQL Editor de Supabase. No toca lo anterior: las columnas viejas (menu, energia) se quedan para el historial
-- y la función vieja jug_guardar_cierre sigue funcionando para quien tenga la app antigua en caché.

alter table jug_cierres
  add column if not exists comida          text     check (comida in ('cumplido', 'menos', 'mas')),
  add column if not exists ultraprocesados boolean,
  add column if not exists alcohol         text     check (alcohol in ('0', '1-2', '3+')),
  add column if not exists cafeina_tarde   boolean,
  add column if not exists estres          smallint check (estres between 1 and 5),
  add column if not exists sensacion       smallint check (sensacion between 1 and 5),
  add column if not exists rpe             smallint check (rpe between 0 and 10),   -- null = sin sesión ese día
  add column if not exists molestia        text     check (molestia in ('no', 'leve', 'limita')),
  add column if not exists molestia_zona   text     not null default '',
  add column if not exists enfermo         boolean;

create or replace function jug_guardar_cierre_v2(p_token text, p_fecha date, p_datos jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha > current_date + 1 or p_fecha < current_date - 7 then raise exception 'fecha fuera de rango'; end if;
  insert into jug_cierres (jugador_id, fecha, comida, ultraprocesados, hambre, sueno, alcohol, cafeina_tarde, estres, sensacion, rpe,
                           molestia, molestia_zona, enfermo, nota, guardado)
  values (v, p_fecha, p_datos->>'comida', (p_datos->>'ultraprocesados')::boolean, (p_datos->>'hambre')::smallint, (p_datos->>'sueno')::smallint,
          p_datos->>'alcohol', (p_datos->>'cafeina_tarde')::boolean, (p_datos->>'estres')::smallint, (p_datos->>'sensacion')::smallint,
          (p_datos->>'rpe')::smallint, p_datos->>'molestia', left(coalesce(p_datos->>'molestia_zona', ''), 60),
          (p_datos->>'enfermo')::boolean, left(coalesce(p_datos->>'nota', ''), 500), now())
  on conflict (jugador_id, fecha) do update set
    comida = excluded.comida, ultraprocesados = excluded.ultraprocesados, hambre = excluded.hambre, sueno = excluded.sueno,
    alcohol = excluded.alcohol, cafeina_tarde = excluded.cafeina_tarde, estres = excluded.estres, sensacion = excluded.sensacion,
    rpe = excluded.rpe, molestia = excluded.molestia, molestia_zona = excluded.molestia_zona, enfermo = excluded.enfermo,
    nota = excluded.nota, guardado = now();
end $$;

revoke all on function jug_guardar_cierre_v2(text, date, jsonb) from public;
grant execute on function jug_guardar_cierre_v2(text, date, jsonb) to anon, authenticated;
