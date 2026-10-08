import { cors, json, performSearch, requestId } from './core.mjs';
import { saveSearch } from './persistence.mjs';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await performSearch(body);
    const record = { id: requestId(), query: result.input.query, location: result.input.location, category: result.input.category, mode: result.input.mode, max_price: result.input.maxPrice, year: result.input.year, result_count: result.count, median: result.market.median, created_at: result.generatedAt };
    const persistence = await saveSearch(record).catch(() => ({ persisted: false }));
    const out = { ...result, persistence: persistence.persisted ? 'supabase' : 'none' };
    return { ...json(200, out), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  } catch (err) {
    return { ...json(400, { error: err?.message || 'Error inesperado' }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
  }
};
