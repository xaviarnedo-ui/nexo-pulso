import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Sin sesión de Supabase: cada jugador se identifica con el token de su enlace personal (?t=...).
// Las tablas no son legibles con la clave pública; todo pasa por funciones que exigen el token.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const CLAVE = 'pulso-jugador-token';
let token = null;

export function leerToken() {
  const t = new URLSearchParams(location.search).get('t');
  try { if (t) localStorage.setItem(CLAVE, t); token = t || localStorage.getItem(CLAVE); } catch (e) { token = t; }
  return token;
}
const ok = ({ data, error }) => { if (error) throw error; return data; };
const rpc = (fn, args) => sb.rpc(fn, { p_token: token, ...args }).then(ok);

export const cargar = () => rpc('jug_cargar', {});
export const guardarFormulario = resp => rpc('jug_guardar_formulario', { p_resp: resp });
export const guardarPeso = (fecha, kg) => rpc('jug_guardar_peso', { p_fecha: fecha, p_kg: kg });
export const empezarAyuno = inicio => rpc('jug_ayuno_empezar', { p_inicio: inicio });
export const romperAyuno = (inicio, fin) => rpc('jug_ayuno_romper', { p_inicio: inicio, p_fin: fin });
export const guardarCheck = (fecha, habito, hecho) => rpc('jug_guardar_check', { p_fecha: fecha, p_habito: habito, p_hecho: hecho });
export const guardarCierre = (fecha, c) => rpc('jug_guardar_cierre', { p_fecha: fecha, p_menu: c.menu, p_hambre: c.hambre, p_energia: c.energia, p_sueno: c.sueno, p_nota: c.nota || '' });
export const editarAyunoActual = inicio => rpc('jug_ayuno_editar_actual', { p_inicio: inicio });
export const editarAyuno = (viejo, inicio, fin) => rpc('jug_ayuno_editar', { p_inicio_viejo: viejo, p_inicio: inicio, p_fin: fin });
export const borrarAyuno = inicio => rpc('jug_ayuno_borrar', { p_inicio: inicio });
const clavesPush = s => { const j = s.toJSON(); return { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }; };
export const pushAlta = s => rpc('jug_push_alta', clavesPush(s));
export const pushBaja = endpoint => rpc('jug_push_baja', { p_endpoint: endpoint });
export const avisosEstado = endpoint => rpc('jug_avisos_estado', { p_endpoint: endpoint || null });
export const avisosGuardar = recordatorios => rpc('jug_avisos_guardar', { p_recordatorios: recordatorios });
