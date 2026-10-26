# tools/esquemas · renderizar y comprobar esquemas como los ve la web

`render.py ESQUEMA.svg SALIDA.png [--dark] [--json]` envuelve el SVG con `data/diagram.css` y la Alegreya de
`fonts/` (woff2 de Fontsource, licencia OFL, la misma de `data/licenses/`), hace una captura a 760 px y lista:
textos que se salen de su caja (margen 7 px), fuera del viewBox, sobre una línea o flecha, solapados, y cuerpos
menores de 9,5 px. `batch.py CARPETA SALIDA` hace lo mismo con todos los SVG de una carpeta y escribe
`SALIDA/_informe.json`.

Necesita Playwright con Chromium: `pip install playwright` y `playwright install chromium`. A diferencia de
`ajustar_esquemas.py`, no corrige nada: es el informe con el que se revisaron los 89 esquemas en octubre de 2026 y
los 20 del #005. Un esquema está listo cuando el informe queda vacío y el PNG se ha mirado.
