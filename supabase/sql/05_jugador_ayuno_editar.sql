-- Pulso · Jugador: corregir las horas del ayuno (el en curso y los anteriores). Se pega y se ejecuta en el SQL Editor de Supabase.
-- Mismas reglas que 03: el jugador se identifica con el token de su enlace y las tablas no son legibles directamente.

create or replace function jug_ayuno_editar_actual(p_token text, p_inicio text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_inicio::timestamp > (now() at time zone 'Europe/Madrid') then raise exception 'el inicio no puede estar en el futuro'; end if;
  update jug_ayuno_actual set inicio = p_inicio where jugador_id = v;
  if not found then raise exception 'no hay ayuno en curso'; end if;
end $$;

create or replace function jug_ayuno_editar(p_token text, p_inicio_viejo text, p_inicio text, p_fin text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token); h numeric;
begin
  if v is null then raise exception 'enlace no válido'; end if;
  h := round((extract(epoch from (p_fin::timestamp - p_inicio::timestamp)) / 3600)::numeric, 2);
  if h <= 0 or h > 48 then raise exception 'ayuno fuera de rango'; end if;
  if p_fin::timestamp > (now() at time zone 'Europe/Madrid') + interval '5 minutes' then raise exception 'el final no puede estar en el futuro'; end if;
  delete from jug_ayunos where jugador_id = v and inicio = p_inicio_viejo;
  if not found then raise exception 'ayuno no encontrado'; end if;
  insert into jug_ayunos (jugador_id, inicio, fin, horas) values (v, p_inicio, p_fin, h)
  on conflict (jugador_id, inicio) do update set fin = excluded.fin, horas = excluded.horas;
end $$;

create or replace function jug_ayuno_borrar(p_token text, p_inicio text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  delete from jug_ayunos where jugador_id = v and inicio = p_inicio;
end $$;

do $$ declare f text; begin
  foreach f in array array['jug_ayuno_editar_actual(text,text)', 'jug_ayuno_editar(text,text,text,text)', 'jug_ayuno_borrar(text,text)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
