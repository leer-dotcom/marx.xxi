# Encargo 3 · esquemas de un texto de *Nuevo Ciclo* #{N} (simplificado + detallado)

Una sesión por texto, en paralelo con el encargo 2. Sustituye {N}, {i} y las rutas.

Produce los dos esquemas SVG de un texto del número {N} siguiendo el método de la guía:
`docs/GUIA-ANALISIS-NUEVAS-PUBLICACIONES.md`, sección 7 (léela entera: 7.1 simplificado, 7.2
detallado). Orden obligatorio: primero el simplificado, después el detallado que lo expande sin cambiar el árbol.

## Fuentes
- Notas de lectura del texto (tiene «Esquema propuesto», «Estructura argumental», «Datos y ejemplos»): `NOTAS/a{i}.md`.
- Texto íntegro con marcas `[p.N]`: el `.txt` del texto (grep para comprobar cada dato del detallado).
- Modelos de nivel simplificado (originales de la guía): `data/nuevo-ciclo/svg/n4-a*.svg`. Modelos de nivel detallado: `data/nuevo-ciclo/svg/revision/n4-a*.svg` (renderízalos con el
  renderizador para verlos). Mira al menos un par de cada nivel antes de empezar.
- Vocabulario SVG obligatorio: el de `data/DIAGRAMAS.md` si existe; resumen: viewBox
  `0 0 760 H` sin width/height; clases `sv-box|sv-box-red|sv-box-blue|sv-box-gold|sv-box-green|sv-box-ink|sv-soft`,
  `sv-line|sv-line-red|sv-line-dash`, textos `sv-t|sv-t2|sv-t3|sv-tr|sv-tb|sv-tg|sv-tgr|sv-tw`; marcador
  `<marker id="nc-n{N}a{i}-arrow" markerHeight="7" markerWidth="7" orient="auto-start-reverse" refX="9" refY="5"
  viewBox="0 0 10 10"><path d="M0 0L10 5L0 10z" class="sv-arrow"/></marker>`; un `<text>` por línea, sin tspan,
  sin colores literales (variables `var(--d-*)` sólo si es imprescindible), atributos camelCase, `role="img"` y
  `aria-label` en la raíz. Cuerpo mínimo 11 px (simplificado 12-13 px).
- Renderizador: `python tools/esquemas/render.py IN.svg OUT.png --json` (necesita Playwright; temporales en una
  carpeta de trabajo). Renderiza, mira el PNG con Read y corrige hasta que el informe de encaje quede
  vacío. Trazado ortogonal (codos) salvo que la diagonal sea la forma de la figura.

## Reglas de contenido
- Simplificado: la figura del «Esquema propuesto» de las notas; 6-15 cajas, 250-570 px; título de caja + como
  mucho una línea de cuerpo; rótulos de relación en versalitas; el nodo del autor (tesis/propuesta) destacado en
  caja negra o roja. No resume el artículo: muestra su mecanismo.
- Detallado: mismo árbol (mismas cajas, disposición, colores, flechas), cada caja con 2-5 líneas de cuerpo con
  definiciones, ejemplos, fechas y cifras del texto (comprobadas con grep, con página en el JSON); se añaden sólo
  las bandas necesarias (punto de partida, crítica de respuestas existentes, conclusión/tarea), sin mover lo que
  ya está. 700-1.600 px. Nada que no esté en el texto.
- Nombres y títulos tal como los imprime la revista. Sin la palabra «tomo» (se dice «Volumen N» para Marx XXI).

## Entregables
1. `data/nuevo-ciclo/svg/n{N}-a{i}-1.svg` (simplificado) y `data/nuevo-ciclo/svg/revision/n{N}-a{i}-1.svg` (detallado).
2. `NOTAS/meta/n{N}-a{i}.json`: JSON `{"file": "nuevo-ciclo/svg/n{N}-a{i}-1.svg", "aria_label": "una frase que describe la figura",
   "caption": "Esquema. Dos o tres frases que explican qué muestra (modelo: los caption de n4-a* en
   data/nuevo-ciclo/content.json)", "viewBox_simple": "0 0 760 H",
   "viewBox_detailed": "0 0 760 H2", "added_info": ["dato [p.N]", ...]}`.
Responde al final en 4 líneas: figura elegida, alturas, incidencias.

Comprobación de fechas: un rótulo con años («2020-2023») debe tener los dos años en el texto; si el texto no los da,
usa «desde 2019» o el año que sí aparece. Los títulos y rangos de las notas de lectura no son fuente suficiente.
