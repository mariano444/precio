[DEPLOY.md](https://github.com/user-attachments/files/33217361/DEPLOY.md)
# Deploy PrecioReal en Netlify

## Build
- Base directory: vacío
- Build command: vacío
- Publish directory: `public`
- Functions directory: `netlify/functions`

## Variables obligatorias para Mercado Libre
Desde el estado actual de la API de Mercado Libre, la búsqueda debe ejecutarse autenticada con OAuth. Configurá en Netlify:

`ML_ACCESS_TOKEN` = Access Token válido de tu aplicación de Mercado Libre.

El Access Token tiene una vigencia de 6 horas. Para producción conviene implementar OAuth + refresh token; esta versión ya detecta 401/403 y no oculta el error.

## Variables opcionales
`SERPER_API_KEY` habilita descubrimiento web adicional mediante Serper.
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` habilitan persistencia de búsquedas/alertas.

## Resultado
La aplicación NO tiene datos demo. Cuando una fuente falla, la UI muestra el motivo. Solo se muestran publicaciones recibidas de fuentes reales.
