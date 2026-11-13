# Pulso · Jugador: avisos y panel del entrenador (diseño)

Fecha: 2026-11-13 · Aprobado de palabra por Xavi el mismo día (panel «para mí», objetivo de ayuno fijo en 12 h).

## Alcance en cuatro piezas

| # | Pieza | Estado |
|---|---|---|
| 1 | Corregir las horas del ayuno (en curso y anteriores) | Hecha en local: `supabase/sql/05_jugador_ayuno_editar.sql` + `jugador/js/hoy.js`. Pendiente: Xavi ejecuta el SQL y se publica. |
| 2 | Notificaciones push a los jugadores | Este documento |
| 3 | Panel del entrenador (calendario de hábitos, gestión y envío de avisos) | Este documento |
| 4 | Rediseño del cierre del día | Después, con los datos del panel a la vista |

Fuera de alcance: cambiar el objetivo de horas de ayuno (fijo en 12 h), hábitos distintos por día de la semana, panel accesible desde el móvil.

## Pieza 2 · Notificaciones

**Datos (SQL 06).**
- `jug_push_subs (id, jugador_id, endpoint unique, p256dh, auth, creado)`; sin políticas RLS, como el resto de `jug_*`.
- `jug_avisos (jugador_id pk, recordatorios boolean default true)`: el jugador puede apagar los automáticos.
- Funciones con token (`security definer`): `jug_push_alta(token, endpoint, p256dh, auth)`, `jug_push_baja(token, endpoint)`, `jug_avisos_guardar(token, recordatorios)`. `jug_cargar` devuelve si tiene avisos activos.

**App del jugador.**
- `sw.js`: manejadores `push` y `notificationclick`, copiados del de Pulso.
- Pestaña Perfil: tarjeta «Avisos» con botón Activar o Desactivar y el interruptor de recordatorios. En iPhone avisa de que hay que añadir la app a la pantalla de inicio (iOS 16.4 o superior).

**Envío.** Edge Function `jugador-notify` (copia de `pulso-notify`), con las mismas claves VAPID y el mismo secreto `x-pulso-secret`.
- `{tipo:"manual", ids:[…], titulo, texto}`: lo manda el panel.
- `{tipo:"peso"}` y `{tipo:"cierre"}`: los llama `pg_cron` cada hora. Avisan a las 08:00 si no hay peso de hoy y a las 22:00 si no hay cierre (hora de Madrid), solo a quien tenga recordatorios.
- Textos sin datos de salud: se ven en la pantalla bloqueada.
- Las suscripciones que devuelven 404 o 410 se borran.

**Lo que hace Xavi:** ejecutar el SQL 06, desplegar la función (`npx supabase login` y `functions deploy jugador-notify --no-verify-jwt`, o pegarla en el panel de Supabase) y programar el cron.

## Pieza 3 · Panel del entrenador

**Servicio.** `Nutricion/panel/panel.py`, solo la librería estándar, escucha en `127.0.0.1:8765`. Lee y escribe en Supabase con la clave de servicio de `.env`, que nunca llega al navegador. Los datos de salud no salen del Mac.

**Pantallas** (una sola página con JS sin dependencias).
- **Calendario:** jugadores en filas y días del mes en columnas. El color es el % de hábitos cumplidos de ese día, y se marca si hay peso o cierre. Navegación por meses.
- **Detalle del día:** al pulsar una celda se ven los hábitos marcados, el peso y el cierre completo.
- **Hábitos:** catálogo (crear, editar, desactivar) y asignación por jugador.
- **Avisos:** elegir jugadores, escribir el texto y enviar; muestra cuántos han recibido el aviso.

**Datos (SQL 07).** `jug_habitos_jugador (jugador_id, habito_id)`. `jug_cargar` devuelve los hábitos asignados; si un jugador no tiene filas, ve todos los activos (comportamiento actual).

## Pruebas
- Pieza 1: arnés local con `supabase` simulado (hecho: valida las horas y llama a las funciones correctas).
- Pieza 2: jugador de prueba propio de Xavi para recibir avisos reales; sin tocar a los jugadores.
- Pieza 3: panel local con datos reales en solo lectura primero; las escrituras se prueban con el jugador de prueba.

## Riesgos
- iOS solo entrega push a la app instalada en la pantalla de inicio: es fricción real; el WhatsApp lo explicará.
- Las suscripciones caducan; la función las limpia y la app vuelve a suscribir al abrirse.
- Un aviso mal redactado se ve en la pantalla bloqueada: sin cifras ni nombres de alimentos, solo recordatorios genéricos.
