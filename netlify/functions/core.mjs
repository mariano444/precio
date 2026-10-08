import { MercadoLibreSource, SerperSource, dedupe } from '../../src/sources.mjs';
import { analyze } from '../../src/engine.mjs';

const env = process.env;

const sources = [
  new MercadoLibreSource({
    siteId: env.SITE_ID || 'MLA',
    limit: env.MAX_RESULTS_PER_SOURCE || 40,
    timeout: env.REQUEST_TIMEOUT_MS || 10000
  }),
  new SerperSource({
    apiKey: env.SERPER_API_KEY || '',
    limit: 25,
    timeout: 12000
  })
];

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanInput(body = {}) {
  return {
    query: String(body.query || '').trim().slice(0, 180),
    location: String(body.location || '').trim().slice(0, 80),
    category: String(body.category || 'autos'),
    mode: body.mode === 'sell' ? 'sell' : 'buy',
    maxPrice: safeNumber(body.maxPrice),
    year: safeNumber(body.year),
    km: safeNumber(body.km)
  };
}

export async function performSearch(rawInput) {
  const input = cleanInput(rawInput);
  if (!input.query) throw new Error('Ingresá qué querés buscar.');
  const results = await Promise.allSettled(
    sources.map(s => s.search(input).catch(() => []))
  );
  let items = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const sourceHealth = sources.map((s, i) => ({
    id: s.id,
    name: s.name,
    ok: results[i]?.status === 'fulfilled',
    count: results[i]?.status === 'fulfilled' ? results[i].value.length : 0,
    configured: s.id !== 'web-search' || !!env.SERPER_API_KEY
  }));

  items = dedupe(items);
  const analysis = analyze(items, input);
  return { input, generatedAt: new Date().toISOString(), sourceHealth, ...analysis };
}

export function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

export function requestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization'
  };
}
