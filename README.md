# Marx XXI · lector web

Versión web (PWA) del lector de *Marx XXI*: textos íntegros de los cinco volúmenes, con resúmenes, argumento, esquemas,
conceptos, glosario, tesis comunes y búsqueda. Es HTML, CSS y JavaScript sin dependencias ni paso de compilación,
y se puede publicar directamente en GitHub Pages.

## Estructura

```
index.html              estructura de la página
css/app.css             diseño inspirado en marxxxi.com (Alegreya, verde #2c332f, color por volumen) + temas sepia/oscuro/negro
js/app.js               rutas (#/…) y vistas: inicio, volumen, artículo, tesis, glosario, búsqueda, marcadores, ajustes
js/reader.js            modo lectura
js/data.js              carga de datos, búsqueda y almacenamiento local (localStorage)
sw.js                   service worker: funciona sin conexión tras la primera visita
manifest.webmanifest    instalación como app («Añadir a pantalla de inicio»)
data/                   contenidos (fuente única): content.json, svg/ y texto/ (textos íntegros estructurados, ver texto/FORMATO.md)
lanzar.bat              construir + servidor local sin caché (depuración)
publicar.bat            construir + commit + push (publica en GitHub Pages)
tools/build.py          comprueba y actualiza data/files.json; --release renueva la versión de la caché y de los datos
tools/dev_server.py     servidor local sin caché
tools/make_icons.py     genera los PNG del icono
.github/workflows/      publicación automática en GitHub Pages
```

## Contenidos

`data/` es la única fuente de los contenidos: ya no hay app Android ni paso de conversión. Para corregir un texto,
un esquema o la guía, edita directamente el archivo en `data/` (`texto/<id>.json`, `svg/…`, `content.json`) y publica
con `publicar.bat`, que comprueba que no falte nada y renueva la caché para que los móviles reciban los cambios.

## Rutas

`#/` inicio · `#/volumen/1[/pestaña]` · `#/articulo/t1-a1[/pestaña]` · `#/leer/t1-a1[?b=bloque]` · `#/leer/tomo-1`
(presentación) · `#/tesis` · `#/glosario` · `#/buscar?q=…` · `#/marcadores` · `#/ajustes` · `#/acerca`

Los enlaces se pueden compartir: `…/#/leer/t3-a2?b=40` abre ese texto en ese párrafo.

## Probar en local

Doble clic en **`lanzar.bat`**. Comprueba que no falte nada
(textos, esquemas, archivos del service worker) y abre la web en http://127.0.0.1:8765. El servidor no usa caché:
basta con recargar el navegador para ver cualquier cambio.

```bash
lanzar.bat
```

Variante: `lanzar.bat 8080` (otro puerto). Antes de arrancar cierra los servidores de Marx XXI anteriores; si el puerto lo usa otro programa no lo toca y usa el siguiente libre. La consola también
muestra la dirección para abrirla desde el móvil en la misma wifi.

Sin el `.bat`: `python tools/build.py` y después `python tools/dev_server.py`.

## Publicar en GitHub Pages

La carpeta ya es un repositorio git (rama `main`) con un flujo de GitHub Actions (`.github/workflows/pages.yml`)
que comprueba y publica la web en cada `push`.

**Primera vez:**

1. Identidad en git, si no está configurada:
   ```bash
   git config --global user.name "Tu nombre"
   ```
   ```bash
   git config --global user.email "tu@correo"
   ```
2. Crea un repositorio vacío en GitHub (sin README), por ejemplo `marx-xxi`, y enlázalo:
   ```bash
   git remote add origin https://github.com/USUARIO/marx-xxi.git
   ```
3. En GitHub: *Settings* → *Pages* → *Build and deployment* → *Source*: **GitHub Actions**.

**Cada publicación:** doble clic en **`publicar.bat`**. Construye y comprueba, renueva la versión de la caché
offline (para que quien tenga la app instalada reciba los cambios), pide una descripción, hace commit y `push`.
En uno o dos minutos la web estará en `https://USUARIO.github.io/marx-xxi/` (la pestaña *Actions* muestra el progreso).

Solo se publica la web (`index.html`, `css/`, `js/`, `img/`, `data/`, manifiesto y service worker); `tools/` y
este README se quedan en el repositorio.

## Notas

- Las fuentes (Alegreya, Alegreya SC, Alegreya Sans, Source Serif 4, Literata, Atkinson Hyperlegible, IBM Plex Mono) se cargan de Google Fonts;
  el service worker las guarda en caché para usarlas sin conexión.
- Los ajustes, la posición de lectura y los marcadores se guardan en el navegador (`localStorage`); no se envía nada a
  ningún servidor.
- La pantalla «Acerca de» indica que la guía es una lectura generada con IA y recoge la licencia de libre distribución
  de la revista.
