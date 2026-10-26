# Encargo 4 · mapa del número y mapas de colección tras el #{N}

Dos sesiones (mapa del número; arco + transversal), después de aplicar las enmiendas a los JSON. Sustituye {N}.

Hay que producir, en dos niveles (simplificado y detallado), tres esquemas de colección de *Nuevo Ciclo* actualizados
con el número {N}. Lee primero `docs/GUIA-ANALISIS-NUEVAS-PUBLICACIONES.md` §7.3-7.5 y el vocabulario
SVG del encargo 3. Renderizador: `python tools/esquemas/render.py IN.svg OUT.png --json`; informe de encaje vacío obligatorio; mira cada PNG con Read.

Fuentes de contenido (ya actualizadas con el #{N} por `aplicar_enmiendas.py`): `data/nuevo-ciclo/content.json` (campo `cross_volume`:
`arc`, `map`, `theses` , y el volumen nuevo con `conclusions`, `relations`, `articles`) y la sección «Mapa
conceptual del número» de `NOTAS/numero{N}-cierre.md`.

Modelos de estilo (respétalos: mismas bandas, colores, leyenda, clave de artículos):
- el mapa del número anterior y los mapas de colección vigentes: simplificados en `data/nuevo-ciclo/svg/`, detallados
  en `data/nuevo-ciclo/svg/revision/`.

Entregables (mismos nombres que los modelos; marcadores con prefijo `nc-`):
1. `numero-{N}-mapa.svg`: nodo raíz = ángulo del #{N}; 10 nodos-concepto y nodo rojo de propuesta tal como los
   describe el cierre; todas las aristas con rótulo y números de artículo; título literal «Nuevo Ciclo #{N}»;
   leyenda; clave de los seis textos (número → autor y título corto). Simplificado (nodo = título + 1 línea,
   ~550-650 px) y detallado (nodo = título + 2-3 líneas con las ideas que lo sostienen, aristas con artículos,
   ~1.000-1.200 px). Escribe además `NOTAS/meta/numero-{N}-mapa.json` con `{"caption": "Mapa conceptual.
   …"}` al estilo de los captions de `concept_map` de los números anteriores en content.json.
2. `arco-coleccion.svg`: el existente más UNA caja para el #{N} (título literal «Nuevo Ciclo #{N}», ángulo según
   `cross_volume.arc.caption`, temas del subtítulo del número, autores en el detallado), conservando todo lo que ya
   tiene; si cinco cajas no caben en una fila con cuerpo ≥ 11 px, pasa a dos filas. Ambos niveles.
3. `mapa-transversal.svg`: el existente con las tesis enmendadas: la tesis 11 nueva (ciclo progresista cerrado
   como revolución pasiva → ciclo reaccionario) con su caja en la banda que le corresponda; los textos de las
   cajas de las tesis 1, 4, 7 y 9 matizadas recogen el matiz en una línea; los rótulos «#1 · #2 · #3 · #4» de cada
   caja añaden «#5» donde el campo `where` de la tesis lo diga. Nada se elimina. Ambos niveles.

Salida: simplificados en `data/nuevo-ciclo/svg/`, detallados en `data/nuevo-ciclo/svg/revision/`. Trabaja
esquema a esquema (los dos niveles y, si procede, el JSON) antes de pasar al siguiente. Responde en 6 líneas.

Mapa de la biblioteca (`mapa-biblioteca.svg`, ambos niveles): no lo rehagas; añade en cada caja de la fila COYUNTURA la
línea «… (#{N})» con lo que el número aporta a esa columna y crece la caja lo necesario (en el #005 bastó con 32 px).
Altura orientativa del mapa del número: con 10 nodos y ~18 aristas rotuladas no baja de 900 px en el simplificado.
