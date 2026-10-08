# PrecioReal — MVP funcional

Metabuscador para Argentina orientado a responder dos preguntas:

1. ¿Dónde está el producto/vehículo más conveniente ahora?
2. ¿El precio que me ofrecen está caro, normal o es una oportunidad?

## Qué incluye

- Frontend responsive en HTML/CSS/JS puro.
- Backend Node.js sin dependencias externas.
- Conector real para la API pública de búsqueda de Mercado Libre (sitio MLA).
- Arquitectura de adaptadores para sumar nuevas fuentes sin tocar el motor de precios.
- Conector opcional para Serper.dev (descubrimiento web).
- Fallback demo local para mantener la UX disponible cuando una fuente no responde.
- Normalización de títulos y atributos.
- Detección de duplicados aproximados.
- Cálculo de mediana, percentiles, rango razonable y precio recomendado.
- Índice de oportunidad 0–100.
- Modo COMPRA / VENTA.
- Filtro por localidad, precio, año y kilometraje cuando los datos están disponibles.
- Alertas guardadas en JSON.
- Historial básico de búsquedas.
- Health check y panel de fuentes.

## Ejecutar

Requisitos: Node.js 20+.

```bash
cd precio-real
npm start
```

Abrí http://localhost:3000

## Variables

Copiá `.env.example` a `.env`. No es imprescindible para el conector público de Mercado Libre.

Para cargas adicionales vía Serper:

```env
SERPER_API_KEY=tu_api_key
```

## Importante sobre "todos los sitios"

No existe una API universal que entregue legal y técnicamente todas las publicaciones de Internet. Cada portal puede tener API, feed, sitemap, páginas públicas, protección anti-bot o condiciones diferentes. PrecioReal usa adaptadores independientes para que se incorporen fuentes de forma controlada.

La integración preferida es API oficial cuando existe; para crawlers públicos deben respetarse robots.txt, límites de frecuencia y condiciones de cada sitio.

Mercado Libre documenta endpoints de búsqueda y recomienda OAuth/credenciales seguras para recursos que requieren autorización. Ver documentación oficial: https://developers.mercadolibre.com.ar/

## Próxima evolución de producción

- PostgreSQL/Supabase en lugar de JSON local.
- Cola de crawling y tareas programadas.
- Playwright workers para fuentes permitidas que no tengan API.
- Hash/fingerprint avanzado para duplicados.
- Catálogo de vehículos con versiones/trim y equivalencias.
- Histórico de precios por publicación.
- Login/usuarios y alertas por WhatsApp/email.
- Monetización por PRO, concesionarias y leads.
