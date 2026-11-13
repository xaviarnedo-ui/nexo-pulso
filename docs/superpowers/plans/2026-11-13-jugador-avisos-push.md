# Pulso · Jugador: avisos push (pieza 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que Xavi pueda mandar avisos push a los jugadores y que la app les recuerde el peso y el cierre del día.

**Architecture:** Web Push estándar con las claves VAPID y el secreto que ya usa NEXO Pulso. Tablas `jug_push_subs` y `jug_avisos` sin políticas, accedidas solo con funciones `security definer` que exigen el token del jugador (como el resto de `jug_*`). Una Edge Function `jugador-notify` envía los avisos (manuales y recordatorios) y `pg_cron` la llama cada hora.

**Tech Stack:** Supabase (Postgres, pg_cron, pg_net, Edge Functions en Deno con `web-push`), JS vanilla con módulos ES, service worker.

**Spec:** `docs/superpowers/specs/2026-11-13-jugador-avisos-y-panel-design.md` (pieza 2).

## Global Constraints

- Textos de avisos sin cifras ni datos de salud (se ven en la pantalla bloqueada).
- Recordatorios a las 08:00 (peso) y 22:00 (cierre), hora de Madrid; el jugador puede apagarlos.
- Sin claves nuevas: se reutilizan `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `PULSO_NOTIFY_SECRET` ya configuradas en Supabase para `pulso-notify`.
- Xavi ejecuta el SQL y despliega la función a mano (sin CLI con sesión): cada entrega se deja en el portapapeles y se abre Supabase en su Safari.
- Cada cambio de la app sube `?v=` y `CACHE` de `jugador/` (ahora `v3` → `v4`).

---

### Task 1: SQL 06 (tablas, funciones, cron)

**Files:**
- Create: `supabase/sql/06_jugador_avisos.sql`

**Interfaces:**
- Produces (funciones con token, `grant execute` a `anon, authenticated`):
  - `jug_push_alta(p_token text, p_endpoint text, p_p256dh text, p_auth text) returns void`
  - `jug_push_baja(p_token text, p_endpoint text) returns void`
  - `jug_avisos_guardar(p_token text, p_recordatorios boolean) returns void`
  - `jug_avisos_estado(p_token text, p_endpoint text) returns jsonb` → `{suscrito: boolean, recordatorios: boolean}`
- Produces (tablas): `jug_push_subs(id, jugador_id, endpoint unique, p256dh, auth, creado)`, `jug_avisos(jugador_id pk, recordatorios default true)`.

- [ ] **Step 1: Escribir el SQL** (contenido completo en el archivo; ver Task 1 del repositorio).
- [ ] **Step 2: Comprobar que las funciones existen tras ejecutarlo** con la clave de servicio: cada una responde `enlace no válido` con un token falso.
  Run: `python3 -c "…api('POST','/rest/v1/rpc/jug_avisos_estado',{'p_token':'x','p_endpoint':null})"`
  Expected: `P0001 enlace no válido` (si dice que la función no existe, el SQL no se ha ejecutado).
- [ ] **Step 3: Commit** `git add supabase/sql/06_jugador_avisos.sql && git commit`.

### Task 2: Edge Function `jugador-notify`

**Files:**
- Create: `supabase/functions/jugador-notify/index.ts`

**Interfaces:**
- Consumes: tablas de Task 1 más `jug_jugadores`, `jug_pesos`, `jug_cierres`.
- Produces: `POST /functions/v1/jugador-notify` con cabecera `x-pulso-secret`.
  - `{tipo:"manual", titulo:string(≤60), texto:string(≤160), ids?:uuid[]}` → `{enviados, borrados, jugadores}`
  - `{tipo:"recordatorios", forzar?:"peso"|"cierre"}` → `{enviados, borrados, jugadores}` o `{nada:true}` fuera de las 08:00 y 22:00.

- [ ] **Step 1: Escribir la función** (archivo completo en el repositorio).
- [ ] **Step 2: Comprobar que compila con Deno si está disponible** (`deno check`), o revisar con `node --check` el TypeScript transpilado. Si no hay Deno, la comprobación real es la llamada de Task 5.
- [ ] **Step 3: Commit.**

### Task 3: App del jugador

**Files:**
- Create: `jugador/js/avisos.js`
- Modify: `jugador/js/config.js`, `jugador/js/datos.js`, `jugador/js/perfil.js`, `jugador/sw.js`, `jugador/index.html`, `jugador/styles.css`

**Interfaces:**
- Consumes (`datos.js`): `pushAlta(sub)`, `pushBaja(endpoint)`, `avisosEstado(endpoint)`, `avisosGuardar(recordatorios)`.
- Produces (`avisos.js`): `soportaAvisos(): boolean`, `suscripcionLocal(): Promise<PushSubscription|null>`, `activarAvisos(): Promise<PushSubscription>` (lanza `Error` con mensaje para el jugador), `desactivarAvisos(): Promise<void>`.
- Produces (`sw.js`): manejadores `push` y `notificationclick`.

- [ ] **Step 1: Prueba con arnés local.** Arnés en `/tmp` con `window.supabase` simulado y `navigator.serviceWorker` sin push: la tarjeta «Avisos» debe mostrar el aviso de «este navegador no admite avisos» sin lanzar errores.
- [ ] **Step 2: Implementar** `avisos.js`, `datos.js`, tarjeta en `perfil.js`, `config.js` (VAPID pública de Pulso) y manejadores del `sw.js`; añadir `avisos` a la lista de módulos precacheados del `sw.js`.
- [ ] **Step 3: Subir `v3` → `v4`** en `sw.js` e `index.html`.
- [ ] **Step 4: Ejecutar el arnés** y comprobar 0 errores en consola.
- [ ] **Step 5: Commit** (sin push hasta Task 5).

### Task 4: Jugador de prueba

**Files:**
- Modifica la base de datos (no el repositorio): una fila en `jug_jugadores` «Prueba (Xavi)».

- [ ] **Step 1: Crear el jugador** con la clave de servicio (`POST /rest/v1/jug_jugadores`) y guardar su enlace en `Nutricion/enlaces_jugadores.csv` (ignorado por git).
- [ ] **Step 2: Comprobar** que `jug_cargar` con su token devuelve el perfil.

### Task 5: Entrega a Xavi y prueba de extremo a extremo

- [ ] **Step 1:** Copiar el SQL 06 al portapapeles y abrir el editor SQL en Safari; Xavi lo ejecuta.
- [ ] **Step 2:** Copiar `jugador-notify` al portapapeles y abrir el editor de Edge Functions; Xavi la pega y despliega.
- [ ] **Step 3:** Publicar la app (`git push`) y esperar a Pages.
- [ ] **Step 4:** Xavi abre el enlace de prueba en su iPhone, añade la app a la pantalla de inicio y pulsa «Activar avisos».
- [ ] **Step 5:** Enviar un aviso `manual` al jugador de prueba con `curl` y comprobar que llega. Después `recordatorios` con `forzar`.
- [ ] **Step 6:** Actualizar `CLAUDE.md` de `Nutricion/` y la memoria.

## Self-review

- Spec: tablas, funciones, SW, perfil, función de envío con manual y recordatorios, cron y jugador de prueba: cubiertos por las tareas 1-5. El envío desde el panel (pieza 3) usará el mismo `POST` de Task 2.
- Nombres: `jug_push_alta/baja`, `jug_avisos_guardar/estado` coinciden entre SQL (Task 1), `datos.js` (Task 3) y la prueba (Task 1 step 2).
