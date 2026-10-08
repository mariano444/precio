import { clamp, median, percentile, normalizeText, tokenize } from './utils.mjs';

export function scoreSimilarity(item, query) {
  const q = new Set(tokenize(query));
  const t = new Set(tokenize(item.title));
  if (!q.size) return 1;
  let hit = 0;
  for (const token of q) if (t.has(token)) hit++;
  return hit / q.size;
}

export function analyze(items, { query, mode = 'buy', maxPrice = null, year = null, km = null } = {}) {
  const priced = items.filter(x => Number.isFinite(x.price) && x.price > 0);
  const comparable = priced
    .map(item => ({ ...item, similarity: scoreSimilarity(item, query) }))
    .filter(x => x.similarity >= 0.25 || priced.length <= 12);

  const prices = comparable.map(x => x.price);
  const med = median(prices);
  const p25 = percentile(prices, 0.25);
  const p75 = percentile(prices, 0.75);
  const p10 = percentile(prices, 0.10);
  const p90 = percentile(prices, 0.90);
  const lower = p25 ?? med;
  const upper = p75 ?? med;

  const decorated = comparable.map(item => {
    const diffPct = med ? ((item.price - med) / med) * 100 : 0;
    let opportunity = clamp(Math.round(50 - diffPct * 2.7), 0, 100);
    if (maxPrice && item.price <= maxPrice) opportunity += 8;
    if (item.similarity >= 0.6) opportunity += 8;
    opportunity = clamp(opportunity, 0, 100);
    const label = opportunity >= 80 ? 'Excelente oportunidad' : opportunity >= 62 ? 'Buena oportunidad' : opportunity >= 45 ? 'Precio de mercado' : 'Por encima del mercado';
    return { ...item, marketDiffPct: Number(diffPct.toFixed(1)), opportunity, label };
  }).sort((a,b) => b.opportunity - a.opportunity || a.price - b.price);

  const recommendedBuy = med ? med * 0.97 : null;
  const fastSale = med ? med * 0.94 : null;
  const recommendedSale = med ? med * 0.99 : null;
  const maxReasonable = med ? med * 1.07 : null;

  return {
    count: decorated.length,
    market: {
      median: round(med), p10: round(p10), p25: round(p25), p75: round(p75), p90: round(p90), lower: round(lower), upper: round(upper),
      recommendedBuy: round(recommendedBuy), fastSale: round(fastSale), recommendedSale: round(recommendedSale), maxReasonable: round(maxReasonable)
    },
    insights: buildInsights({ mode, med, lower, upper, maxPrice, count: decorated.length, year, km }),
    results: decorated
  };
}

export function buildInsights({ mode, med, lower, upper, maxPrice, count, year, km }) {
  if (!med) return ['No hubo suficientes publicaciones con precio numérico para estimar el mercado.'];
  const insights = [];
  insights.push(`${count} publicaciones comparables con precio fueron consideradas.`);
  insights.push(`El rango central del mercado se ubica cerca de ${formatMoney(lower)} a ${formatMoney(upper)}.`);
  if (mode === 'buy' && maxPrice) insights.push(maxPrice >= med ? 'Tu presupuesto cubre aproximadamente el precio mediano del mercado.' : 'Tu presupuesto está por debajo del precio mediano; conviene priorizar oportunidades y alertas.');
  if (mode === 'sell') insights.push(`Para vender más rápido, el algoritmo usa un pequeño descuento respecto de la mediana y luego podés ajustarlo.`);
  if (year) insights.push(`El año solicitado (${year}) se usa como señal cuando el dato está disponible en el anuncio.`);
  if (km) insights.push(`El kilometraje (${km.toLocaleString('es-AR')} km) se incorpora como dato de comparación cuando la fuente lo publica.`);
  return insights;
}

export function round(v) { return v == null ? null : Math.round(v); }
export function formatMoney(v) { return v == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v); }
