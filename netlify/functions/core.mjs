import { MercadoLibreSource, SerperSource, dedupe } from '../../src/sources.mjs';
import { analyze } from '../../src/engine.mjs';

const env = process.env;

const sources = [
  new MercadoLibreSource({
    siteId: env.SITE_ID || 'MLA',
    limit: env.MAX_RESULTS_PER_SOURCE || 40,
    timeout: env.REQUEST_TIMEOUT_MS || 15000,
    accessToken: env.ML_ACCESS_TOKEN || env.MERCADOLIBRE_ACCESS_TOKEN || ''
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

function sourceConfigured(source) {
  if (source.id === 'mercadolibre') return Boolean(env.ML_ACCESS_TOKEN || env.MERCADOLIBRE_ACCESS_TOKEN);
  if (source.id === 'web-search') return Boolean(env.SERPER_API_KEY);
  return true;
}

export async function performSearch(rawInput) {
  const input = cleanInput(rawInput);
  if (!input.query) throw new Error('Ingresá qué querés buscar.');

  const results = await Promise.allSettled(sources.map(s => s.search(input)));
  let items = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const sourceHealth = sources.map((s, i) => {
    const result = results[i];
    const configured = sourceConfigured(s);
    return {
      id: s.id,
      name: s.name,
      configured,
      ok: result?.status === 'fulfilled',
      count: result?.status === 'fulfilled' ? result.value.length : 0,
      error: result?.status === 'rejected' ? (result.reason?.message || 'Error de fuente') : null
    };
  });

  items = dedupe(items);
  const analysis = analyze(items, input);
  return {
    input,
    generatedAt: new Date().toISOString(),
    sourceHealth,
    realDataOnly: true,
    ...analysis
  };
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
