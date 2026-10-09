import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
let _uid = null;
const ok = ({ data, error }) => { if (error) throw error; return data; };

export async function sesion() { const s = ok(await sb.auth.getSession()).session; _uid = s ? s.user.id : null; return s; }
export const uid = () => _uid;
export async function pedirCodigo(email) { ok(await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })); }
export async function verificarCodigo(email, token) { const s = ok(await sb.auth.verifyOtp({ email, token, type: 'email' })).session; _uid = s.user.id; return s; }
export async function salir() { await sb.auth.signOut(); _uid = null; }

export async function leerCierres(desde) { return ok(await sb.from('cierres').select('*').gte('fecha', desde).order('fecha', { ascending: false })); }
export async function guardarCierre(fila) { ok(await sb.from('cierres').upsert({ ...fila, user_id: _uid, guardado: new Date().toISOString() }, { onConflict: 'user_id,fecha' })); }
export async function leerAyunoActual() { return ok(await sb.from('ayuno_actual').select('*').maybeSingle()); }
export async function empezarAyuno(inicio) { ok(await sb.from('ayuno_actual').upsert({ user_id: _uid, inicio }, { onConflict: 'user_id' })); }
export async function romperAyuno(inicio, fin) {
  const horas = Math.round((new Date(fin) - new Date(inicio)) / 36e3) / 100;
  ok(await sb.from('ayunos').upsert({ user_id: _uid, inicio, fin, horas }, { onConflict: 'user_id,inicio' }));
  ok(await sb.from('ayuno_actual').delete().eq('user_id', _uid));
}
export async function leerAyunos(desde) { return ok(await sb.from('ayunos').select('*').gte('inicio', desde).order('inicio', { ascending: false })); }
export async function ultimoResumen() { return ok(await sb.from('resumenes').select('*').order('semana', { ascending: false }).limit(1).maybeSingle()); }
export async function leerAjustes() {
  const a = ok(await sb.from('ajustes').select('*').maybeSingle());
  return a || ok(await sb.from('ajustes').upsert({ user_id: _uid, avisos: false }, { onConflict: 'user_id' }).select().single());
}
export async function guardarAjustes(cambios) { return ok(await sb.from('ajustes').update(cambios).eq('user_id', _uid).select().single()); }
export async function guardarSuscripcion(s) {
  const j = s.toJSON();
  ok(await sb.from('push_subs').upsert({ user_id: _uid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent }, { onConflict: 'endpoint' }));
}
export async function borrarSuscripcion(endpoint) { ok(await sb.from('push_subs').delete().eq('endpoint', endpoint)); }
