import { cors, json } from './core.mjs';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  return { ...json(200, { ok: true, app: 'PrecioReal', version: '1.1.0', time: new Date().toISOString() }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
};
