-- NEXO Pulso · Clientes (NEXO Performance). Ejecutar UNA vez en el SQL Editor del proyecto "nexo-pulso".
-- Mismo esquema que 03_jugador.sql pero con tablas propias: los clientes NO se mezclan con los jugadores del AT Baleares.
-- Cada cliente entra con un enlace personal (token largo y secreto), sin contraseña.
-- Las tablas tienen RLS activado y NINGUNA política: ni la clave pública (anon) ni un usuario autenticado
-- pueden leerlas ni escribirlas directamente. Todo pasa por las funciones de abajo (SECURITY DEFINER),
-- que exigen el token y solo tocan los datos de ese cliente. Las filas de cli_clientes las crea y lee el coach con la clave de servicio.

create table if not exists cli_clientes (
  id      uuid primary key default gen_random_uuid(),
  token   text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  nombre  text not null,
  nivel   text check (nivel in ('GO', 'PRO', 'ELITE')),
  activo  boolean not null default true,
  creado  timestamptz not null default now()
);

-- Una fila por cliente y por encuesta ('semana', 'alimentacion'...). Se sustituye al volver a enviar.
create table if not exists cli_respuestas (
  cliente_id uuid not null references cli_clientes on delete cascade,
  tipo       text not null check (tipo ~ '^[a-z_]{3,30}$'),
  respuestas jsonb not null,
  enviado    timestamptz not null default now(),
  primary key (cliente_id, tipo)
);

alter table cli_clientes   enable row level security;
alter table cli_respuestas enable row level security;
-- (sin políticas a propósito: acceso solo por las funciones)

-- ---------------------------------------------------------------- funciones
create or replace function cli_id(p_token text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from cli_clientes where token = p_token and activo
$$;

-- Devuelve el nombre, el nivel y lo ya enviado (solo los datos, sin el texto) para reabrir la página donde se dejó.
-- Un enlace que no vale devuelve null.
create or replace function cli_cargar(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c cli_clientes;
begin
  select * into c from cli_clientes where token = p_token and activo;
  if not found then return null; end if;
  return jsonb_build_object(
    'nombre', c.nombre,
    'nivel', c.nivel,
    'respuestas', coalesce((select jsonb_object_agg(r.tipo, jsonb_build_object('datos', r.respuestas -> 'datos', 'enviado', r.enviado))
                            from cli_respuestas r where r.cliente_id = c.id), '{}'::jsonb)
  );
end $$;

create or replace function cli_guardar(p_token text, p_tipo text, p_resp jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_tipo is null or p_tipo !~ '^[a-z_]{3,30}$' then raise exception 'tipo no válido'; end if;
  if pg_column_size(p_resp) > 60000 then raise exception 'respuesta demasiado grande'; end if;
  insert into cli_respuestas (cliente_id, tipo, respuestas, enviado) values (v, p_tipo, p_resp, now())
  on conflict (cliente_id, tipo) do update set respuestas = excluded.respuestas, enviado = now();
end $$;

revoke all on function cli_id(text) from public, anon, authenticated;
do $$ declare f text; begin
  foreach f in array array['cli_cargar(text)', 'cli_guardar(text,text,jsonb)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
