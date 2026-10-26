# Guía de análisis para nuevas publicaciones

Qué hay que saber, a nivel de contenido, para incorporar un número nuevo de *Nuevo Ciclo*, un volumen nuevo de
*Marx XXI* o una tercera publicación a la biblioteca sin volver a leer todo lo anterior: cómo se lee un texto, cómo
se sintetiza un número, cómo se enmiendan las tesis, cómo se detectan conceptos puente y cómo se dibujan los esquemas
de artículo, de publicación y de colección. No trata la mecánica técnica (importar, publicar, formatos JSON), que
está en `README.md` y `ACTUALIZACION-CONTENIDOS.md`; trata el criterio.

Se apoya en dos documentos que hay que tener abiertos al trabajar:

- `ESTADO-DE-LA-SINTESIS.md`: foto fija de lo vigente (tesis de cada revista, tesis comunes, conclusiones de cada
  volumen y número, conceptos puente, arcos). Es lo que se enmienda; se regenera con `tools/estado_sintesis.py`.
- `PLANTILLA-NOTAS.md`: el formato de las notas de lectura de cada texto.

## 1. Qué es la biblioteca y cuál es su hilo

Las dos revistas son un solo proyecto editorial con dos registros. *Marx XXI* fija el **marco**: cada volumen
responde a una pregunta estratégica y presupone la anterior (qué marxismo → por qué la socialdemocracia no es
alternativa → cómo se reconstituye el sujeto, el partido → qué forma toma el poder, el Estado-Comuna → a qué
escala, la Internacional). *Nuevo Ciclo* aplica ese marco a la **coyuntura**: cada número vuelve sobre el mismo
problema (declive del capitalismo, giro autoritario, ausencia del sujeto) desde un ángulo distinto, con cinco
artículos y una entrevista a un interlocutor internacional. Todo desemboca en la misma tarea, que las dos revistas
enuncian casi con las mismas palabras: un partido comunista de masas, continental e internacional, con instituciones
propias de la clase.

Esa relación marco/coyuntura es la clave de toda la síntesis. Cuando llegue una publicación nueva, la primera
pregunta no es «de qué trata» sino **qué pregunta estratégica responde (si es un volumen) o bajo qué ángulo
vuelve sobre el problema común (si es un número)**. Todo lo demás —conclusiones, tesis, puentes, esquemas— se
ordena a partir de esa respuesta.

## 2. Cómo se lee un texto: las notas de lectura

La única capa que exige leer el texto íntegro. Para cada artículo o entrevista se redacta una ficha con el formato
de `PLANTILLA-NOTAS.md`. Las preguntas que hay que poder contestar al terminar de leer, y que las notas deben dejar
escritas, son estas (las siete primeras son contenido; la octava es el plano del esquema):

1. **Tesis central** en una frase, con la formulación del autor cuando la hay (cita literal con página).
2. **Estructura argumental**: los tres a seis pasos por los que el autor llega a la tesis. No el índice del texto,
   sino la cadena de razones: punto de partida → distinción o concepto que introduce → objeción que responde →
   conclusión. Esa cadena es lo que luego se dibuja.
3. **Conceptos**: los términos que el texto define o usa con un sentido propio (cinco a diez). Con la definición
   *del autor*, no la del diccionario; si la toma de alguien (Draper, Gramsci, Fraenkel) se dice de quién.
4. **Interlocutores**: con quién discute el texto, explícita o implícitamente (una corriente, un autor, una
   organización, un artículo anterior de la propia revista). Es lo que después alimenta relaciones y referencias
   cruzadas.
5. **Posición en el arco**: qué pregunta del volumen responde o qué ángulo del número desarrolla, y si confirma,
   matiza o discute algo dicho en un número o volumen anterior.
6. **Ejemplos y datos** que el autor usa como prueba (fechas, cifras, casos), con página. Son los que distinguen la
   versión detallada del esquema de la simplificada.
7. **Conclusión** del texto en sus propios términos (qué propone hacer, si propone algo).
8. **Esquema propuesto**: tipo de figura y rótulos exactos de los nodos (4-8) con sus relaciones; es el plano del
   esquema simplificado (§7.1).

Reglas: las citas entre «» son literales y llevan página; nombres de autores y títulos tal como los imprime la
revista; los resúmenes explican, no copian; nada se inventa (ni tesis, ni cifras, ni presentaciones editoriales
cuando no las hay). Una entrevista sigue el mismo formato: el entrevistado es el nombre principal, la estructura
recorre las preguntas, y los conceptos son los del entrevistado.

## 3. Cómo se sintetiza un volumen o un número

Con las notas de sus textos y, como contexto, sólo las conclusiones y mapas de los volúmenes/números anteriores
(no sus notas), se redactan cuatro piezas.

**Conclusiones del número (8-10).** Cada una es una frase afirmativa en negrita seguida de un párrafo que dice qué
textos la sostienen y cómo. Criterios:

- Una conclusión necesita **al menos dos textos**. Si sólo la sostiene uno, es la conclusión de un artículo y va en
  su ficha, no en las del número.
- Deben cubrir tres registros: **diagnóstico** (qué pasa y por qué), **crítica** (qué respuestas existentes no
  sirven y por qué) y **propuesta** (qué tarea se deriva). Un número sin conclusión de propuesta está mal leído;
  todas las publicaciones de la biblioteca terminan en una tarea.
- Las discrepancias entre textos también son conclusiones («los textos no coinciden en X»): es información valiosa
  para las tesis y no se alisa.
- Se nombra a los autores, no a los artículos («Miasni y Merchant», no «artículos 2 y 6»), porque los autores se
  repiten entre números y entre revistas.

**Relaciones entre textos (8-12).** Pares de textos con el concepto que los une y una frase que explica el vínculo.
Cuatro tipos: *coinciden* (misma tesis desde objetos distintos), *se complementan* (uno teoriza lo que el otro
aplica), *discrepan* (matiz o desacuerdo) y *uno cita al otro*. Conviene que cada texto aparezca al menos en una
relación; un texto sin relaciones suele indicar que no se ha entendido su lugar en el número.

**Mapa conceptual del número.** Nodos = conceptos (no artículos); aristas = relaciones, rotuladas con lo que las
une y los números de los artículos que las desarrollan. Un nodo raíz arriba (el ángulo del número), un nodo de
propuesta abajo (la tarea), y entre ambos los conceptos del diagnóstico y la crítica. Cada conclusión del número
debería poder señalarse en el mapa; si una conclusión no tiene nodo ni arista, falta algo en el mapa (fue el
defecto más frecuente de los mapas originales).

**Referencias cruzadas.** Hacia la otra revista y hacia números anteriores, de tres tipos: *cita* (el texto cita al
otro), *tema* (mismo objeto sin cita) y *autor* (misma persona). Las de tipo cita se encuentran buscando el nombre
de la revista y los títulos en las notas al pie.

## 4. Cómo se enmiendan las tesis de la publicación

Las tesis transversales (once en *Marx XXI*, diez en *Nuevo Ciclo*; texto completo en `ESTADO-DE-LA-SINTESIS.md`
§2 y §3) **no se regeneran: se enmiendan**. Si se regeneraran con cada número, cada número arrastraría las tesis
hacia su propio tema y se perdería la continuidad.

Qué hace que una afirmación sea tesis de la publicación y no conclusión de un número: que la sostengan textos de
**al menos dos volúmenes o números distintos**, y que esté formulada al nivel de la publicación (en *Marx XXI*, como
principio; en *Nuevo Ciclo*, como lectura de la coyuntura). Una idea brillante de un solo artículo es una
conclusión; una idea repetida en dos números es una tesis candidata.

Procedimiento, tesis por tesis, dejando constancia de la decisión antes de escribir nada nuevo:

| Decisión | Cuándo | Efecto |
|---|---|---|
| Confirmada | El número aporta ejemplos nuevos de una tesis ya formulada | Se añade el número y los autores a «dónde»; el texto no cambia |
| Matizada | El número obliga a precisar, ampliar o corregir | Se reescribe el texto (no el título salvo error) y se anota por qué y qué número lo motivó |
| Nueva | Afirmación que ninguna tesis recoge, con dos apoyos (dos textos del número, o uno del número y uno anterior) | Se añade al final; no se reordenan las existentes |
| Sin cambios | El número no la toca | Nada. Que una tesis no aparezca en un número es información, no un problema |

Una tesis existente no se elimina nunca porque los últimos números no la mencionen. Las tesis de *Marx XXI* sólo
cambian con un volumen nuevo de *Marx XXI*; un número de *Nuevo Ciclo* no las toca, aunque las aplique (eso se
registra en las tesis comunes, §5).

Señales de que una enmienda está mal hecha: una tesis «nueva» que repite otra con palabras del número; una tesis
«matizada» cuyo texto ya no dice lo que decía su título; más de dos tesis nuevas en un solo número (lo normal es
cero o una).

## 5. Cómo se enmienda la síntesis de la biblioteca

Las doce tesis comunes (§4 del estado) se formulan en dos tiempos: **principio** (tal como lo enuncian los
volúmenes) y **aplicación** (tal como lo desarrollan los números). Cada una lleva su alineación con las tesis de
cada revista y un estado: «común» si la sostienen las dos; «aplicación de Nuevo Ciclo» o «principio de Marx XXI»
si por ahora sólo una.

Qué hace un número nuevo aquí:

- Entra sobre todo por la columna **aplicación**: para cada tesis común que el número confirma, una frase que diga
  qué coyuntura trabaja bajo ese principio y quién la firma, y el número se añade a «dónde».
- Si en §4 nació una tesis nueva de *Nuevo Ciclo*, se decide con qué tesis común se alinea; si con ninguna, abre
  una tesis común nueva con estado «aplicación de Nuevo Ciclo», que sólo pasará a «común» cuando algún texto de
  *Marx XXI* la sostenga.
- Un volumen nuevo de *Marx XXI* hace lo simétrico: entra por la columna **principio**, y puede convertir en
  «común» una tesis que hasta ahora sólo *Nuevo Ciclo* desarrollaba.

Una tercera publicación añadiría un tercer tiempo (o un tercer registro) a cada tesis común y un tercer origen a
los conceptos puente; el método no cambia.

## 6. Cómo se detectan los conceptos puente

Un concepto puente es un término definido en las dos publicaciones (al menos un artículo en cada una) y que
significa lo mismo en ambas. Los 31 vigentes están en §7 del estado, con los artículos que los definen; los
«aportes exclusivos» de cada revista son los candidatos a puente.

Procedimiento con un número nuevo: se comparan sus conceptos (los de las notas de lectura) con el glosario de la
otra revista y con la lista de puentes.

- Término ya puente → se añade el artículo nuevo a su lista y, si el número le da un giro, se amplía la nota («de
  concepto de la crítica de la economía política a clave de la coacción actual»).
- Término presente en la otra revista pero aún no puente → nace un puente nuevo; se redacta la nota que dice qué
  une.
- Término nuevo que no está en la otra revista → va a los aportes exclusivos, con su artículo y una nota.

La trampa son los homónimos: «hegemonía» en Gramsci y en Wallerstein, «Estado dual» en Fraenkel y en el uso
coloquial, «población sobrante» como categoría económica y como descripción de Gaza. Un puente exige el **mismo
concepto**, no la misma palabra; cuando la palabra coincide y el concepto no, se anota como dos conceptos y no se
tiende el puente (o se tiende con la nota que explica el desplazamiento, si el desplazamiento es precisamente lo
que la revista hace con el término).

## 7. Cómo se dibujan los esquemas

Todos los esquemas de la biblioteca son lectura interpretativa: ordenan lo que el texto dice, no añaden nada que no
esté en él. Cada esquema existe en **dos niveles con el mismo árbol**:

- **Simplificado** (la vista por defecto): la figura que capta la tesis del texto. Es el modelo de los esquemas
  originales de la guía (`data/svg/` y `data/nuevo-ciclo/svg/`), hechos directamente desde las notas de lectura.
- **Detallado** (la vista «ver más»): la misma figura desplegada con los ejemplos, fechas, cifras y frases
  explicativas del texto (`svg/revision/`), hecha a partir del simplificado y del texto íntegro.

El orden de trabajo es **simplificado primero, detallado después**. El simplificado se dibuja desde el «esquema
propuesto» de las notas; el detallado lo expande sin cambiar su árbol. (La carpeta `svg/simplificada/`, obtenida
en octubre de 2026 reduciendo los detallados, fue una prueba en sentido inverso y no es el modelo: sale más
cargada que los originales.)

### 7.1 El esquema simplificado: cómo se hicieron los originales

**De dónde sale.** Del apartado «Esquema propuesto» de las notas de lectura (`PLANTILLA-NOTAS.md`): dos o tres
frases que fijan el **tipo de figura** y los **rótulos exactos de los nodos** (4-8) y sus relaciones. Ejemplo
real (Volumen 1, art. 1): «Un diagrama de oposición en dos columnas (Realización vs. Valorización) con sus
rasgos: causa, síntoma leído como causa, implicación política. Debajo, una cadena causal cíclica para la
valorización: competencia → innovación técnica → ↑ composición orgánica → ↓ tasa de ganancia → detención de la
acumulación → crisis → concentración → nueva fase». Si ese párrafo está bien escrito, el esquema está decidido;
el dibujo es ejecución.

**Qué figura.** Una sola figura por texto, o dos apiladas (arriba la distinción, abajo el proceso). La figura
nace de la forma del argumento, no de su índice: *dos columnas enfrentadas* cuando el autor opone dos teorías o
modelos; *cadena causal* o *ciclo* cuando describe un proceso; *línea temporal* con hitos cuando la tesis es
histórica; *matriz 2×2* cuando cruza dos criterios; *árbol o raíz común* cuando varias posiciones derivan de un
mismo error; *embudo, escalera, péndulo, tabla* cuando el autor usa esa imagen. El nodo del autor (su tesis o
propuesta) se distingue siempre: caja negra o roja, abajo o a un lado, «frente a todas ellas».

**Cuánto.** Entre 6 y 15 cajas; 250-570 px de alto (la media de los originales es 420 px, 10 cajas, 34 líneas de
texto). Si hace falta más, es que la figura no está bien elegida o que el texto pide dos figuras (como t5-a2-1 y
t5-a2-2).

**Qué lleva cada caja.** Un título que dice qué es la caja (en negrita) y, como mucho, **una línea** de cuerpo:
un ejemplo de dos a cuatro palabras, una glosa, un nombre propio. Nada de frases; nada de páginas. Los ejemplos y
datos de la estructura argumental se quedan fuera (van al detallado), salvo que la figura sea una línea temporal
(entonces las fechas son los nodos). Las relaciones se rotulan con una o dos palabras en versalitas sobre la
flecha («instrumento», «integra», «sólo distribución»); los grupos se agrupan en una banda gris con rótulo en
versalitas; una leyenda sólo cuando hay dos tipos de línea.

**Qué se deja fuera a propósito.** La crítica a los interlocutores secundarios, los matices, los datos, las citas
(salvo si la cita es el título del nodo), el contexto biográfico de una entrevista. El simplificado no resume el
artículo: muestra su mecanismo. Un lector debe poder reconstruir la tesis con la figura y la ficha; para el resto
está el detallado.

**Cómo se produjo.** Una función por texto en el generador (`tools/diagrams.py` del traspaso, con `engine.py`): una
rejilla de columnas, bandas, cajas y flechas descritas en texto, y el motor coloca, mide y escribe el SVG con las
clases `sv-*`. Es la forma más rápida de que todos los esquemas compartan geometría (ancho 760, cajas de 44-60 px,
mismas fuentes) sin dibujar a mano; para un número nuevo son seis funciones más.

### 7.2 El esquema detallado: cómo se expande el simplificado

**De dónde sale.** Del simplificado más la ficha completa del texto (estructura argumental, conceptos, ejemplos
con página) y el texto íntegro para comprobar y citar. Es la capa en la que se trabaja con el `.txt` abierto.

**Qué se conserva.** El árbol entero del simplificado: las mismas cajas, en la misma disposición relativa, con los
mismos colores, y las mismas relaciones con el mismo tipo de línea y el mismo sentido. Todo texto del simplificado
sigue presente, literal o ligeramente ampliado. Quien vea los dos esquemas debe reconocer la misma figura.

**Qué se añade.** Dentro de cada caja, dos a cinco líneas de cuerpo: la definición del autor, el ejemplo que usa
como prueba, las fechas y cifras, la cita breve si la hay; cada dato se anota con página en el registro de la
revisión. Fuera de las cajas, sólo cuando el argumento lo exige, nuevas cajas o bandas para los pasos que el
simplificado omitía: el **punto de partida** (de qué pregunta o ambigüedad arranca el autor), la **crítica de las
respuestas existentes** (lo que el texto rechaza y por qué) y la **conclusión o tarea**. Se añaden como filas o
bandas nuevas encima, entre o debajo, sin mover las cajas existentes ni cambiar el orden. Si el detallado añade
una caja que resulta esencial (un eslabón sin el cual la figura miente), el simplificado la incorpora también, en
forma breve, para que los árboles sigan coincidiendo.

**Cuánto.** Lo que haga falta: 700-1.900 px. Antes que recortar, se amplía o se divide el esquema en dos archivos.
Cuerpo de 11,5-13 px, nunca por debajo de 10.

**Trazado.** Las flechas conservan su significado; si el detallado necesita un segundo tipo de relación
(aclaración, coordinación secreta, convergencia), se añade con línea discontinua o de color y una leyenda de una
línea. Líneas ortogonales con codos, salvo que la diagonal sea la forma de la figura (arco, triángulo, embudo).
Lo que está fuera del flujo (notas, leyenda, conclusión) va en banda gris con rótulo en versalitas.

**Comprobación.** Cada dato del detallado se busca en el texto; lo que no aparece se retira (en la revisión de
2026 cayeron «Ormuz» en n3-a6 o la «meta final» de Bernstein en t2-a11). Los fallos que la revisión encontró, y
que conviene repasar en todo esquema nuevo (hoja «Hallazgos clave» de `data/svg/revision/revision-esquemas.xlsx`):
atribuir a un actor lo que el texto atribuye a otro; aplicar la fecha de un hito a otro; una flecha que entra en
el nodo equivocado; mezclar en una caja dos vertientes que el autor distingue; omitir la segunda mitad del
argumento (casi siempre la crítica de las respuestas existentes o la propuesta); cajas que nombran un concepto
sin decir qué es.

### 7.3 Mapa de volumen o número

Nodos = conceptos del número, aristas = relaciones con los números de artículo que las desarrollan. Debe poder
señalarse en él cada conclusión del número, y cada artículo debe aparecer en al menos una arista. Lleva título
literal («Nuevo Ciclo #005», «Volumen 6»), leyenda de tipos de arista y clave de artículos (número → autor y título
corto). Rojo para la convergencia en la propuesta; discontinua para causas comunes o aclaraciones. El nivel
simplificado del mapa es el original: nodo con título y una línea, aristas con rótulo breve; el detallado añade
a cada nodo las dos o tres ideas que lo sostienen y a cada arista los artículos.

### 7.4 Arco de la colección

Una caja por volumen o número, con su título literal, su pregunta estratégica (volúmenes) o su ángulo (números) y
sus temas; una flecha que dice «cada uno presupone el anterior» (volúmenes) o «todos desembocan en la misma tarea»
(números), y la caja de la tarea común. Un volumen o número nuevo es **una caja más**, con la pregunta o el ángulo
decididos en §1; si el arco ya no cabe en una fila, se pasa a dos filas, no se recorta.

### 7.5 Mapa transversal de la publicación

Se regenera a partir de las tesis vigentes tras la enmienda (§4): arriba el diagnóstico compartido, en el centro
las respuestas que la publicación rechaza y la que propone, abajo las dimensiones (sujeto, poder, escala) o las
tareas, y el horizonte. Cada tesis debe tener su caja; cada caja lleva los volúmenes o números que la sostienen.
Si una tesis se matiza, cambia el texto de su caja; si nace una, se añade una caja en la banda que le corresponda.

### 7.6 Mapa de la biblioteca

Dos filas: MARCO (un principio por volumen de *Marx XXI*) y COYUNTURA (la aplicación de los números de *Nuevo
Ciclo*), unidas columna a columna por la tesis común que las alinea, y la tarea común debajo. Un volumen nuevo es
una columna más (en seis columnas las cajas pasan a 112 px y el cuerpo a 11 px; a partir de siete conviene dos
filas por publicación); un número nuevo no añade columnas, sino que se reparte entre las cajas de coyuntura
existentes, salvo que haya abierto una tesis común nueva, que entonces estrena columna con la fila MARCO vacía
hasta que un volumen la respalde. Los textos de este mapa son los títulos cortos de las tesis comunes.

## 8. Reglas editoriales que no cambian

- Títulos de número literales: «Nuevo Ciclo #005». Sin títulos temáticos inventados. Los volúmenes de *Marx XXI*
  se llaman «Volumen N» (no «tomo») salvo dentro de citas.
- No hay editorial ni presentación en *Nuevo Ciclo*; no se inventa. En *Marx XXI* sí la hay y se resume.
- Autores y títulos tal como los imprime la revista; si la revista se contradice (índice contra interior), se elige
  una forma y se deja constancia.
- Citas literales con página; lo que no se encuentra en el texto no se entrecomilla.
- Resúmenes, conclusiones y tesis ya aprobados no se «mejoran» al tocar otra cosa.
- En las síntesis superiores: enmendar, no regenerar.
- Nunca perder información al rediseñar un esquema: si no cabe, se amplía o se divide el esquema; no se recorta.

## 9. Lista de comprobación para un número o volumen nuevo

Contenido, en orden:

1. Decidida y escrita en una frase la pregunta estratégica (volumen) o el ángulo (número).
2. Notas de lectura de todos los textos con los ocho puntos de §2; citas comprobadas contra el texto.
3. Conclusiones (8-10) con dos apoyos cada una y los tres registros (diagnóstico, crítica, propuesta).
4. Relaciones (8-12) con todos los textos representados; referencias cruzadas de los tres tipos.
5. Mapa del número con una caja o arista por conclusión y todos los artículos en alguna arista.
6. Tabla de decisiones sobre las tesis de la publicación (confirmada / matizada / nueva / sin cambios), antes de
   redactar ninguna tesis.
7. Tabla de decisiones sobre las tesis comunes; alineación de cualquier tesis nueva; columna «aplicación» (o
   «principio») actualizada.
8. Conceptos del número contrastados con los puentes y con el glosario de la otra revista; puentes nuevos con su
   nota; exclusivos anotados.
9. Esquema simplificado de cada texto desde el «esquema propuesto» de las notas (§7.1) y, después, el detallado que lo expande (§7.2), comprobado contra el texto y la lista de fallos.
10. Arco, mapa transversal y mapa de la biblioteca actualizados (una caja, una columna, o sólo texto, según §7).
11. `ESTADO-DE-LA-SINTESIS.md` regenerado con `python tools/estado_sintesis.py` (lee los tres JSON de `data/`) para que
    refleje lo vigente.

## 10. Lo que enseñó la primera integración real (#005)

El método se había escrito antes de usarse. Al aplicarlo al #005 se sostuvo en lo esencial —capas, enmienda en vez
de regeneración, simplificado antes que detallado— y pidió cuatro ajustes de criterio que ya están incorporados
arriba: la discrepancia interna como conclusión (§3); la alineación explícita de las tesis nuevas y la disonancia
registrada sin resolver (§5); el término por artículo en los puentes (§6); y los años de los rótulos tomados del
texto y no de las notas (§7.1). Dos cosas más que conviene saber. La primera: el reparto que funciona es seis
sesiones de notas en paralelo, una de síntesis que entrega también las tablas de decisión, seis de esquemas y dos
de mapas; los encargos están en `docs/briefs/` y la mecánica en `ACTUALIZACION-CONTENIDOS.md` §2 y §6. La segunda:
el número nuevo pesa en las tesis más de lo que parece mientras se lee (cuatro matices y una tesis nueva de un
solo número) y menos de lo que parecería si se regenerasen: ninguna tesis anterior cambió de título.

## 11. Qué conservar como memoria del proyecto

Lo que permite que una sesión futura trabaje sin volver a los PDF: las notas de lectura de cada texto
(`notes/`), los `content.json` de cada publicación, `library-synthesis.json`, este documento y su anexo, y la hoja
de revisión de esquemas (`data/svg/revision/revision-esquemas.xlsx`), que registra qué se añadió a cada esquema y
con qué página. Cada enmienda de tesis debería dejar en el JSON la fecha y el número que la motivó: es el historial
que explica por qué las tesis dicen lo que dicen.
