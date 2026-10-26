# Encargos tipo para integrar un número nuevo

Cuatro encargos reutilizables (prompts para sesiones de Claude o agentes), en el orden en que se usan. Son los que
sirvieron para el #005; sustituye `{N}`, `{i}`, `{MES}` y las rutas de `NOTAS/` (la carpeta de trabajo del número)
antes de lanzarlos. El procedimiento completo está en `../ACTUALIZACION-CONTENIDOS.md` §2 y el criterio en
`../GUIA-ANALISIS-NUEVAS-PUBLICACIONES.md`.

| Encargo | Sesiones | Entrada | Salida |
|---|---|---|---|
| `01-notas.md` | una por texto, en paralelo | `.txt` del texto (de `tools/nuevo_numero/texto_a_txt.py`), plantilla, ESTADO | `NOTAS/a{i}.md` |
| `02-sintesis.md` | una | las seis notas + ESTADO | `NOTAS/numero{N}-cierre.md` (conclusiones, relaciones, mapa en texto, referencias cruzadas, datos, tablas de enmienda, puentes) |
| `03-esquema.md` | una por texto, en paralelo con la 2 | notas del texto + `.txt` | SVG simplificado y detallado + `NOTAS/meta/n{N}-a{i}.json` |
| `04-mapas.md` | dos, después de `aplicar_enmiendas.py` | JSON ya enmendados + cierre | `numero-{N}-mapa.svg` (+ `NOTAS/meta/numero-{N}-mapa.json`), `arco-coleccion.svg`, `mapa-transversal.svg`, `mapa-biblioteca.svg`, en ambos niveles |
