import { normalizeText, safeNumber, tokenize } from './utils.mjs';

export class MercadoLibreSource {
  constructor(config = {}) {
    this.id = 'mercadolibre';
    this.name = 'Mercado Libre';
    this.base = 'https://api.mercadolibre.com';
    this.siteId = config.siteId || 'MLA';
    this.limit = Number(config.limit || 40);
    this.timeout = Number(config.timeout || 10000);
  }

  async search({ query, location = '', maxPrice = null }) {
    const params = new URLSearchParams({ q: query, limit: String(this.limit) });
    if (maxPrice) params.set('price', `0-${Math.round(maxPrice)}`);
    const url = `${this.base}/sites/${this.siteId}/search?${params}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'PrecioReal/1.0' }, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return (json.results || []).map((x) => ({
        source: this.id,
        sourceName: this.name,
        id: x.id,
        title: x.title,
        price: safeNumber(x.price),
        currency: x.currency_id || 'ARS',
        permalink: x.permalink,
        thumbnail: x.thumbnail,
        condition: x.condition,
        seller: x.seller?.nickname || '',
        location: x.address?.city_name || x.address?.state_name || location || '',
        year: inferYear(x.title, x.attributes),
        km: inferKm(x.title, x.attributes),
        raw: { category_id: x.category_id, official_store_id: x.official_store_id, shipping: x.shipping }
      })).filter(x => Number.isFinite(x.price));
    } finally {
      clearTimeout(timer);
    }
  }
}

export class SerperSource {
  constructor(config = {}) {
    this.id = 'web-search';
    this.name = 'Web (Serper)';
    this.apiKey = config.apiKey || '';
    this.limit = Number(config.limit || 30);
    this.timeout = Number(config.timeout || 12000);
  }
  async search({ query, location = '' }) {
    if (!this.apiKey) return [];
    const body = { q: `${query}${location ? ` ${location} Argentina` : ' Argentina'}`, gl: 'ar', hl: 'es', num: this.limit };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST', headers: { 'X-API-KEY': this.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const organic = json.organic || [];
      return organic.map((r) => ({
        source: this.id,
        sourceName: this.name,
        id: r.link,
        title: r.title,
        price: extractPrice(`${r.title} ${r.snippet || ''}`),
        currency: 'ARS',
        permalink: r.link,
        thumbnail: r.thumbnail || null,
        condition: 'unknown', seller: '', location, year: inferYear(r.title), km: inferKm(r.title), raw: { snippet: r.snippet || '' }
      })).filter(x => x.price != null);
    } finally { clearTimeout(timer); }
  }
}

export class GenericSearchSource {
  constructor(config = {}) {
    this.id = config.id || 'generic';
    this.name = config.name || 'Fuente web';
    this.templates = Array.isArray(config.templates) ? config.templates : [];
    this.timeout = Number(config.timeout || 10000);
  }
  async search({ query, location = '' }) {
    const out = [];
    for (const template of this.templates.slice(0, 8)) {
      const url = template.replaceAll('{query}', encodeURIComponent(`${query} ${location}`.trim()));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'PrecioReal/1.0 (+metasearch)' }, signal: controller.signal });
        if (!res.ok) continue;
        const html = await res.text();
        out.push(...parseJsonLd(html, url, location));
      } catch { /* fuente opcional */ }
      finally { clearTimeout(timer); }
    }
    return out;
  }
}

function inferYear(title = '', attrs = []) {
  const t = String(title);
  const candidates = [t.match(/\b(20\d{2})\b/)?.[1], ...(attrs || []).filter(a => /año|year|modelo/i.test(`${a.id} ${a.name}`)).map(a => a.value_name)];
  const y = Number(candidates.find(v => /^20\d{2}$/.test(String(v))));
  return y >= 1980 && y <= new Date().getFullYear() + 1 ? y : null;
}

function inferKm(title = '', attrs = []) {
  const t = String(title).toLowerCase().replace(/\./g, '');
  const m = t.match(/(\d{1,3}(?:[ ,]\d{3})+)\s*(?:km|kms|kilometros|kilómetros)/i) || t.match(/\b(\d{5,6})\s*(?:km|kms)\b/i);
  if (m) return Number(m[1].replace(/[ ,]/g, ''));
  const a = (attrs || []).find(x => /kilometraje|mileage/i.test(`${x.id} ${x.name}`));
  return a ? safeNumber(String(a.value_name).replace(/\D/g, '')) : null;
}

function extractPrice(text = '') {
  const t = String(text).replace(/\./g, '').replace(/,/g, '.');
  const matches = [...t.matchAll(/(?:\$|ars)\s*([0-9]{2,}(?:\.[0-9]{1,2})?)/ig)].map(m => Number(m[1]));
  return matches.length ? Math.max(...matches) : null;
}

function parseJsonLd(html, baseUrl, location) {
  const results = [];
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig)];
  for (const m of scripts) {
    try {
      const data = JSON.parse(m[1].trim());
      const arr = Array.isArray(data) ? data : [data];
      for (const x of arr) {
        const offers = Array.isArray(x.offers) ? x.offers[0] : x.offers;
        const price = safeNumber(offers?.price);
        const title = x.name || x.headline;
        if (title && price) results.push({ source: 'generic', sourceName: 'Fuente web', id: x.url || baseUrl, title, price, currency: offers.priceCurrency || 'ARS', permalink: x.url || baseUrl, thumbnail: x.image?.[0] || x.image || null, location, year: inferYear(title), km: inferKm(title), raw: { type: x['@type'] } });
      }
    } catch { /* JSON-LD inválido */ }
  }
  return results;
}

export function dedupe(items) {
  const seen = new Map();
  for (const item of items) {
    const tokens = tokenize(item.title);
    const key = item.id || `${item.source}:${tokens.slice(0, 8).join('-')}:${Math.round(item.price || 0)}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}
