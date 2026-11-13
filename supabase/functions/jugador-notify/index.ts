// Edge Function "jugador-notify" (Pulso · Jugador). Desplegar con: npx supabase functions deploy jugador-notify --no-verify-jwt
// (o pegarla en el editor de Edge Functions de Supabase). La protege x-pulso-secret, el mismo que pulso-notify.
// Tipos: "manual" (lo llama el panel del entrenador) y "recordatorios" (lo llama pg_cron cada hora: 08:00 peso, 22:00 cierre, hora de Madrid).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails('https://xaviarnedo-ui.github.io/nexo-pulso/jugador/', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
const SECRETO = Deno.env.get('PULSO_NOTIFY_SECRET')!;
const ZONA = 'Europe/Madrid';

// Sin cifras ni datos de salud: se ven en la pantalla bloqueada.
const TEXTOS = {
  peso: { title: 'Tu peso de hoy', body: 'Apúntalo antes de desayunar.', url: './#hoy' },
  cierre: { title: 'Cierre del día', body: 'Medio minuto y listo.', url: './#hoy' },
};
const TTL = { peso: 4 * 3600, cierre: 4 * 3600, manual: 12 * 3600 };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

function local() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const hora = Number(p.hour);
  const hoy = `${p.year}-${p.month}-${p.day}`;
  const d = new Date(`${hoy}T12:00:00Z`);
  if (hora < 5) d.setUTCDate(d.getUTCDate() - 1);                       // de madrugada todavía cuenta el día anterior
  return { hora, hoy, fechaCierre: d.toISOString().slice(0, 10) };
}

async function enviar(jugadorIds: string[], texto: object, ttl: number) {
  if (!jugadorIds.length) return { enviados: 0, borrados: 0, jugadores: 0 };
  const { data: subs, error } = await sb.from('jug_push_subs').select('*').in('jugador_id', jugadorIds);
  if (error) throw error;
  let enviados = 0, borrados = 0;
  const con = new Set<string>();
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(texto), { TTL: ttl });
      enviados++; con.add(s.jugador_id);
    } catch (e) {
      const { statusCode: c, body } = e as { statusCode?: number; body?: unknown };
      if (c === 404 || c === 410) { await sb.from('jug_push_subs').delete().eq('id', s.id); borrados++; }
      else console.error('envío', s.id, c, body ?? (e as Error).message);
    }
  }
  return { enviados, borrados, jugadores: con.size };
}

async function activos(): Promise<string[]> {
  const { data, error } = await sb.from('jug_jugadores').select('id').eq('activo', true);
  if (error) throw error;
  return (data ?? []).map((j) => j.id as string);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (req.headers.get('x-pulso-secret') !== SECRETO) return json({ error: 'unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  try {
    if (body.tipo === 'manual') {
      const titulo = String(body.titulo ?? '').trim().slice(0, 60), texto = String(body.texto ?? '').trim().slice(0, 160);
      if (!titulo || !texto) return json({ error: 'falta titulo o texto' }, 400);
      const validos = await activos();
      const ids = Array.isArray(body.ids) ? validos.filter((id) => body.ids.includes(id)) : validos;
      return json(await enviar(ids, { title: titulo, body: texto, url: './#hoy' }, TTL.manual));
    }
    if (body.tipo === 'recordatorios') {
      const { hora, hoy, fechaCierre } = local();
      const que: 'peso' | 'cierre' | null = body.forzar === 'peso' || body.forzar === 'cierre' ? body.forzar : hora === 8 ? 'peso' : hora === 22 ? 'cierre' : null;
      if (!que) return json({ nada: true });
      const todos = await activos();
      const { data: apagados, error: e1 } = await sb.from('jug_avisos').select('jugador_id').eq('recordatorios', false);
      if (e1) throw e1;
      const off = new Set((apagados ?? []).map((a) => a.jugador_id as string));
      const tabla = que === 'peso' ? 'jug_pesos' : 'jug_cierres', fecha = que === 'peso' ? hoy : fechaCierre;
      const { data: hechos, error: e2 } = await sb.from(tabla).select('jugador_id').eq('fecha', fecha);
      if (e2) throw e2;                                                   // sin saber quién ya lo ha hecho, mejor no avisar
      const ya = new Set((hechos ?? []).map((a) => a.jugador_id as string));
      return json(await enviar(todos.filter((id) => !off.has(id) && !ya.has(id)), TEXTOS[que], TTL[que]));
    }
    return json({ error: 'tipo' }, 400);
  } catch (e) { return json({ error: String((e as Error).message ?? e) }, 500); }
});
