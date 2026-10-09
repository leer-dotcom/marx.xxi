# Cómo incorporar nuevas publicaciones, tesis y análisis

Este documento explica el método editorial con el que se construyeron las guías de *Marx XXI* y *Nuevo Ciclo* y la
síntesis de la biblioteca, y cómo mantenerlo cuando aparezca un número nuevo (el #005 de Nuevo Ciclo, un sexto
tomo de Marx XXI o una tercera publicación). Complementa al `README.md`, que cubre la parte mecánica (importar,
comprobar, publicar). Aquí se trata de lo que va antes: cómo se lee, se sintetiza y se decide qué cambia en las
tesis.

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

## 2. Procedimiento para un número nuevo (ejemplo: Nuevo Ciclo #005)

### Paso 1 · Texto y notas de lectura (con lectura íntegra)

1. Extraer el texto del PDF y trocearlo por artículo. En Nuevo Ciclo una página del PDF es una página impresa, así
   que los rangos salen del índice; conviene comprobarlos (en el #001 el índice situaba la entrevista en la p. 133 y
   empezaba en la 129).
2. Preparar el texto estructurado (`texto-estructurado-nuevo-ciclo/nc5-aM.json`) con el formato de
   `data/texto/FORMATO.md`.
3. Escribir las notas de lectura de los seis textos con el formato fijo de `docs/PLANTILLA-NOTAS.md`. Reglas que no se
   negocian: las citas entre «» son literales y llevan página; los nombres de autores y títulos van tal cual los
   imprime la revista; los resúmenes explican, no copian; no se inventan tesis ni cifras. Una entrevista sigue el
   mismo formato (el resumen recorre las preguntas y respuestas principales).

Esta es la parte cara y es local: seis textos, no veintiocho. Se puede repartir en varias sesiones (una por texto) y
cada sesión sólo necesita su texto y la plantilla.

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

El mapa transversal de la publicación se regenera a partir de las tesis resultantes: está construido como diagrama
a partir de texto (ver `tools/` de `app-handoff-nuevo-ciclo`), no dibujado a mano, así que no cuesta nada rehacerlo.

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
- `python tools/importar_nuevo_ciclo.py`, `python tools/ajustar_esquemas.py data/nuevo-ciclo/svg --aplicar`,
  `publicar.bat` (ver README). Recordar que el importador sobrescribe `data/nuevo-ciclo/`.

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
- **Ids**: `n5-a1…n5-a6` para el #005; `cross_refs` sólo apunta a ids existentes (`tools/build.py` lo comprueba).
- **Lo que no se hace**: regenerar las tesis desde cero; poner títulos temáticos a los números (son «Nuevo Ciclo
  #005»); inventar presentaciones; «mejorar» resúmenes ya aprobados al tocar otra cosa.

## 5. Cómo repartir el trabajo con Claude

El método está pensado para que cada paso quepa en una sesión y no dependa de recordar las anteriores:

- Paso 1: una sesión por texto (o por número, con un agente por texto) con `docs/PLANTILLA-NOTAS.md` y el `.txt`
  del artículo. Es la única que necesita el PDF.
- Paso 2: una sesión con las seis notas nuevas y el `content.json` actual de la publicación.
- Pasos 3-4: una sesión con las tesis vigentes, las conclusiones del número y `library-synthesis.json`; se le pide
  explícitamente la tabla de decisiones (confirmada / matizada / nueva / sin cambios) antes de ningún texto nuevo,
  para poder revisarla.
- Los diagramas: una función por texto en `diagrams.py` siguiendo el «esquema sugerido» de las notas; el motor hace
  el resto y produce los SVG con las clases `sv-*` que la web ya tematiza.

Guardar las notas de lectura (`notes/numeroN.md`) junto al traspaso: son la memoria del proyecto y lo que permite
que una sesión futura trabaje sin volver al PDF.
