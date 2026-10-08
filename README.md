[README.md](https://github.com/user-attachments/files/33217370/README.md)
# PrecioReal — real-only

Metabuscador para Argentina orientado a comparar publicaciones reales y estimar precio de mercado.

## Fuentes reales
- Mercado Libre Argentina mediante su API oficial.
- Serper como fuente opcional de descubrimiento web.

No se generan publicaciones sintéticas ni resultados demo.

## Mercado Libre
La integración acepta `ML_ACCESS_TOKEN` o `MERCADOLIBRE_ACCESS_TOKEN` como variable de entorno. La documentación vigente de Mercado Libre muestra el uso de autenticación OAuth en sus APIs y recomienda scopes mínimos de solo lectura para aplicaciones que únicamente consultan datos.

Los tokens deben permanecer en el backend y nunca en el JavaScript público.

## Ejecutar
Node.js 20+:

```bash
npm start
```

## Netlify
```text
Publish directory: public
Functions directory: netlify/functions
```

## Importante
Sin `ML_ACCESS_TOKEN` válido, PrecioReal no simula resultados: informa el error de la fuente y devuelve cero publicaciones reales.
