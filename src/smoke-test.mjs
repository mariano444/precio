import assert from 'node:assert/strict';
import { analyze } from './engine.mjs';

const r = analyze([], { query:'Toyota Corolla 2021', location:'Córdoba', mode:'buy', maxPrice:25000000, year:2021 });
assert.equal(r.count, 0);
assert.equal(r.market.median, null);
assert.match(r.insights[0], /No hubo suficientes/);
console.log('Smoke test OK: no se generan resultados demo.');
