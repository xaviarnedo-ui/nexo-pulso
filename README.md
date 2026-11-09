# NEXO Pulso

App del cierre del día, el ayuno y el estado de forma, fatiga, carrera y cuerpo. Antesala de la app de NEXO.

- Cliente estático (GitHub Pages), sin build. Datos en Supabase (UE) con RLS por usuario.
- Este repositorio es público: **nunca** datos, `.env`, clave de servicio, secretos ni la clave VAPID privada.
- Diseño: `rendimiento-xavi/docs/specs/2026-10-09-nexo-pulso-design.md`.
- `semana/` y `alimentacion/`: hoja «Mi semana normal» y encuesta de preferencias de alimentación para clientes de NEXO Performance. Páginas en blanco, sin datos: lo que escribe el cliente se queda en su móvil hasta que lo envía (con enlace personal, a las tablas `cli_*`; sin él, por el menú de compartir). Ver `supabase/sql/04_clientes.sql`.
