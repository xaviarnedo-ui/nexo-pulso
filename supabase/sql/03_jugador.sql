-- NEXO Pulso · Jugador (AT Baleares). Ejecutar UNA vez en el SQL Editor del proyecto "nexo-pulso".
-- Cada jugador entra con un enlace personal (token largo y secreto), sin contraseña.
-- Las tablas tienen RLS activado y NINGUNA política: ni la clave pública (anon) ni un usuario autenticado
-- pueden leerlas ni escribirlas directamente. Todo pasa por las funciones de abajo (SECURITY DEFINER),
-- que exigen el token y solo tocan los datos de ese jugador. Las filas las crea y lee el entrenador con la clave de servicio.

create table if not exists jug_jugadores (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  nombre        text not null,
  nacimiento    date,
  posicion      text,
  altura_cm     numeric(5, 1),
  peso_kg       numeric(5, 1),          -- último peso de la antropometría
  sigma6        numeric(5, 1),          -- suma de 6 pliegues (mm)
  grasa_pct     numeric(4, 1),          -- % de grasa estimado (Yuhasz)
  ayuno_horas   smallint not null default 12,
  activo        boolean not null default true,
  creado        timestamptz not null default now()
);

create table if not exists jug_formulario (
  jugador_id uuid primary key references jug_jugadores on delete cascade,
  respuestas jsonb not null,
  enviado    timestamptz not null default now()
);

create table if not exists jug_pesos (
  jugador_id uuid not null references jug_jugadores on delete cascade,
  fecha      date not null,
  kg         numeric(5, 1) not null check (kg between 35 and 160),
  primary key (jugador_id, fecha)
);

create table if not exists jug_ayuno_actual (
  jugador_id uuid primary key references jug_jugadores on delete cascade,
  inicio     text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')
);

create table if not exists jug_ayunos (
  jugador_id uuid not null references jug_jugadores on delete cascade,
  inicio     text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  fin        text not null check (fin ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  horas      numeric(5, 2) not null,
  primary key (jugador_id, inicio)
);

create table if not exists jug_habitos (
  id     text primary key,
  emoji  text not null default '✅',
  nombre text not null,
  orden  smallint not null default 0,
  activo boolean not null default true
);

create table if not exists jug_checks (
  jugador_id uuid not null references jug_jugadores on delete cascade,
  fecha      date not null,
  habito_id  text not null references jug_habitos on delete cascade,
  hecho      boolean not null,
  primary key (jugador_id, fecha, habito_id)
);

create table if not exists jug_cierres (
  jugador_id uuid not null references jug_jugadores on delete cascade,
  fecha      date not null,
  menu       text check (menu in ('si', 'casi', 'no')),
  hambre     smallint check (hambre between 1 and 5),
  energia    smallint check (energia between 1 and 5),
  sueno      smallint check (sueno between 1 and 5),
  nota       text not null default '',
  guardado   timestamptz not null default now(),
  primary key (jugador_id, fecha)
);

create table if not exists jug_menus (
  jugador_id  uuid primary key references jug_jugadores on delete cascade,
  datos       jsonb not null,
  actualizado timestamptz not null default now()
);

alter table jug_jugadores    enable row level security;
alter table jug_formulario   enable row level security;
alter table jug_pesos        enable row level security;
alter table jug_ayuno_actual enable row level security;
alter table jug_ayunos       enable row level security;
alter table jug_habitos      enable row level security;
alter table jug_checks       enable row level security;
alter table jug_cierres      enable row level security;
alter table jug_menus        enable row level security;
-- (sin políticas a propósito: acceso solo por las funciones)

insert into jug_habitos (id, emoji, nombre, orden) values
  ('agua',      '💧', 'Beber 2,5 litros de agua', 1),
  ('proteina',  '🥩', 'Proteína en cada comida', 2),
  ('verdura',   '🥗', 'Verdura en la comida y en la cena', 3),
  ('sin_dulce', '🚫', 'Sin refrescos, bollería ni dulces', 4),
  ('menu',      '🍽️', 'Seguir el menú del día', 5),
  ('sueno',     '😴', 'Dormir 8 horas', 6)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- funciones
create or replace function jug_id(p_token text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from jug_jugadores where token = p_token and activo
$$;

create or replace function jug_cargar(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare j jug_jugadores; r jsonb;
begin
  select * into j from jug_jugadores where token = p_token and activo;
  if not found then return null; end if;
  select jsonb_build_object(
    'perfil', jsonb_build_object('nombre', j.nombre, 'posicion', j.posicion, 'altura_cm', j.altura_cm, 'peso_kg', j.peso_kg,
                                 'grasa_pct', j.grasa_pct, 'ayuno_horas', j.ayuno_horas),
    'formulario', (select jsonb_build_object('respuestas', f.respuestas, 'enviado', f.enviado) from jug_formulario f where f.jugador_id = j.id),
    'pesos',   coalesce((select jsonb_agg(jsonb_build_object('fecha', fecha, 'kg', kg) order by fecha)
                         from jug_pesos where jugador_id = j.id and fecha >= current_date - 90), '[]'::jsonb),
    'ayuno_actual', (select a.inicio from jug_ayuno_actual a where a.jugador_id = j.id),
    'ayunos',  coalesce((select jsonb_agg(jsonb_build_object('inicio', inicio, 'fin', fin, 'horas', horas) order by inicio desc)
                         from (select * from jug_ayunos where jugador_id = j.id order by inicio desc limit 30) x), '[]'::jsonb),
    'habitos', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'emoji', emoji, 'nombre', nombre) order by orden)
                         from jug_habitos where activo), '[]'::jsonb),
    'checks',  coalesce((select jsonb_agg(jsonb_build_object('fecha', fecha, 'habito_id', habito_id, 'hecho', hecho))
                         from jug_checks where jugador_id = j.id and fecha >= current_date - 14), '[]'::jsonb),
    'cierres', coalesce((select jsonb_agg(to_jsonb(c) - 'jugador_id' order by fecha desc)
                         from (select * from jug_cierres where jugador_id = j.id order by fecha desc limit 14) c), '[]'::jsonb),
    'menu',    (select m.datos from jug_menus m where m.jugador_id = j.id)
  ) into r;
  return r;
end $$;

create or replace function jug_guardar_formulario(p_token text, p_resp jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if pg_column_size(p_resp) > 20000 then raise exception 'respuesta demasiado grande'; end if;
  insert into jug_formulario (jugador_id, respuestas, enviado) values (v, p_resp, now())
  on conflict (jugador_id) do update set respuestas = excluded.respuestas, enviado = now();
end $$;

create or replace function jug_guardar_peso(p_token text, p_fecha date, p_kg numeric) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha > current_date + 1 or p_fecha < current_date - 30 then raise exception 'fecha fuera de rango'; end if;
  insert into jug_pesos (jugador_id, fecha, kg) values (v, p_fecha, p_kg)
  on conflict (jugador_id, fecha) do update set kg = excluded.kg;
end $$;

create or replace function jug_ayuno_empezar(p_token text, p_inicio text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  insert into jug_ayuno_actual (jugador_id, inicio) values (v, p_inicio)
  on conflict (jugador_id) do update set inicio = excluded.inicio;
end $$;

create or replace function jug_ayuno_romper(p_token text, p_inicio text, p_fin text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token); h numeric;
begin
  if v is null then raise exception 'enlace no válido'; end if;
  h := round((extract(epoch from (p_fin::timestamp - p_inicio::timestamp)) / 3600)::numeric, 2);
  if h <= 0 or h > 72 then raise exception 'ayuno fuera de rango'; end if;
  insert into jug_ayunos (jugador_id, inicio, fin, horas) values (v, p_inicio, p_fin, h)
  on conflict (jugador_id, inicio) do update set fin = excluded.fin, horas = excluded.horas;
  delete from jug_ayuno_actual where jugador_id = v;
end $$;

create or replace function jug_guardar_check(p_token text, p_fecha date, p_habito text, p_hecho boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha > current_date + 1 or p_fecha < current_date - 7 then raise exception 'fecha fuera de rango'; end if;
  insert into jug_checks (jugador_id, fecha, habito_id, hecho) values (v, p_fecha, p_habito, p_hecho)
  on conflict (jugador_id, fecha, habito_id) do update set hecho = excluded.hecho;
end $$;

create or replace function jug_guardar_cierre(p_token text, p_fecha date, p_menu text, p_hambre int, p_energia int, p_sueno int, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := jug_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha > current_date + 1 or p_fecha < current_date - 7 then raise exception 'fecha fuera de rango'; end if;
  insert into jug_cierres (jugador_id, fecha, menu, hambre, energia, sueno, nota, guardado)
  values (v, p_fecha, p_menu, p_hambre, p_energia, p_sueno, left(coalesce(p_nota, ''), 500), now())
  on conflict (jugador_id, fecha) do update set menu = excluded.menu, hambre = excluded.hambre, energia = excluded.energia,
    sueno = excluded.sueno, nota = excluded.nota, guardado = now();
end $$;

revoke all on function jug_id(text) from public, anon, authenticated;
do $$ declare f text; begin
  foreach f in array array[
    'jug_cargar(text)', 'jug_guardar_formulario(text,jsonb)', 'jug_guardar_peso(text,date,numeric)',
    'jug_ayuno_empezar(text,text)', 'jug_ayuno_romper(text,text,text)', 'jug_guardar_check(text,date,text,boolean)',
    'jug_guardar_cierre(text,date,text,int,int,int,text)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
