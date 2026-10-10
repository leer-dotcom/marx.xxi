# Marx XXI · lector web

Versión web (PWA) del lector de *Marx XXI*. Es una **biblioteca** con dos publicaciones del mismo proyecto editorial:
*Marx XXI* (revista-libro, cinco volúmenes) y *Nuevo Ciclo* (revista trimestral, cuatro números hasta junio de 2026).
Textos íntegros con píldoras, resúmenes, esquemas, conceptos, glosario, tesis comunes, referencias cruzadas entre las
dos revistas, síntesis de la biblioteca, índice de autores y búsqueda. Es HTML, CSS y JavaScript sin dependencias ni paso de compilación,
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
data/                   contenidos (fuente única), ver «Contenidos»
img/mxxiN.webp, ncN.webp portadas de cada volumen y número
img/nuevo-ciclo.png     isotipo de Nuevo Ciclo (portada de reserva), extraído de NC_001.pdf
lanzar.bat              construir + servidor local sin caché (depuración)
publicar.bat            construir + commit + push (publica en GitHub Pages)
tools/build.py          comprueba y actualiza data/files.json; --release renueva la versión de la caché y de los datos
tools/dev_server.py     servidor local sin caché
tools/make_icons.py     genera los PNG del icono
tools/importar_nuevo_ciclo.py  trae a data/nuevo-ciclo/ el material de ../app-handoff-nuevo-ciclo y ../texto-estructurado-nuevo-ciclo
tools/ajustar_esquemas.py      comprueba (y con --aplicar corrige) que los textos de los esquemas caben en su caja con Alegreya
docs/                   método editorial: cómo incorporar números nuevos y actualizar tesis y síntesis; plantilla de notas
.github/workflows/      publicación automática en GitHub Pages
```

## Contenidos

`data/` es la única fuente de los contenidos: ya no hay app Android ni paso de conversión. Para corregir un texto,
un esquema o la guía, edita directamente el archivo en `data/` (`texto/<id>.json`, `svg/…`, `content.json`) y publica
con `publicar.bat`, que comprueba que no falte nada y renueva la caché para que los móviles reciban los cambios.

### Biblioteca

```
data/library.json             manifiesto: publicaciones (Marx XXI, Nuevo Ciclo), etiquetas y rutas de cada una
data/content.json             Marx XXI (y el sello «build» que versiona todas las rutas de data/)
data/svg/, data/texto/        esquemas y textos íntegros de Marx XXI
data/nuevo-ciclo/content.json Nuevo Ciclo: mismo esquema + label «#001», month, type «interview», interviewee,
                              quote.page, printed_pages, data_notes, issn y cross_refs (enlaces a Marx XXI y entre números)
data/nuevo-ciclo/svg/, texto/ esquemas (ids con prefijo nc-) y textos íntegros (n1-a1.json…; bloques qn, sep y tabla)
data/nuevo-ciclo/about.json   textos de «Acerca de» propios de Nuevo Ciclo
data/library-synthesis.json   síntesis de las dos revistas: 12 tesis comunes, conceptos puente, aportes exclusivos
```

Los ids de artículo no se repiten entre publicaciones (`t…` en Marx XXI, `n…` en Nuevo Ciclo). Las portadas son
`img/mxxiN.webp` e `img/ncN.webp` (patrón `cover` de `library.json`); si falta una, se dibuja una portada genérica.
Como en Marx XXI, cada número de Nuevo Ciclo usa el color de su portada (`data-vol="n1"…` en el CSS). Su terminología
sigue la de la app («volumen», no «tomo»).

**Ficha del número** (`data_notes` de cada número de Nuevo Ciclo): notas de edición (primera edición, contacto,
licencia, paginación, autores, epígrafes, ausencia de ISSN o depósito legal…). Se conserva en `content.json` y la
mantiene el importador, pero **ya no se muestra en la app**: antes era un desplegable «Ficha del número» bajo la
cabecera de cada número (`volumeView` en `js/app.js`, clase `.vol-notes` en el CSS). Para recuperarlo, basta con
volver a pintar `v.data_notes` en esa cabecera.

Cada volumen y número lleva `url`, su ficha en la tienda oficial (marxxxi.com), que la pestaña «Texto completo» de
cada artículo enlaza como «PDF disponible en marxxxi.com». En Nuevo Ciclo la pone el importador
(`nuevo-ciclo`, `nuevo-ciclo-002`…) si los datos de origen no la traen.

**Añadir el #005:** guardar su portada como `img/nc5.webp`, dejar su guía en `../app-handoff-nuevo-ciclo/` (mismo formato: `content.json`, `svg/`,
`library-synthesis.json`) y su texto en `../texto-estructurado-nuevo-ciclo/nc5-a1.json…`, y ejecutar:

```bash
python tools/importar_nuevo_ciclo.py
```

```bash
python tools/ajustar_esquemas.py data/nuevo-ciclo/svg --aplicar
```

Ojo: el importador **sobrescribe** `data/nuevo-ciclo/`; si se ha corregido algo a mano allí, hay que llevarlo antes
a las carpetas de origen. Después, `publicar.bat` como siempre. No hace falta tocar el código.

**Nuevas tesis y análisis.** Lo anterior es la parte mecánica. Cómo se leen los textos nuevos, cómo se redactan sus
conclusiones y cómo se *enmiendan* (no se regeneran) las tesis de cada revista y la síntesis de la biblioteca está en
[`docs/ACTUALIZACION-CONTENIDOS.md`](docs/ACTUALIZACION-CONTENIDOS.md); la plantilla de las notas de lectura, en
[`docs/PLANTILLA-NOTAS.md`](docs/PLANTILLA-NOTAS.md). En resumen: sólo el número nuevo se lee íntegro; las capas
superiores (conclusiones del número, tesis de la publicación, síntesis de la biblioteca) se actualizan a partir de las
síntesis ya existentes, decidiendo tesis por tesis si el número las confirma, las matiza o aporta una nueva.

## Rutas

`#/` biblioteca · `#/marx-xxi` y `#/nuevo-ciclo` portada de cada revista · `#/volumen/1[/pestaña]` ·
`#/numero/1[/pestaña]` · `#/articulo/t1-a1[/pestaña]` · `#/articulo/n1-a6` · `#/leer/t1-a1[?b=bloque]` · `#/leer/tomo-1`
(presentación) · `#/tesis[?t=3]` · `#/tesis/nuevo-ciclo` · `#/sintesis` · `#/glosario[?p=nuevo-ciclo|puentes]` ·
`#/autores` · `#/buscar?q=…` · `#/marcadores` · `#/ajustes` · `#/acerca` · `#/creditos`

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
