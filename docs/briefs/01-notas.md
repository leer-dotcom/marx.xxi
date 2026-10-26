# Encargo 1 · notas de lectura de un texto de *Nuevo Ciclo* #{N}

Se lanza UNA sesión (o un agente) por texto, en paralelo. Sustituye {N}, {i}, {MES}, {RUTAS} antes de usarlo.

Eres el lector de un texto del número {N} de la revista trimestral *Nuevo Ciclo* ({MES}, Asociación Nuevo Ciclo,
Madrid). Tu tarea: leer el texto ÍNTEGRO y escribir sus notas de lectura en español, con el formato
exacto de abajo. Las notas son el material del que después salen la guía de lectura (resúmenes, «píldoras»,
esquemas), las conclusiones del número y las tesis; no son un borrador.

Lee antes:
- `docs/PLANTILLA-NOTAS.md` (formato y reglas; lo esencial se repite abajo).
- Como modelo de tono y nivel de detalle, la ficha A1 de `../app-handoff-nuevo-ciclo/notes/numero4.md`.
- Para situar el texto en la biblioteca: `docs/ESTADO-DE-LA-SINTESIS.md` §1-§4 (arcos, tesis
  de Nuevo Ciclo y tesis comunes) y el índice de textos en §8. Te servirá para los interlocutores y para el campo
  «Posición en el arco».

## Reglas
- Leer el archivo completo (lleva marcas `[p.N]` al inicio de cada página impresa y las notas al pie al final,
  como `[^12]`). No resumir a partir del título ni inventar: todo sale del texto.
- Citas entre « » LITERALES (copia exacta) y con página `[p.N]`. Comprueba cada cita con grep antes de escribirla.
- Autores y títulos exactamente como figuran en el texto. «Irún» con tilde si aparece.
- Resumen de 3 párrafos (450-650 palabras); estructura argumental de 6-9 puntos; 7-10 conceptos clave con la
  definición *del autor*; 1 cita representativa; conclusión de 80-150 palabras; interlocutores (autores, obras,
  corrientes, organizaciones y artículos anteriores de *Nuevo Ciclo* o *Marx XXI* que el texto cita o discute);
  posición en el arco (2-4 frases: qué tesis de Nuevo Ciclo o común confirma, matiza o discute, con su número).
- «Esquema propuesto»: 2-3 frases con el tipo de figura (dos columnas enfrentadas, cadena causal, línea temporal,
  matriz 2×2, ciclo, árbol con raíz común, escalera, tabla…) y los rótulos EXACTOS de 4-8 nodos y sus relaciones.
  Es el plano del esquema simplificado: debe captar el mecanismo del argumento, no el índice del texto.
- «Datos y ejemplos»: 6-12 datos (cifras, fechas, casos, nombres) que el autor usa como prueba, cada uno con
  página. Alimentan la versión detallada del esquema.
- Una entrevista sigue el mismo formato: el entrevistado es el nombre principal; el resumen recorre las preguntas
  y respuestas principales; los conceptos son los del entrevistado.

## Formato (escribe exactamente esto en `NOTAS/a{i}.md`)

```
## A{n} · {Título exacto}
**Autor/a:** {nombre}  ·  **Páginas:** {p.inicio}-{p.fin}

### Resumen
{3 párrafos}

### Estructura argumental
1. **{rótulo}.** {frase}
...

### Esquema propuesto
{descripción} Nodos: {lista}.

### Conceptos clave
- **{Concepto}** — {definición en 1-2 frases, tal como lo usa el autor}
...

### Datos y ejemplos
- {dato} [p.N]
...

### Cita
> «{cita literal}» [p.N]

### Conclusión del artículo
{párrafo}

### Interlocutores
{lista en prosa}

### Posición en el arco
{2-4 frases}
```

Cuando termines, responde con un resumen de 5 líneas: tesis central, tipo de esquema propuesto, tesis de la
biblioteca que toca, y cualquier incidencia (nombre dudoso, paginación, cita que no encontraste).

- Texto: el `.txt` del artículo generado con `python tools/nuevo_numero/texto_a_txt.py {N} DESTINO`.
