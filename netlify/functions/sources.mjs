import { cors, json } from './core.mjs';
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  return { ...json(200, { sources: [
    { id: 'mercadolibre', name: 'Mercado Libre', configured: true },
    { id: 'web-search', name: 'Web (Serper)', configured: !!process.env.SERPER_API_KEY }
  ] }), headers: { ...cors(), 'content-type': 'application/json; charset=utf-8' } };
};
