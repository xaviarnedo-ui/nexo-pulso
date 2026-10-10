// Edge Function "pulso-notify" (NEXO Pulso). Desplegar con: npx supabase functions deploy pulso-notify --no-verify-jwt
// La protege x-pulso-secret. Tipos: "cierre" (lo llama pg_cron cada hora) y "resumen" (lo llama motor/pulso.py subir --avisar).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails('https://xaviarnedo-ui.github.io/nexo-pulso/', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
const SECRETO = Deno.env.get('PULSO_NOTIFY_SECRET')!;

// Sin cifras ni datos de salud: se ven en la pantalla bloqueada.
const TEXTOS = {
  cierre: { title: 'Cierre del día', body: '¿Cómo ha ido hoy?', url: './#hoy' },
  resumen: { title: 'NEXO Pulso', body: 'Tu resumen semanal está listo', url: './#hoy' },
};

// Caducidad de cada aviso (s): si el móvil no lo recibe a tiempo, ya no vale. El del cierre muere antes del corte de las 05:00.
const TTL = { cierre: 4 * 3600, resumen: 2 * 86400 };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

function local(zona: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const hora = Number(p.hour);
  const d = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
  if (hora < 5) d.setUTCDate(d.getUTCDate() - 1);                       // cierre de madrugada = día anterior
  return { hora, fechaCierre: d.toISOString().slice(0, 10) };
}

async function enviar(userIds: string[], texto: object, ttl: number) {
  if (!userIds.length) return { enviados: 0, borrados: 0 };
  const { data: subs, error } = await sb.from('push_subs').select('*').in('user_id', userIds);
  if (error) throw error;
  let enviados = 0, borrados = 0;
  for (const s of subs ?? []) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(texto), { TTL: ttl }); enviados++; }
    catch (e) {
      const { statusCode: c, body } = e as { statusCode?: number; body?: unknown };
      if (c === 404 || c === 410) { await sb.from('push_subs').delete().eq('id', s.id); borrados++; }
      else console.error('envío', s.id, c, body ?? (e as Error).message);
    }
  }
  return { enviados, borrados };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (req.headers.get('x-pulso-secret') !== SECRETO) return json({ error: 'unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  try {
    if (body.tipo === 'resumen' && body.user_id) return json({ ...(await enviar([body.user_id], TEXTOS.resumen, TTL.resumen)), usuarios: 1 });
    if (body.tipo === 'cierre') {
      const { data: aj, error } = await sb.from('ajustes').select('user_id, hora_aviso, zona').eq('avisos', true);
      if (error) throw error;
      const pendientes: string[] = [];
      for (const a of aj ?? []) {
        try {                                                             // un usuario con datos malos no tumba al resto
          const { hora, fechaCierre } = local(a.zona);
          if (hora !== a.hora_aviso && !body.forzar) continue;
          const { count, error: e2 } = await sb.from('cierres').select('fecha', { count: 'exact', head: true }).eq('user_id', a.user_id).eq('fecha', fechaCierre);
          if (e2) { console.error('cierres', a.user_id, e2.message); continue; }   // sin saber si hay cierre, mejor no avisar
          if (!count) pendientes.push(a.user_id);
        } catch (e) { console.error('usuario', a.user_id, (e as Error).message ?? e); continue; }
      }
      return json({ ...(await enviar(pendientes, TEXTOS.cierre, TTL.cierre)), usuarios: pendientes.length });
    }
    return json({ error: 'tipo' }, 400);
  } catch (e) { return json({ error: String((e as Error).message ?? e) }, 500); }
});
