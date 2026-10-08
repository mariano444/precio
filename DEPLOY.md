# Publicar PrecioReal

## Render

1. Subí este repositorio a GitHub.
2. En Render, elegí New Web Service y conectá el repositorio.
3. Con Dockerfile incluido, Render detecta el servicio.
4. Si querés búsqueda web adicional, cargá `SERPER_API_KEY` como variable secreta.
5. `GET /api/health` sirve como health check.

## Producción recomendada

El MVP usa JSON local para no obligar a instalar una base de datos. En una publicación seria, migrá `searches.json` y `alerts.json` a Supabase/Postgres y agregá un worker/cron para actualizar históricos y alertas.
