import { analyze } from './engine.mjs';
import { demoItems } from './demo.mjs';
const r = analyze(demoItems, { query:'Toyota Corolla 2021', location:'Córdoba', mode:'buy', maxPrice:25000000, year:2021 });
if (!r.count || !r.market.median || !r.results.length) throw new Error('Smoke test failed');
console.log(JSON.stringify({ count:r.count, median:r.market.median, recommendedBuy:r.market.recommendedBuy, top:r.results[0].title }, null, 2));
