-- Pulso · Jugador: avisos push (suscripciones, recordatorios y cron). Se pega y se ejecuta en el SQL Editor de Supabase.
-- Mismas reglas que 03: las tablas no son legibles directamente; todo pasa por funciones que exigen el token del jugador.
-- Requiere (ya hecho para Pulso, ver 02_cron.sql): el secreto «pulso_notify_secret» en vault y las extensiones pg_cron y pg_net.

create table if not exists jug_push_subs (
  id         uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references jug_jugadores on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  creado     timestamptz not null default now()
);

create table if not exists jug_avisos (
  jugador_id    uuid primary key references jug_jugadores on delete cascade,
  recordatorios boolean not null default true
);

alter table jug_push_subs enable row level security;
alter table jug_avisos    enable row level security;

create or replace function jug_push_alta(p_token text, p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_endpoint is null or p_endpoint !~ '^https://' then raise exception 'endpoint no válido'; end if;
  insert into jug_push_subs (jugador_id, endpoint, p256dh, auth) values (v, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set jugador_id = excluded.jugador_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function jug_push_baja(p_token text, p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  delete from jug_push_subs where jugador_id = v and endpoint = p_endpoint;
end $$;

create or replace function jug_avisos_guardar(p_token text, p_recordatorios boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  insert into jug_avisos (jugador_id, recordatorios) values (v, p_recordatorios)
  on conflict (jugador_id) do update set recordatorios = excluded.recordatorios;
end $$;

create or replace function jug_avisos_estado(p_token text, p_endpoint text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  return jsonb_build_object(
    'suscrito', p_endpoint is not null and exists (select 1 from jug_push_subs where jugador_id = v and endpoint = p_endpoint),
    'recordatorios', coalesce((select recordatorios from jug_avisos where jugador_id = v), true));
end $$;

do $$ declare f text; begin
  foreach f in array array['jug_push_alta(text,text,text,text)', 'jug_push_baja(text,text)', 'jug_avisos_guardar(text,boolean)', 'jug_avisos_estado(text,text)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;

-- Recordatorios: pg_cron llama cada hora en punto; la función decide por la hora de Madrid (08:00 peso, 22:00 cierre).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule('jugador-recordatorios') where exists (select 1 from cron.job where jobname = 'jugador-recordatorios');
select cron.schedule('jugador-recordatorios', '0 * * * *', $$
  select net.http_post(
    url := 'https://lunaktorykgmhejojiai.supabase.co/functions/v1/jugador-notify',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-pulso-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_notify_secret')),
    body := '{"tipo":"recordatorios"}'::jsonb)
$$);
