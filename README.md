# NEXO Pulso

App del cierre del día, el ayuno y el estado de forma, fatiga, carrera y cuerpo. Antesala de la app de NEXO.

- Cliente estático (GitHub Pages), sin build. Datos en Supabase (UE) con RLS por usuario.
- Este repositorio es público: **nunca** datos, `.env`, clave de servicio, secretos ni la clave VAPID privada.
- Diseño: `rendimiento-xavi/docs/specs/2026-10-09-nexo-pulso-design.md`.
- `semana/`: hoja en blanco «Mi semana normal» para clientes de NEXO Performance. Sin servidor ni datos: lo que escribe el cliente se queda en su móvil hasta que él lo envía.
