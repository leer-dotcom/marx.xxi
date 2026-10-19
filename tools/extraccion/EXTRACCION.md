# Extracción del texto de las revistas (PDF → JSON estructurado)

Cómo se saca el texto de *Nuevo Ciclo* y *Marx XXI* a partir de sus PDF, con títulos, notas ancladas, citas,
tablas y saltos de página. Está escrito para que **otra sesión, otro Claude o una persona** repita el proceso
con un número nuevo y obtenga el resultado en el mismo formato que los textos ya publicados.

Contenido de esta carpeta (`tools/extraccion/`):

```
EXTRACCION.md            este documento
volcado_maqueta.py       vuelca x, y, fuente y tamaño de las líneas de unas páginas (para inspeccionar la maqueta)
nuevo_ciclo/
  extraer_nc.py          ejecutable: un PDF de Nuevo Ciclo → un JSON por texto (el que se usa normalmente)
  extract_nc.py          biblioteca: lectura de líneas, clasificación, párrafos, notas, tablas, cobertura
  qa_nc.py               revisión heurística de los JSON (minúsculas al inicio, párrafos sin cierre, muy cortos…)
marx_xxi/
  extract.py             biblioteca de Marx XXI
  run_all.py             extrae los 5 tomos (necesita data/content.json para saber los ids)
  build_final.py         convierte la salida en la entrega final (+ _indice, revision-guiones)
  qa.py                  revisión heurística
```

Requisitos: Python 3 y `pip install pymupdf`. Todo se ejecuta en local; no usa red.

---------------------------------------------------------------------------------------------------------

## 1. Principio de funcionamiento

1. `pymupdf` da cada línea con sus *spans* (fragmento con fuente, tamaño y posición).
2. Cada línea se **clasifica por fuente, tamaño y posición**: cabecera, título, subtítulo, autor, epígrafe, título
   interior, cuerpo, cita, nota al pie.
3. Las **llamadas a nota** son spans numéricos en superíndice (≤ 7,1 pt, o ≤ 0,62 × el tamaño de la línea). Se
   convierten en `[^n]`.
4. Las líneas se **juntan en párrafos** (sangría, hueco vertical, cambio de tipo), se resuelven los guiones de final
   de línea con un vocabulario del propio corpus y se marcan cursivas (`*…*`) y negritas (`**…**`).
5. Las **notas** se leen del pie de página, se numeran de forma secuencial por texto y se enlazan a su llamada.
6. Se comprueba la **cobertura**: los caracteres alfanuméricos de entrada deben ser iguales a los de salida
   (bloques + citas + notas + títulos). Un texto con cobertura distinta, o con llamadas sin nota o notas sin
   llamada, **no se da por bueno**.

## 2. Nuevo Ciclo: pasos para un número nuevo

Ejemplo con el #006, PDF `NC_006.pdf` en la carpeta `Marx XXI`.

1. **Dejar el PDF** junto a los demás (`NC_001.pdf`…). Si es un extracto (solo algunos artículos), se puede extraer
   igual, ver §2.5.
2. **Ver la maqueta** si algo parece distinto a los números anteriores:
   `python volcado_maqueta.py NC_006.pdf 1,2,3,10` (portada, índice, inicio de artículo, página interior).
   Comparar con la tabla del §3. Casi siempre solo cambia la escala (el PDF del #005 viene 1,4167 veces más grande
   que los cuatro primeros) y el programa la detecta solo.
3. **Extraer**:

   ```bash
   cd tools/extraccion/nuevo_ciclo
   python extraer_nc.py ../../../../NC_006.pdf --numero 6 \
        --salida ../../../../texto-estructurado-nuevo-ciclo \
        --vocab ../../../../NC_001.pdf ../../../../NC_002.pdf ../../../../NC_003.pdf ../../../../NC_004.pdf ../../../../NC_005.pdf
   ```

   (ajustar las rutas a donde estén). Genera `nc6-a1.json…`, actualiza `_indice.json` y reescribe
   `revision-guiones.txt`. `--vocab` mejora la decisión de unir o conservar guiones de fin de línea; conviene pasar
   todos los PDF de Nuevo Ciclo.
4. **Leer el resumen** que imprime, una línea por texto: páginas del PDF e impresas, título, autor, tipos de bloque,
   número de notas, `cobertura A/A OK`, `sin_nota []`, `sin_llamada []`. Debe cumplirse:
   - cobertura OK en todos (si pone `¡DIFIERE!`, hay texto que se ha perdido o duplicado: ver §6);
   - `sin_nota` y `sin_llamada` vacíos;
   - el aviso de «índice ≠ inicios detectados» no aparece (si aparece, falta o sobra algún inicio de artículo).
5. **Extractos parciales**: si el PDF solo trae algunos artículos, el índice habla de más de los que hay. Usar
   `--primer-articulo K` para que el primer texto del PDF se numere `ncN-aK` (así se hizo con el #005, que solo
   trae el artículo 2: `nc5-a2`). Cuando salga el número completo, **volver a extraer con el PDF completo y sin esa
   opción**, y borrar el JSON provisional.
6. **Revisión heurística**: `python qa_nc.py ../../../../texto-estructurado-nuevo-ciclo` lista párrafos que empiezan
   en minúscula, no acaban en signo de cierre o son muy cortos. Casi siempre son legítimos (continuación tras una
   cita o tabla, marcada `cont:true`); mirar los demás.
7. **Revisar a ojo lo delicado**: `revision-guiones.txt` (guiones ambiguos y cómo se resolvieron), título y subtítulo
   (si el título viene en mayúsculas se sustituye por la grafía del índice o por `capitalize()`), autor (línea
   «por X»; en entrevistas sale del subtítulo «Entrevista con X»), entrevistas (preguntas en bloque `qn`),
   tablas (`tabla`) y los niveles de los títulos interiores.
8. **Documentar**: añadir el número a `FORMATO.md` (tabla de textos) e `INFORME.md` (sección «Número N») de
   `texto-estructurado-nuevo-ciclo/`.
9. **Llevarlo a la app**: dejar también la guía en `app-handoff-nuevo-ciclo/` y ejecutar
   `python tools/importar_nuevo_ciclo.py` (ver README, «Añadir el #005», y `docs/ACTUALIZACION-CONTENIDOS.md`).
   El importador **sobrescribe** `data/nuevo-ciclo/`.

## 3. Nuevo Ciclo: reglas de maqueta (números 1–5)

Medidas de los números 1–4 (página 461,5 × 637,3 pt). El #005 está a escala ×1,4167: el programa divide tamaños y
coordenadas por `k = tamaño_cuerpo / 12`.

| Elemento | Cómo se reconoce | Resultado |
|---|---|---|
| Cabecera | y < 56 (en #005, 34,2 tras escalar; se autodetecta). Número de página en AGaramondPro-Semibold 9 + nombre del autor (pág. pares) o título (impares) | se descarta; el número da `printed_pages` |
| Título | RotundaVariable ExtraBold ≥ 19,5 | `title` |
| Subtítulo | Rotunda Bold 13,5–16,5 | `subtitle` |
| Autor | Zenon-Regular-Dark ≥ 12,5, empieza por «por » (en el #1 no hay: sale del índice) | `author` |
| Título interior | Zenon SemiBold ≥ 12,5 → nivel 2; Medium ≥ 12 o SemiBoldItalic → nivel 3; se normaliza por artículo (el nivel crudo más bajo pasa a 2) | bloque `h` |
| Cuerpo | Zenon-Book 12 | bloque `p` |
| Cita larga | tamaño ≤ 11,2 | bloque `q` |
| Epígrafe | líneas de 11 pt antes del primer cuerpo en la página de inicio | bloque `ep` (+ `cite`) |
| Fuente de cita | AGaramond ≥ 10,5 y < 50 caracteres, o línea que empieza por «— », o línea corta alineada a la derecha tras una cita | campo `cite` |
| Nota al pie | tamaño ≤ 10,2 (10 en pie; 9 dentro de citas largas en notas), empieza por «N. » | `notes` |
| Llamada | span numérico ≤ 7,1 pt (6,4–7,0; en títulos 7,6 → regla proporcional) | `[^n]` |
| Llamada «normal» | a veces la llamada va impresa como dígito normal («dual14», «político.1»): se detecta por la secuencia n−1, n+1 y se repara | `[^n]` |
| Lista | marcador `1.`, `a)`, `•`… con sangría ≥ 8 | bloque `li` (+ `marker`) |
| Entrevista | ≥ 60 % del párrafo en cursiva → pregunta (se quita la cursiva); «* * *» → separador | `qn`, `sep` |
| Tabla | página sin líneas de cuerpo con ≥ 6 líneas numéricas de 11 pt: filas reconstruidas por y; título desde «Tabla N.» | bloque `tabla` (`rows`, `caption`) |

Reglas de párrafo: párrafo nuevo si cambia el tipo, si el hueco vertical > 1,3 × interlínea en la misma página o si
la primera línea tiene sangría ≥ 10 respecto al margen izquierdo de la página (verso ≈ 64, recto ≈ 81). Si un
párrafo sigue en la página siguiente se inserta `[[pN]]` (tras la palabra completa si se unió un guion). Un párrafo
que continúa en minúscula tras `q`, `li` o `tabla` lleva `cont:true`.

## 4. Formato de salida

Un JSON por texto (`ncN-aK.json`; Marx XXI: `tN-aK.json`). Descripción completa en `FORMATO.md` de las carpetas
`texto-estructurado-nuevo-ciclo/` y `texto-estructurado/`. Resumen:

```
id, issue (o vol), number, title, subtitle, author, interview, pdf_pages [a,b], printed_pages [a,b]
blocks:  [{t:'h'|'p'|'q'|'ep'|'li'|'qn'|'sep'|'tabla', text, pg, level?, marker?, cite?, cont?, rows?, caption?}]
notes:   {"1": {text, pg}, ...}
unanchored_notes (notas sin llamada impresa), title_notes (Marx XXI)
```

Marcas dentro del texto: `*cursiva*`, `**negrita**`, `[^N]` llamada a la nota N, `[[pN]]` salto a la página impresa N.
El cargador de la app (`js/data.js`, `text()`) las convierte en caracteres privados, oculta `[[pN]]` (los datos
los conservan) y `js/reader.js` pinta cada tipo de bloque; tocar un número de llamada abre la nota completa.

## 5. Marx XXI (5 tomos)

```bash
cd tools/extraccion/marx_xxi
export MX_PDF_DIR=../../../..            # carpeta con mxxi1.pdf … mxxi5.pdf
export MX_WEB=../../..                   # MarxXXI-web (lee data/content.json para los ids de cada tomo)
export MX_OUT=/ruta/salida
python run_all.py            # todos los tomos; o  python run_all.py 3   /   t3-a2
python build_final.py DIR_FINAL
python qa.py
```

- Reglas distintas de Nuevo Ciclo: tipografía tipo Alegreya; cabecera SemiBold 10 con y < 0,13·alto; llamadas ≤ 7,1 pt;
  notas marginales; notas finales del tomo 2 (PDF 28–33); títulos SemiBold/Bold, título del artículo Bold ≥ 17,5.
- `MINP` en `run_all.py` indica la primera página de contenido de cada tomo (`{1:1, 2:1, 3:6, 4:6, 5:6}`).
  Un tomo nuevo exige añadir su entrada.
- El número y orden de artículos sale de `data/content.json`; si el número de inicios detectados no coincide con los
  ids, imprime `!! vol N` y no extrae ese tomo.
- Las notas mal numeradas o desbordadas a otra página las resuelve `collect_notes`; los avisos salen como `!!`/`~~`.

## 6. Qué hacer si algo falla o cambia la maqueta

- **Cobertura distinta** (`¡DIFIERE!`): suele ser una línea clasificada como cabecera (cabecera mal detectada: pasar
  otro `HDR_Y` en `extract_nc.py`), una línea de pie confundida con nota, o texto de otra familia tipográfica. Usar
  `volcado_maqueta.py` en la página afectada y ajustar `kind_of` / `process_article` en `extract_nc.py`.
- **Escala distinta**: `detect_scale` mide el tamaño de cuerpo; si falla, forzar `k` en `load_lines(path, k)`.
- **Faltan o sobran inicios de texto**: los inicios son páginas con una línea ≥ 19,5 pt (escalada) bajo la cabecera,
  excluyendo portada (fuente Black) e índice (línea que empieza por «Índice»). Revisar `parse_index`.
- **Nota sin llamada / llamada sin nota**: casi siempre una llamada impresa como dígito normal o una nota que
  continúa en la página siguiente; comprobar en el PDF y, si es real (cuatro casos en Marx XXI), dejarla en
  `unanchored_notes`.
- **Tras tocar el código**, repetir la extracción de los números ya publicados y comprobar que el resultado no cambia
  (bloques y notas idénticos); eso es lo que valida que el método sigue siendo el mismo.

## 7. Limitaciones conocidas

- Títulos en mayúsculas en el PDF: se usa la grafía del índice o `capitalize()`; puede faltar alguna mayúscula interior.
- Autores con seudónimo y variantes de nombre (p. ej. Toscano) se dejan como vienen en el PDF; unificarlos es decisión editorial.
- Los niveles de título interior son una aproximación por tipografía (normalizada por artículo).
- En Marx XXI hay 4 notas sin llamada impresa (t4-a5 #11, t5-a1 #15, t5-a3 #28, t5-a4 #88): quedan en `unanchored_notes` y la app las muestra aparte.
- El #005 de Nuevo Ciclo está solo como extracto (`nc5-a2`, id asumido): hay que repetirlo con el número completo.

## 8. Comprobación de que este paquete funciona (octubre 2026)

Desde esta carpeta: `extraer_nc.py` sobre `NC_005.pdf --primer-articulo 2` reproduce exactamente `nc5-a2.json`
(44 bloques, 31 notas, cobertura 34272/34272), y `run_all.py 1` reproduce los 15 textos del tomo 1.
