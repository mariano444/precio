import { cors, json } from './core.mjs';
import { listSearches } from './persistence.mjs';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  try {
    const result = await listSearches();
    return { ...json(200, result), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  } catch (err) {
    return { ...json(500, { error: err?.message || 'Error inesperado' }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  }
};
