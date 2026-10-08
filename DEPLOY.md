# Despliegue recomendado

## Netlify (esta versión)

1. Subí todo el proyecto al repositorio de GitHub.
2. En Netlify elegí el repo.
3. Branch: `main`.
4. Base directory: vacío.
5. Build command: vacío.
6. Publish directory: `public`.
7. Functions directory: `netlify/functions`.
8. Deploy.

Variables recomendadas en Netlify:
- `SITE_ID=MLA`
- `MAX_RESULTS_PER_SOURCE=40`
- `REQUEST_TIMEOUT_MS=10000`
- `SERPER_API_KEY` (opcional, para búsquedas web adicionales)
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (recomendado para guardar alertas e histórico)

## Supabase

Ejecutá `SUPABASE.sql` en el SQL Editor. La clave `SUPABASE_SERVICE_ROLE_KEY` debe estar solamente en variables de entorno del servidor/Functions.

## Local

`npm start` mantiene el servidor Node tradicional.


### Importante: solo resultados reales
La versión actual no incluye fallback de demostración. Si las fuentes reales no devuelven publicaciones, la aplicación mostrará que no se encontraron resultados reales en lugar de inventar o simular publicaciones.
