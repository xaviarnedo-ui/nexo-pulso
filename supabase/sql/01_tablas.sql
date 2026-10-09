-- NEXO Pulso: tablas y permisos. Ejecutar una vez en el SQL Editor del proyecto "nexo-pulso".
-- Todas las filas son de un usuario y solo él las ve (RLS). resumenes solo la escribe la clave de servicio.

create table if not exists cierres (
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  fecha         date not null,
  alcohol       text check (alcohol in ('0', '1-2', '3+')),
  cafeina_tarde boolean,
  ultima_comida text check (ultima_comida ~ '^\d{2}:\d{2}$'),
  balance       text check (balance in ('deficit', 'mantenimiento', 'superavit')),
  estres        smallint check (estres between 1 and 5),
  sensacion     smallint check (sensacion between 1 and 5),
  rpe           smallint check (rpe between 0 and 10),
  molestia      text check (molestia in ('no', 'leve', 'limita')),
  molestia_zona text not null default '',
  enfermo       boolean,
  guardado      timestamptz not null default now(),
  primary key (user_id, fecha)
);

create table if not exists ayunos (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  inicio  text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  fin     text not null check (fin ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  horas   numeric(5, 2) not null,
  primary key (user_id, inicio)
);

create table if not exists ayuno_actual (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  inicio  text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')
);

create table if not exists resumenes (
  user_id     uuid not null references auth.users on delete cascade,
  semana      date not null,
  datos       jsonb not null,
  datos_hasta date,
  creado      timestamptz not null default now(),
  primary key (user_id, semana)
);

create table if not exists ajustes (
  user_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  hora_aviso     smallint not null default 22 check (hora_aviso between 0 and 23),
  avisos         boolean not null default true,
  zona           text not null default 'Europe/Madrid',
  resumen_visto  timestamptz
);

create table if not exists push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  creado     timestamptz not null default now()
);

alter table cierres      enable row level security;
alter table ayunos       enable row level security;
alter table ayuno_actual enable row level security;
alter table resumenes    enable row level security;
alter table ajustes      enable row level security;
alter table push_subs    enable row level security;

create policy "propios" on cierres      for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on ayunos       for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on ayuno_actual for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leer"    on resumenes    for select to authenticated using (user_id = auth.uid());
create policy "propios" on ajustes      for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on push_subs    for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
