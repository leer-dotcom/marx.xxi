# Plantilla de notas de lectura (capa 1)

Encargo tipo para una sesión de Claude: leer ÍNTEGRAMENTE los textos de un número y escribir las notas en este
formato, en español. Las notas son el material del que salen después la guía (`content.json`), las conclusiones y
las tesis; no son un borrador.

## Reglas

- Leer cada archivo completo. No resumir a partir del título ni inventar: todo sale del texto.
- Las citas entre « » son LITERALES (copia exacta) y llevan la página: `[p.N]`.
- Autores y títulos exactamente como aparecen en la revista.
- Escribir siempre «Irún» con tilde si aparece.
- Por texto: resumen de 3 párrafos (450-650 palabras); estructura argumental de 6-9 puntos; 7-10 conceptos clave;
  1 cita; conclusión de 80-150 palabras; interlocutores (autores y obras citados o discutidos). Una entrevista sigue
  el mismo formato.
- Además, por texto, un «Esquema propuesto»: 2-3 frases con el tipo de diagrama (dos columnas enfrentadas, cadena
  causal, línea temporal, matriz 2x2, ciclo…) y los rótulos exactos de los nodos (4-8) y sus relaciones.
- Al final del número: «Conclusiones del número» (8-10 tesis en negrita + 1-2 frases, citando los textos que las
  sostienen; cada una con ≥ 2 textos) y «Cómo se relacionan los artículos» (8-12 relaciones Art. X ↔ Art. Y —
  etiqueta — explicación, señalando discrepancias y matices) y «Datos del número» (fecha, páginas, ISSN, incidencias
  de paginación o de nombres).

## Formato por texto

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

### Cita
> «{cita literal}» [p.N]

### Conclusión del artículo
{párrafo}

### Interlocutores
{lista en prosa}
```

## Formato del cierre del número

```
## Conclusiones del número
- **{tesis}.** {explicación; artículos que la sostienen}

## Cómo se relacionan los artículos
- Art. X ↔ Art. Y — {etiqueta} — {explicación}

## Datos del número
{fecha de edición, páginas, editorial, ISSN/depósito, incidencias}
```
