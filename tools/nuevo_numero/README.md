# tools/nuevo_numero · integrar un número nuevo de Nuevo Ciclo

Tres scripts, en este orden, que reproducen lo que se hizo con el #005. Procedimiento completo en
`docs/ACTUALIZACION-CONTENIDOS.md` §2; encargos para las sesiones en `docs/briefs/`. Todos se ejecutan desde la
raíz de la app y no necesitan nada fuera de la biblioteca estándar de Python.

1. `texto_a_txt.py N DESTINO` — de `data/nuevo-ciclo/texto/n{N}-a*.json` a `.txt` con marcas `[p.N]` y notas al pie.
2. `notas_a_json.py N NOTAS --mes AAAA-MM [--issn … --dl … --pages …]` — de `NOTAS/a{i}.md`, `NOTAS/numero{N}-cierre.md`
   y `NOTAS/meta/*.json` a `NOTAS/out/volume.json` (entrada del número + referencias cruzadas). Limpia el Markdown.
3. `aplicar_enmiendas.py N NOTAS [--fecha] [--alinear T=C]` — aplica la entrada y las tablas del cierre a
   `data/nuevo-ciclo/content.json`, `data/library-synthesis.json`, `data/files.json` y `data/library.json`. Modifica en
   sitio: haz copia o trabaja en una rama. Después, retoques a mano (`cross_volume`, `description`), mapas de
   colección, `python tools/estado_sintesis.py` y comprobación de esquemas con `tools/esquemas/`.

`NOTAS` es la carpeta de trabajo del número (por ejemplo `../Marx XXI/app-handoff-nuevo-ciclo/notes/n5/`); los
archivos que espera son los que producen los encargos 1-4.
