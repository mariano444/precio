export const demoItems = [
  ['Toyota Corolla XEI 2.0 CVT 2021', 23800000, 'Córdoba', 2021, 74000],
  ['Toyota Corolla XEI 2.0 CVT 2021', 24150000, 'Córdoba Capital', 2021, 86000],
  ['Toyota Corolla XLI 2.0 CVT 2021', 22900000, 'Villa Carlos Paz', 2021, 92000],
  ['Toyota Corolla SEG 2.0 CVT 2021', 25400000, 'Córdoba', 2021, 61000],
  ['Toyota Corolla XEI 2.0 2021', 22100000, 'Río Cuarto', 2021, 105000],
  ['Toyota Corolla 2.0 XEI CVT 2021', 24700000, 'Córdoba', 2021, 69000],
  ['Toyota Corolla XLI 2021', 23350000, 'Córdoba', 2021, 99000],
  ['Toyota Corolla XEI 2021 CVT', 23690000, 'Carlos Paz', 2021, 78000],
  ['Toyota Corolla 2.0 2021', 26300000, 'Córdoba', 2021, 52000],
  ['Toyota Corolla XEI 2021', 21850000, 'Córdoba', 2021, 118000]
].map((x, i) => ({ source: 'demo', sourceName: 'Datos demo', id: `demo-${i+1}`, title: x[0], price: x[1], currency: 'ARS', permalink: '#', thumbnail: null, condition: 'used', seller: 'Fuente demo', location: x[2], year: x[3], km: x[4], raw: {} }));
