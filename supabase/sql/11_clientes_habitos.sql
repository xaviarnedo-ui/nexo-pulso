-- NEXO Pulso · Clientes (NEXO Performance): Mapa de Hábitos y casillas diarias. Ejecutar UNA vez en el SQL Editor
-- del proyecto "nexo-pulso", después de 04_clientes.sql. No toca las tablas jug_* (jugadores del club) ni las funciones de 04.
--
-- Cada cliente tiene SU Mapa de Hábitos (no hay una lista común). Cada hábito dice cuándo toca:
--   'diario' · días concretos ('lun,mar,mie,jue') · 'semanal:N' (N veces por semana, cualquier día) · 'fechas' (solo las de la lista).
-- Los hábitos los carga el coach con la clave de servicio (cliente.py habitos). Un hábito que se quita no se borra: se desactiva,
-- para no perder su historial. Mismo modelo de seguridad que 04: RLS sin políticas y acceso solo por funciones con el token.

create table if not exists cli_habitos (
  cliente_id uuid not null references cli_clientes on delete cascade,
  id         text not null check (id ~ '^[a-z_]{2,30}$'),
  icono      text not null default 'check' check (icono ~ '^[a-z]{2,20}$'),   -- nombre de un icono de línea de la app
  nombre     text not null check (length(nombre) <= 120),
  linea      text check (length(linea) <= 240),
  cuando     text not null default 'diario'
             check (cuando ~ '^(diario|fechas|semanal:[1-7]|(lun|mar|mie|jue|vie|sab|dom)(,(lun|mar|mie|jue|vie|sab|dom))*)$'),
  fechas     date[] not null default '{}',
  orden      smallint not null default 0,
  activo     boolean not null default true,
  primary key (cliente_id, id)
);

create table if not exists cli_checks (
  cliente_id uuid not null,
  fecha      date not null,
  habito_id  text not null,
  hecho      boolean not null,
  marcado    timestamptz not null default now(),
  primary key (cliente_id, fecha, habito_id),
  foreign key (cliente_id, habito_id) references cli_habitos (cliente_id, id) on delete cascade
);

alter table cli_habitos enable row level security;
alter table cli_checks  enable row level security;
-- (sin políticas a propósito: acceso solo por las funciones)

-- Lo que necesita la pantalla «Hoy»: primer nombre, hábitos activos y las casillas de las últimas 5 semanas. Enlace que no vale: null.
create or replace function cli_hoy(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c cli_clientes;
begin
  select * into c from cli_clientes where token = p_token and activo;
  if not found then return null; end if;
  return jsonb_build_object(
    'nombre', split_part(c.nombre, ' ', 1),
    'nivel', c.nivel,
    'habitos', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'icono', h.icono, 'nombre', h.nombre, 'linea', h.linea,
                                                             'cuando', h.cuando, 'fechas', h.fechas) order by h.orden, h.id)
                         from cli_habitos h where h.cliente_id = c.id and h.activo), '[]'::jsonb),
    'checks', coalesce((select jsonb_agg(jsonb_build_object('fecha', k.fecha, 'habito_id', k.habito_id, 'hecho', k.hecho))
                        from cli_checks k where k.cliente_id = c.id and k.fecha >= current_date - 35), '[]'::jsonb)
  );
end $$;

-- Marca o desmarca un hábito de un día. Solo hábitos activos suyos, y solo de hoy hacia una semana atrás.
create or replace function cli_guardar_check(p_token text, p_fecha date, p_habito text, p_hecho boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha is null or p_fecha > current_date + 1 or p_fecha < current_date - 7 then raise exception 'fecha no válida'; end if;
  if not exists (select 1 from cli_habitos where cliente_id = v and id = p_habito and activo) then raise exception 'hábito no válido'; end if;
  insert into cli_checks (cliente_id, fecha, habito_id, hecho, marcado) values (v, p_fecha, p_habito, coalesce(p_hecho, false), now())
  on conflict (cliente_id, fecha, habito_id) do update set hecho = excluded.hecho, marcado = now();
end $$;

do $$ declare f text; begin
  foreach f in array array['cli_hoy(text)', 'cli_guardar_check(text,date,text,boolean)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
