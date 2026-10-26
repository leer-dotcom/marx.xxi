# Cómo incorporar nuevas publicaciones, tesis y análisis

Este documento explica el método editorial con el que se construyeron las guías de *Marx XXI* y *Nuevo Ciclo* y la
síntesis de la biblioteca, y cómo mantenerlo cuando aparezca un número nuevo (el #005 de Nuevo Ciclo, un sexto
tomo de Marx XXI o una tercera publicación). La extracción del texto desde los PDF está detallada en `tools/extraccion/EXTRACCION.md`. Complementa al `README.md`, que cubre la parte mecánica (importar,
comprobar, publicar). Aquí se trata de lo que va antes: cómo se lee, se sintetiza y se decide qué cambia en las
tesis. El criterio de contenido en detalle (preguntas de lectura, qué cuenta como conclusión o tesis, conceptos puente,
qué debe contener cada esquema en sus dos niveles, simplificado y detallado) está en
`GUIA-ANALISIS-NUEVAS-PUBLICACIONES.md`, y el contenido vigente que se enmienda, en `ESTADO-DE-LA-SINTESIS.md`.

## 1. La idea: capas que se generan unas a partir de otras

Todo el contenido de `data/` está organizado en capas, y cada capa se produce a partir de la anterior sin volver a
la fuente original. Esa es la clave para que añadir un número no obligue a releerlo todo.

| Capa | Qué es | De dónde sale | Cuánto cuesta |
|---|---|---|---|
| 0 · Texto íntegro | `texto/<id>.json`: el artículo completo, estructurado por bloques y notas | PDF | Extracción semiautomática |
| 1 · Notas de lectura | Por texto: resumen (3 párrafos), estructura argumental, esquema sugerido, conceptos, cita literal con página, conclusión, interlocutores | Lectura íntegra del texto | **La única capa que exige leer el PDF** |
| 2 · Síntesis del número | Conclusiones del número (8-10), relaciones entre sus textos (8-12), mapa conceptual, referencias cruzadas | Las notas del número + las *síntesis* (no las notas) de los números anteriores | Una pasada sin PDF |
| 3 · Tesis de la publicación | `cross_volume.theses`: las 10-11 tesis transversales de la revista | Las tesis vigentes + las conclusiones del número nuevo | Una pasada sin PDF, por enmienda |
| 4 · Síntesis de la biblioteca | `library-synthesis.json`: tesis comunes (principio → aplicación), alineación, conceptos puente, aportes exclusivos | Las tesis y los glosarios de todas las publicaciones | Una pasada sin PDF, por enmienda |

Regla general: **cada capa sólo lee la capa inmediatamente inferior**, y las capas 3 y 4 se *enmiendan*, nunca se
regeneran desde cero. Si se regeneraran cada trimestre, cada número nuevo arrastraría las tesis hacia su propio
tema (el #004 las habría llevado hacia la coacción y la ley; el #003 hacia el fascismo) y se perdería la
continuidad que hace útil la síntesis.

## 2. Procedimiento para un número nuevo (tal como se hizo con el #005)

El #005 (septiembre de 2026) fue el primer número integrado con este método, el 26 de octubre de 2026. Lo que sigue
es el procedimiento tal como quedó después de hacerlo, con los scripts (`tools/nuevo_numero/`) y los encargos tipo
(`docs/briefs/`) que salieron de esa primera integración. La sección 6 recoge lo aprendido.

### Paso 1 · Texto y notas de lectura (con lectura íntegra)

1. Extraer el texto del PDF con `tools/extraccion/` y dejar los `data/nuevo-ciclo/texto/n{N}-aM.json` (formato de
   `data/texto/FORMATO.md`). En Nuevo Ciclo una página del PDF es una página impresa.
2. `python tools/nuevo_numero/texto_a_txt.py N DESTINO` convierte esos JSON en `.txt` planos con marcas `[p.N]` y las
   notas al pie al final: es lo que leen las sesiones de notas (y lo que se guarda en `../Marx XXI/txt/nc-art/`).
   Aviso: sólo hay marca en las páginas donde empieza un bloque; las ocupadas por una tabla o una figura no la dejan,
   y las sesiones infieren esas páginas por las notas al pie. Las tablas pueden aparecer volcadas dentro de una nota.
3. Escribir las notas de lectura de los seis textos con el formato de `docs/PLANTILLA-NOTAS.md` ampliado con los dos
   apartados que pide el encargo `docs/briefs/01-notas.md`: «Datos y ejemplos» (con página, alimentan el esquema
   detallado) y «Posición en el arco» (qué tesis confirma, matiza o discute). Reglas que no se negocian: citas entre
   «» literales, comprobadas con una búsqueda en el `.txt`, y con página; autores y títulos tal cual los imprime la
   revista (en el #005: «D. Martínez», «L. Fernández», y una serie que cambia de firma entre entregas); los resúmenes
   explican, no copian; nada se inventa. Una entrevista sigue el mismo formato.

Esta es la parte cara y es local: seis sesiones en paralelo, una por texto, con el `.txt`, la plantilla y el
`ESTADO-DE-LA-SINTESIS.md` para situar el texto. En el #005 cada una tardó entre dos y cinco minutos de agente.

### Paso 2 · Síntesis del número (sin PDF)

Con las notas del #005 y, como contexto, las **conclusiones y mapas** de los números anteriores (no sus notas; con
`data/nuevo-ciclo/content.json` basta), redactar:

- las conclusiones del número (8-10 tesis en negrita con los textos que las sostienen),
- las relaciones entre sus artículos (8-12, señalando también discrepancias y matices),
- el mapa conceptual del número (nodos = conceptos, aristas = artículos que desarrollan la relación),
- las referencias cruzadas (`cross_refs`) hacia Marx XXI y hacia números anteriores, con tres tipos: `cita` (el
  texto cita explícitamente al otro), `tema` (mismo objeto sin cita) y `autor` (misma persona). Las de tipo `cita`
  se encuentran mecánicamente buscando «Marx XXI», «Nuevo Ciclo» y los títulos en las notas al pie del texto.

Una comprobación útil al terminar: cada conclusión del número debe poder señalar al menos dos textos. Si sólo
tiene uno, es la conclusión de un artículo, no del número.

En la práctica (`docs/briefs/02-sintesis.md`) la misma sesión entrega, además, el ángulo y el subtítulo del número,
los «Datos del número» y las tres tablas que necesita el paso siguiente: decisión tesis por tesis sobre las de la
publicación, decisión sobre las tesis comunes con la frase de «aplicación» que añade el número, y la lista de
conceptos puente (ya puente / nuevo puente / exclusivo). Hacerlo todo en una pasada, con las notas delante, salió
mejor que repartirlo: las decisiones son coherentes entre sí y el script del paso 3 las aplica sin reinterpretar.
Las discrepancias internas del número (en el #005, Cirera contra Navarro, Tauste y Martínez sobre la fase del
ciclo) van como conclusión propia, como arista discontinua del mapa y como matiz de la tesis que tocan.

Con las notas listas se lanzan también, en paralelo, las sesiones de esquemas (`docs/briefs/03-esquema.md`, una por
texto): simplificado primero, desde el «Esquema propuesto», y detallado después; cada una entrega los dos SVG y un
JSON con `aria_label`, `caption` y `viewBox` que el paso 3 lee.

### Paso 3 · Enmienda de las tesis de la publicación (sin PDF)

Tomar las diez tesis vigentes de Nuevo Ciclo (`cross_volume.theses`) y las conclusiones del #005, y decidir
**tesis por tesis**, dejando constancia de la decisión:

| Decisión | Cuándo | Qué se hace |
|---|---|---|
| **Confirmada** | El número aporta nuevos ejemplos de una tesis ya formulada | Se añade el número y los autores al campo `where`; el texto de la tesis no cambia |
| **Matizada** | El número obliga a precisar, ampliar o corregir la formulación | Se reescribe el `text` (no el `title`, salvo error) y se anota el motivo |
| **Nueva** | Aparece una afirmación que ninguna tesis recoge y que sostienen **al menos dos textos** del número, o un texto del número y uno anterior | Se añade al final; no se reordenan las existentes |
| **Sin cambios** | El número no la toca | Nada; que una tesis no aparezca en un número es información, no un problema |

Dos límites: una tesis nueva necesita dos apoyos (una idea brillante de un solo artículo es una conclusión de
número, no una tesis de la publicación), y una tesis existente no se elimina nunca por el hecho de que los últimos
números no la mencionen (el horizonte de la asociación de productores libres sigue siendo tesis de Marx XXI
aunque Nuevo Ciclo apenas lo toque).

Mecánica: `python tools/nuevo_numero/notas_a_json.py N NOTAS --mes AAAA-MM [--issn … --pages …]` convierte las
notas, el cierre y los JSON de los esquemas en la entrada del número (`NOTAS/out/volume.json`), y
`python tools/nuevo_numero/aplicar_enmiendas.py N NOTAS --alinear T=C` aplica esa entrada y las tablas del cierre a
`content.json`, `library-synthesis.json`, `files.json` y `library.json`. La alineación de una tesis nueva con una
tesis común (`--alinear 11=5` en el #005) la decide quien integra: la tabla no la trae. Después hay que retocar a
mano cuatro textos de `cross_volume` que nombran los números (`arc.caption`, `lede`, `map.caption`, `colophon`) y
la `description` de Nuevo Ciclo en `library.json`.

El mapa transversal de la publicación se rehace a partir de las tesis resultantes (`docs/briefs/04-mapas.md`): la
tesis nueva recibe caja en su banda, las matizadas una línea con el matiz y todas las cajas el «#N» en su rótulo.

### Paso 4 · Enmienda de la síntesis de la biblioteca (sin PDF)

Mismo procedimiento sobre `library-synthesis.json`, con dos entradas más:

- **Alineación**: si en el paso 3 nació una tesis nueva de Nuevo Ciclo, decidir con qué tesis común se alinea (campo
  `nuevo_ciclo_theses` de la tesis común) o si abre una tesis común nueva. Si es nueva, su `status` empieza como
  «aplicación de Nuevo Ciclo» y sólo pasa a «común» cuando algún texto de Marx XXI la sostenga.
- **Conceptos puente**: comparar el glosario del número nuevo con el de Marx XXI por término normalizado (el script
  de `tools/build_synth.py` del traspaso lo hace; la lista hay que revisarla a mano, porque «hegemonía» en Gramsci
  y en Wallerstein no son el mismo concepto). Los términos que ya figuran como puente ganan un artículo más; los
  nuevos se añaden con su nota; los que sólo tiene el número nuevo van a `only_nuevo_ciclo`.

La columna «aplicación» de cada tesis común es el lugar natural donde entra el número nuevo: una frase que diga qué
coyuntura trabaja bajo ese principio y quién la firma.

### Paso 5 · Versionar y publicar

- `content_version` en `nuevo-ciclo/content.json` y `library_synthesis_version` en `library-synthesis.json` pasan a
  la fecha del cambio. Conviene añadir en cada tesis enmendada un campo `revised` con la fecha y el número que la
  motivó, y en las nuevas `added`; la web ignora los campos que no conoce, así que se pueden añadir sin tocar código.
- Desde el #005 la fuente de verdad es `data/` directamente: **no ejecutar `tools/importar_nuevo_ciclo.py`**, que
  sobrescribiría `data/nuevo-ciclo/` con el traspaso antiguo (cuatro números). Si se quiere conservar el traspaso
  como copia, copiar hacia él, no desde él.
- Comprobar los esquemas con `python tools/esquemas/batch.py data/nuevo-ciclo/svg SALIDA` (y la carpeta
  `revision/`): renderiza con Alegreya como la web y lista textos fuera de caja, sobre líneas o solapados.
- `python tools/estado_sintesis.py` regenera `docs/ESTADO-DE-LA-SINTESIS.md`; después `publicar.bat` (ver README).

## 3. Qué pasa con un tomo nuevo de Marx XXI o una tercera publicación

Un tomo nuevo de Marx XXI sigue exactamente los pasos 1-5, con la diferencia de que los tomos 1 y 2 tienen dos
páginas de libro por página de PDF y de que los tomos sí llevan presentación editorial (que se resume en
`presentation`; Nuevo Ciclo no la tiene y no se inventa).

Una tercera publicación es una entrada más en `data/library.json` con el mismo esquema de `content.json`; la
síntesis de la biblioteca ganaría una columna en la alineación y un tercer origen en los conceptos puente. El
esquema ya lo admite (`publications` es una lista); el código de la web habría que revisarlo donde da por supuestas
dos publicaciones (`synthesisView`).

## 4. Controles de calidad que conviene mantener

- **Citas**: toda cita entre «» de las notas se comprueba contra el texto íntegro antes de pasar al JSON (una
  búsqueda literal basta). Si no aparece, se corrige o se elimina; no se parafrasea entre comillas.
- **Nombres**: autores y títulos se copian de la revista. En el #004 el índice decía «Albert Toscano» y la entrevista
  «Alberto Toscano»; se deja constancia en `data_notes` y se elige una forma para la ficha de autor.
- **Apoyos**: conclusiones de número con ≥ 2 textos; tesis de publicación con ≥ 2 apoyos; conceptos puente con al
  menos un artículo en cada publicación.
- **Ids**: `n{N}-a1…n{N}-a6`; `cross_refs` sólo apunta a ids existentes (`tools/build.py` lo comprueba).
- **Fechas y cifras de los esquemas**: cada año o cifra de un rótulo se busca en el `.txt`; lo que no está se
  retira o se reformula («desde 2019»).
- **Sin Markdown en los JSON**: ni asteriscos ni guiones de lista en resúmenes, píldoras o conceptos.
- **Lo que no se hace**: regenerar las tesis desde cero; poner títulos temáticos a los números (son «Nuevo Ciclo
  #00N»); inventar presentaciones; «mejorar» resúmenes ya aprobados al tocar otra cosa; ejecutar
  `importar_nuevo_ciclo.py` sobre un `data/` que ya va por delante del traspaso.

## 5. Cómo repartir el trabajo con Claude

El método está pensado para que cada paso quepa en una sesión y no dependa de recordar las anteriores:

Los encargos tipo están en `docs/briefs/` (índice en su `README.md`); el reparto que se usó en el #005:

- Encargo 1 (notas): una sesión por texto, en paralelo, con el `.txt`, la plantilla y el estado de la síntesis. Es
  la única que lee el texto entero.
- Encargo 2 (síntesis): una sesión con las seis notas y `docs/ESTADO-DE-LA-SINTESIS.md`. Entrega conclusiones,
  relaciones, mapa en texto, referencias cruzadas, datos y las tres tablas de decisión (tesis de la publicación,
  tesis comunes, puentes), que se revisan antes de aplicarlas con el script.
- Encargo 3 (esquemas): una sesión por texto, en paralelo con la anterior, que dibuja el simplificado desde el
  «Esquema propuesto» de las notas y después el detallado con el mismo árbol (criterios en la guía, §7). Cada
  esquema tiene dos niveles: `svg/` (simplificado) y `svg/revision/` (detallado), con el mismo nombre de archivo.
- Encargo 4 (mapas): dos sesiones, cuando los JSON ya están enmendados: el mapa del número; el arco, el transversal
  y el mapa de la biblioteca.

Guardar las notas de lectura y el cierre (`../app-handoff-nuevo-ciclo/notes/numeroN.md`) y los `.txt`
(`../Marx XXI/txt/nc-art/`): son la memoria del proyecto y lo que permite que una sesión futura trabaje sin volver
al PDF.

## 6. Lo aprendido integrando el #005 (26-10-2026)

**Lo que funcionó.** Seis sesiones de notas en paralelo con un encargo cerrado; una sola sesión de síntesis que
entrega conclusiones, relaciones, mapa en texto, referencias cruzadas y las tres tablas de decisión; seis sesiones
de esquemas en paralelo con la de síntesis; dos sesiones de mapas al final, cuando los JSON ya están enmendados. En
total, unas tres horas de pared, la mayor parte en los esquemas. Los scripts de `tools/nuevo_numero/` reproducen
exactamente lo que se hizo a mano, así que el #006 debería costar la mitad.

**Lo que hubo que corregir sobre la marcha, y ahora está en los encargos.**
- Un esquema puso «Gobierno PSOE-UP (2020-2023)» tomando los años de las notas; el texto sólo dice «tras la
  repetición electoral de noviembre de 2019». Regla: los años de un rótulo tienen que estar en el texto; las notas
  no son fuente suficiente (encargo 3).
- Las notas y el cierre llevan cursivas y negritas en Markdown; `content.json` no las admite (los números anteriores
  no tienen un solo asterisco). `notas_a_json.py` las limpia; la primera versión del número se subió con cuatro.
- El cierre proponía «ola rosa (1998-2015)»; el texto no fija 2015. Mismo criterio que arriba.
- La tabla de tesis comunes no dice con qué tesis común se alinea una tesis nueva de la publicación; se añadió a la
  plantilla del encargo 2 y como opción `--alinear` del script.
- Al añadir artículos a un puente existente, el script etiquetaba los tres con el nombre compuesto del puente; se
  dejó a mano «Ejército industrial de reserva migrante» para n5-a3. Conviene que el cierre dé el término exacto de
  cada artículo (encargo 2).
- El mapa del número salió más alto de lo previsto (913 px en el simplificado): con diez nodos y dieciocho aristas
  rotuladas no cabe menos. Se acepta; la alternativa sería menos aristas, y las aristas son las conclusiones.
- `mapa-biblioteca.svg` necesitó una línea más por caja de coyuntura y 32 px; la versión de 790 px de ancho que
  había en `svg/` no daba de sí y se sustituyó por la de 760 (mismos textos). Un número nuevo no añade columna.
- La página de créditos (depósito legal, ISSN, paginación total) no viene en los textos extraídos; la ficha del
  #005 lleva el ISSN de la revista y `deposito_legal: null`. Conviene extraerla con el PDF.
- `content.json` espera por artículo `text_file` y `word_count` además de `source_text_file`/`words_txt` (los
  cuatro, por compatibilidad); `concept_map` lleva `viewBox`; las entrevistas llevan `author` «Entrevista con X ·
  preguntas de la redacción», `interviewee` X y `quote.source` «X, entrevista en Nuevo Ciclo #00N (p. N)». Todo lo
  hace `notas_a_json.py`.
- `files.json` debe listar los SVG y los textos nuevos (los de `revision/` no); `aplicar_enmiendas.py` lo hace.

**Lo que no cambió y conviene no cambiar.** Las tesis se enmendaron, no se regeneraron: del #005 salieron cuatro
matices y una tesis nueva con cuatro apoyos, no un juego de tesis nuevo. Las conclusiones se escribieron con los
autores por nombre y con dos textos como mínimo. Y los esquemas simplificados siguieron saliendo del «Esquema
propuesto» de las notas, con el detallado después: cuando el plano está bien escrito, el dibujo es ejecución.
