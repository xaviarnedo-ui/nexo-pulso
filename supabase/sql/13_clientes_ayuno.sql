-- NEXO Pulso · Clientes (NEXO Performance): reloj de ayuno. Ejecutar UNA vez en el SQL Editor del proyecto "nexo-pulso",
-- después de 12_clientes_cierre.sql. No toca las tablas jug_* (jugadores del club).
--
-- Mismo funcionamiento que el ayuno de Pulso Jugador: el cliente pone la hora de su última comida (empieza el ayuno) y la de la
-- primera del día siguiente (lo rompe). Puede corregir la hora de inicio del ayuno en curso, pero no borrar nada (regla de las
-- páginas de cliente: la supresión la hace el coach). Las horas van como texto local 'AAAA-MM-DDTHH:MM', como en el modo jugador.
-- El objetivo de horas es de cada cliente (por defecto, 12).

alter table cli_clientes add column if not exists ayuno_horas smallint not null default 12 check (ayuno_horas between 10 and 20);

create table if not exists cli_ayuno_actual (
  cliente_id uuid primary key references cli_clientes on delete cascade,
  inicio     text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')
);

create table if not exists cli_ayunos (
  cliente_id uuid not null references cli_clientes on delete cascade,
  inicio     text not null check (inicio ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  fin        text not null check (fin ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  horas      numeric(5, 2) not null,
  primary key (cliente_id, inicio)
);

alter table cli_ayuno_actual enable row level security;
alter table cli_ayunos       enable row level security;
-- (sin políticas a propósito: acceso solo por las funciones)

-- cli_hoy devuelve también el ayuno en curso, los 10 últimos y el objetivo de horas.
create or replace function cli_hoy(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c cli_clientes;
begin
  select * into c from cli_clientes where token = p_token and activo;
  if not found then return null; end if;
  return jsonb_build_object(
    'nombre', split_part(c.nombre, ' ', 1),
    'nivel', c.nivel,
    'rutina', c.rutina,
    'ayuno_horas', c.ayuno_horas,
    'ayuno_actual', (select a.inicio from cli_ayuno_actual a where a.cliente_id = c.id),
    'ayunos', coalesce((select jsonb_agg(jsonb_build_object('inicio', x.inicio, 'fin', x.fin, 'horas', x.horas) order by x.inicio desc)
                        from (select * from cli_ayunos where cliente_id = c.id order by inicio desc limit 10) x), '[]'::jsonb),
    'habitos', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'icono', h.icono, 'nombre', h.nombre, 'linea', h.linea,
                                                             'cuando', h.cuando, 'fechas', h.fechas) order by h.orden, h.id)
                         from cli_habitos h where h.cliente_id = c.id and h.activo), '[]'::jsonb),
    'checks', coalesce((select jsonb_agg(jsonb_build_object('fecha', k.fecha, 'habito_id', k.habito_id, 'hecho', k.hecho))
                        from cli_checks k where k.cliente_id = c.id and k.fecha >= current_date - 35), '[]'::jsonb),
    'cierres', coalesce((select jsonb_agg(to_jsonb(x) - 'cliente_id' - 'guardado' order by x.fecha desc)
                         from cli_cierres x where x.cliente_id = c.id and x.fecha >= current_date - 14), '[]'::jsonb)
  );
end $$;

-- Empieza el ayuno (hora de la última comida). Si ya había uno en curso, se sustituye la hora.
create or replace function cli_ayuno_empezar(p_token text, p_inicio text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_inicio is null or p_inicio !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then raise exception 'hora no válida'; end if;
  if p_inicio::timestamp > now() at time zone 'Europe/Madrid' + interval '10 minutes'
     or p_inicio::timestamp < now() at time zone 'Europe/Madrid' - interval '2 days' then raise exception 'hora fuera de rango'; end if;
  insert into cli_ayuno_actual (cliente_id, inicio) values (v, p_inicio)
  on conflict (cliente_id) do update set inicio = excluded.inicio;
end $$;

-- Corrige la hora de inicio del ayuno en curso.
create or replace function cli_ayuno_editar_actual(p_token text, p_inicio text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if not exists (select 1 from cli_ayuno_actual where cliente_id = v) then raise exception 'no hay ayuno en curso'; end if;
  perform cli_ayuno_empezar(p_token, p_inicio);
end $$;

-- Rompe el ayuno (hora de la primera comida): pasa a la lista de ayunos hechos.
create or replace function cli_ayuno_romper(p_token text, p_inicio text, p_fin text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token); h numeric;
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_inicio !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' or p_fin !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then raise exception 'hora no válida'; end if;
  if not exists (select 1 from cli_ayuno_actual where cliente_id = v and inicio = p_inicio) then raise exception 'no es el ayuno en curso'; end if;
  h := round((extract(epoch from (p_fin::timestamp - p_inicio::timestamp)) / 3600)::numeric, 2);
  if h <= 0 or h > 48 then raise exception 'ayuno fuera de rango'; end if;
  insert into cli_ayunos (cliente_id, inicio, fin, horas) values (v, p_inicio, p_fin, h)
  on conflict (cliente_id, inicio) do update set fin = excluded.fin, horas = excluded.horas;
  delete from cli_ayuno_actual where cliente_id = v;
end $$;

do $$ declare f text; begin
  foreach f in array array['cli_ayuno_empezar(text,text)', 'cli_ayuno_editar_actual(text,text)', 'cli_ayuno_romper(text,text,text)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
