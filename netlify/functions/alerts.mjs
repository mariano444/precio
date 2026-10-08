import { cors, json, requestId } from './core.mjs';
import { saveAlert } from './persistence.mjs';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const alert = { id: requestId(), query: String(body.query || '').trim().slice(0,180), location: String(body.location || '').trim().slice(0,80), category: String(body.category || 'autos'), mode: body.mode === 'sell' ? 'sell' : 'buy', max_price: Number.isFinite(Number(body.maxPrice)) ? Number(body.maxPrice) : null, year: Number.isFinite(Number(body.year)) ? Number(body.year) : null, email: String(body.email || '').trim().slice(0,160), active: true, created_at: new Date().toISOString() };
    if (!alert.query) throw new Error('Ingresá qué querés buscar.');
    if (!alert.email || !alert.email.includes('@')) throw new Error('Ingresá un email válido.');
    const saved = await saveAlert(alert);
    return { ...json(201, { ok: true, alert, persistence: saved.persisted ? 'supabase' : 'none', message: saved.persisted ? 'Alerta guardada.' : 'Alerta recibida. Configurá Supabase para persistencia.' }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  } catch (err) {
    return { ...json(400, { error: err?.message || 'No se pudo crear la alerta.' }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  }
};
