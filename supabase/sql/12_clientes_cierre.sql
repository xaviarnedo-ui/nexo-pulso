-- NEXO Pulso · Clientes (NEXO Performance): cierre del día y rutina de sueño. Ejecutar UNA vez en el SQL Editor del proyecto
-- "nexo-pulso", después de 11_clientes_habitos.sql. No toca las tablas jug_* (jugadores del club).
--
-- El cierre es el mismo que el de Pulso Jugador (comida, ultraprocesados, hambre, alcohol, cafeína, estrés, sensación, sueño,
-- esfuerzo, molestia, enfermedad y nota) más una pregunta: si anoche cumplió su rutina de sueño (sí o no).
-- La rutina (pasos con hora) es de cada cliente: la carga el coach con la clave de servicio (cliente.py habitos) en cli_clientes.rutina.
-- Mismo modelo de seguridad que 04 y 11: RLS sin políticas y acceso solo por funciones con el token.

alter table cli_clientes add column if not exists rutina jsonb not null default '[]'::jsonb;   -- [{hora, icono, paso}]

create table if not exists cli_cierres (
  cliente_id      uuid not null references cli_clientes on delete cascade,
  fecha           date not null,
  comida          text     check (comida in ('cumplido', 'menos', 'mas')),
  ultraprocesados boolean,
  hambre          smallint check (hambre between 1 and 5),
  alcohol         text     check (alcohol in ('0', '1-2', '3+')),
  cafeina_tarde   boolean,
  estres          smallint check (estres between 1 and 5),
  sensacion       smallint check (sensacion between 1 and 5),
  sueno           smallint check (sueno between 1 and 5),
  rutina          boolean,                                         -- anoche, ¿cumplió su rutina de sueño?
  rpe             smallint check (rpe between 0 and 10),           -- null = sin sesión ese día
  molestia        text     check (molestia in ('no', 'leve', 'limita')),
  molestia_zona   text     not null default '' check (length(molestia_zona) <= 60),
  enfermo         boolean,
  nota            text     not null default '' check (length(nota) <= 500),
  guardado        timestamptz not null default now(),
  primary key (cliente_id, fecha)
);
alter table cli_cierres enable row level security;
-- (sin políticas a propósito: acceso solo por las funciones)

-- cli_hoy ahora devuelve también su rutina y sus cierres de las dos últimas semanas.
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
    'habitos', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'icono', h.icono, 'nombre', h.nombre, 'linea', h.linea,
                                                             'cuando', h.cuando, 'fechas', h.fechas) order by h.orden, h.id)
                         from cli_habitos h where h.cliente_id = c.id and h.activo), '[]'::jsonb),
    'checks', coalesce((select jsonb_agg(jsonb_build_object('fecha', k.fecha, 'habito_id', k.habito_id, 'hecho', k.hecho))
                        from cli_checks k where k.cliente_id = c.id and k.fecha >= current_date - 35), '[]'::jsonb),
    'cierres', coalesce((select jsonb_agg(to_jsonb(x) - 'cliente_id' - 'guardado' order by x.fecha desc)
                         from cli_cierres x where x.cliente_id = c.id and x.fecha >= current_date - 14), '[]'::jsonb)
  );
end $$;

-- Guarda (o sustituye) el cierre de un día. Solo de hoy hacia una semana atrás.
create or replace function cli_guardar_cierre(p_token text, p_fecha date, p_datos jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := cli_id(p_token);
begin
  if v is null then raise exception 'enlace no válido'; end if;
  if p_fecha is null or p_fecha > current_date + 1 or p_fecha < current_date - 7 then raise exception 'fecha no válida'; end if;
  if pg_column_size(p_datos) > 4000 then raise exception 'cierre demasiado grande'; end if;
  insert into cli_cierres (cliente_id, fecha, comida, ultraprocesados, hambre, alcohol, cafeina_tarde, estres, sensacion, sueno, rutina,
                           rpe, molestia, molestia_zona, enfermo, nota, guardado)
  values (v, p_fecha, p_datos->>'comida', (p_datos->>'ultraprocesados')::boolean, (p_datos->>'hambre')::smallint, p_datos->>'alcohol',
          (p_datos->>'cafeina_tarde')::boolean, (p_datos->>'estres')::smallint, (p_datos->>'sensacion')::smallint,
          (p_datos->>'sueno')::smallint, (p_datos->>'rutina')::boolean, (p_datos->>'rpe')::smallint, p_datos->>'molestia',
          left(coalesce(p_datos->>'molestia_zona', ''), 60), (p_datos->>'enfermo')::boolean, left(coalesce(p_datos->>'nota', ''), 500), now())
  on conflict (cliente_id, fecha) do update set
    comida = excluded.comida, ultraprocesados = excluded.ultraprocesados, hambre = excluded.hambre, alcohol = excluded.alcohol,
    cafeina_tarde = excluded.cafeina_tarde, estres = excluded.estres, sensacion = excluded.sensacion, sueno = excluded.sueno,
    rutina = excluded.rutina, rpe = excluded.rpe, molestia = excluded.molestia, molestia_zona = excluded.molestia_zona,
    enfermo = excluded.enfermo, nota = excluded.nota, guardado = now();
end $$;

revoke all on function cli_guardar_cierre(text, date, jsonb) from public;
grant execute on function cli_guardar_cierre(text, date, jsonb) to anon, authenticated;
