import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv, safeNumber } from './utils.mjs';
import { JsonStore } from './store.mjs';
import { MercadoLibreSource, SerperSource, dedupe } from './sources.mjs';
import { analyze } from './engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let env = {};
try { env = parseEnv(await fs.readFile(path.join(root, '.env'), 'utf8')); } catch {}
for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;

const PORT = Number(env.PORT || 3000);
const store = new JsonStore(path.join(root, 'data'));
await store.init();

const sources = [
  new MercadoLibreSource({ siteId: env.SITE_ID || 'MLA', limit: env.MAX_RESULTS_PER_SOURCE || 40, timeout: env.REQUEST_TIMEOUT_MS || 10000 }),
  new SerperSource({ apiKey: env.SERPER_API_KEY, limit: 25, timeout: 12000 })
].filter(Boolean);

const genericUrls = safeJson(env.GENERIC_SEARCH_URLS, []);
if (Array.isArray(genericUrls) && genericUrls.length) {
  // reservado para futuras fuentes; el adapter JSON-LD puede incorporarse acá.
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function cleanInput(body) {
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

async function performSearch(input) {
  if (!input.query) throw new Error('Ingresá qué querés buscar.');
  const sourceResults = await Promise.allSettled(
    sources.map(s => s.search(input).catch(() => []))
  );
  let items = sourceResults.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const sourceHealth = sources.map((s, i) => ({ id: s.id, name: s.name, ok: sourceResults[i]?.status === 'fulfilled', count: sourceResults[i]?.status === 'fulfilled' ? sourceResults[i].value.length : 0 }));

  items = dedupe(items);
  const analysis = analyze(items, input);
  return { input, generatedAt: new Date().toISOString(), sourceHealth, ...analysis };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, { ok: true, app: 'PrecioReal', version: '1.0.0', time: new Date().toISOString() });
    }
    if (req.method === 'GET' && url.pathname === '/api/sources') {
      return json(res, 200, { sources: sources.map(s => ({ id: s.id, name: s.name, configured: s.id !== 'web-search' || !!env.SERPER_API_KEY })) });
    }
    if (req.method === 'POST' && url.pathname === '/api/search') {
      const input = cleanInput(await readBody(req));
      const result = await performSearch(input);
      await store.push('searches.json', { id: cryptoRandom(), ...input, createdAt: result.generatedAt, resultCount: result.count, median: result.market.median }, 100);
      return json(res, 200, result);
    }
    if (req.method === 'GET' && url.pathname === '/api/searches') {
      return json(res, 200, { searches: await store.read('searches.json', []) });
    }
    if (req.method === 'POST' && url.pathname === '/api/alerts') {
      const payload = await readBody(req);
      const body = cleanInput(payload);
      const email = String(payload.email || '');
      const alert = { id: cryptoRandom(), ...body, email: email.slice(0, 160), createdAt: new Date().toISOString(), active: true };
      await store.push('alerts.json', alert, 200);
      return json(res, 201, { ok: true, alert });
    }
    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    return json(res, 400, { error: err?.message || 'Error inesperado' });
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
async function serveStatic(req, res, url) {
  let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  if (pathname.includes('..')) return json(res, 403, { error: 'Forbidden' });
  const file = path.join(root, 'public', pathname);
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    const data = await fs.readFile(path.join(root, 'public', 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(data);
  }
}

function cryptoRandom() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
function safeJson(v, fallback) { try { return JSON.parse(v); } catch { return fallback; } }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (req.method === 'GET') return serveStatic(req, res, url);
  json(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => console.log(`PrecioReal corriendo en http://localhost:${PORT}`));
