"""Importa Nuevo Ciclo (segunda publicación de la biblioteca) a MarxXXI-web/data/.

data/ es la fuente única de la web: este script solo se usa para traer material nuevo preparado fuera
(el traspaso de Nuevo Ciclo o un número nuevo). Después, las correcciones se hacen directamente en data/.
OJO: volver a ejecutarlo sobrescribe data/nuevo-ciclo/ con lo que haya en las carpetas de origen.

Uso (desde MarxXXI-web):
    python tools/importar_nuevo_ciclo.py

Lee, en la carpeta raíz del proyecto:
  app-handoff-nuevo-ciclo/content.json           guía de lectura (mismo esquema que Marx XXI + campos aditivos)
  app-handoff-nuevo-ciclo/svg/                   esquemas con clases sv-* (tematizables)
  diagramas/nuevo-ciclo/                         esquemas revisados que sustituyen a los del mismo nombre
  texto-estructurado-nuevo-ciclo/ncN-aM.json     textos íntegros estructurados
  app-handoff-nuevo-ciclo/library-synthesis.json síntesis de las dos revistas (opcional)

Escribe:
  data/library.json                  manifiesto de la biblioteca (publicaciones disponibles)
  data/nuevo-ciclo/content.json      guía con rutas relativas a data/
  data/nuevo-ciclo/svg/*.svg         esquemas normalizados (ids con prefijo nc-, sin metadatos)
  data/nuevo-ciclo/texto/nN-aM.json  textos íntegros (mismo id que la guía: n1-a1…)
  data/library-synthesis.json        síntesis de la biblioteca, si existe

Para añadir el #005: dejar sus datos en app-handoff-nuevo-ciclo/ y texto-estructurado-nuevo-ciclo/
(mismo formato) y volver a ejecutar; no hace falta tocar el código de la web.
"""
import json
import os
import re
import sys

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(WEB)
HANDOFF = os.path.join(ROOT, "app-handoff-nuevo-ciclo")
TEXTO = os.path.join(ROOT, "texto-estructurado-nuevo-ciclo")
OVERRIDES = os.path.join(ROOT, "diagramas", "nuevo-ciclo")
DATA = os.path.join(WEB, "data")
OUT = os.path.join(DATA, "nuevo-ciclo")
PUB = "nuevo-ciclo"

# Manifiesto de la biblioteca: añadir una publicación es añadir una entrada.
# Las rutas son relativas a data/ (salvo `cover`: portada de cada volumen o número, relativa a la web, con {n} =
# número; si falta la imagen se dibuja la portada genérica). `key` es el prefijo de los ids de volumen en la web (data-vol, rutas).
LIBRARY = {
    "publications": [
        {"id": "marx-xxi", "name": "Marx XXI", "kind": "Revista-libro temática", "content": "content.json",
         "unit": "Volumen", "unit_plural": "volúmenes", "unit_short": "Vol.", "route": "volumen", "key": "",
         "home": "#/marx-xxi", "periodicity": None, "complete": True, "cover": "img/mxxi{n}.webp",
         "description": "Fija el marco de una estrategia socialista. Cada volumen trabaja a fondo un problema: qué es el marxismo, por qué no la socialdemocracia, el partido, el Estado-Comuna, la Internacional."},
        {"id": "nuevo-ciclo", "name": "Nuevo Ciclo", "kind": "Revista trimestral", "content": "nuevo-ciclo/content.json",
         "unit": "Número", "unit_plural": "números", "unit_short": "", "route": "numero", "key": "n",
         "home": "#/nuevo-ciclo", "periodicity": "trimestral", "complete": False,
         "about": "nuevo-ciclo/about.json", "cover": "img/nc{n}.webp",
         "description": "Aplica ese marco a la coyuntura, número a número: Trump y el Estado dual, Gaza y el rearme, la Ley de Extranjería, los juicios a militantes, las huelgas en Europa."},
    ],
}


# --- normalización de esquemas y terminología (las mismas reglas que se aplicaron a Marx XXI)

# Atributos camelCase que algunos SVG traen en minúsculas: en XML no se reconocen.
SVG_ATTRS = ["viewBox", "refX", "refY", "markerWidth", "markerHeight", "markerUnits",
             "preserveAspectRatio", "textLength", "lengthAdjust", "gradientUnits", "patternUnits"]

# La revista Marx XXI habla de «volúmenes», no de «tomos» (solo en lo visible; no en citas literales).
_TERMS = {"tomo": "volumen", "tomos": "volúmenes", "Tomo": "Volumen", "Tomos": "Volúmenes",
          "TOMO": "VOLUMEN", "TOMOS": "VOLÚMENES"}
_TERM_RE = re.compile(r"\b(tomos?|Tomos?|TOMOS?)\b(?!-)")
# campos que no se tocan: identificadores, rutas, citas literales y referencias bibliográficas
_TERM_SKIP_KEYS = {"id", "slug", "file", "pdf", "text_file", "source_text_file", "presentation_text",
                   "source_text_files", "quote", "references", "article", "marx_xxi", "nuevo_ciclo"}


def term_str(s):
    parts = re.split(r"(«[^»]*»)", s)  # el texto entre «comillas» es cita literal
    return "".join(p if p.startswith("«") else _TERM_RE.sub(lambda m: _TERMS[m.group(1)], p) for p in parts)


def terms(x, key=None):
    if key in _TERM_SKIP_KEYS:
        return x
    if isinstance(x, dict):
        return {k: terms(v, k) for k, v in x.items()}
    if isinstance(x, list):
        return [terms(v, key) for v in x]
    return term_str(x) if isinstance(x, str) else x


def fix_svg(svg):
    """Esquema con clases sv-* listo para insertarlo en línea (lo pinta data/diagram.css)."""
    for a in SVG_ATTRS:
        svg = re.sub(r"(?<=\s)" + a.lower() + r"=", a + "=", svg)
    svg = svg.replace('fill="context-stroke"', 'class="sv-arrow"')  # el color lo da la clase
    svg = re.sub(r'(<svg\b[^>]*?)\s(?:width|height)="[^"]*"', r"\1", svg, count=2)
    if "xmlns=" not in svg[:300]:
        svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
    svg = re.sub(r">([^<]+)<", lambda m: ">" + term_str(m.group(1)) + "<", svg)
    svg = re.sub(r'aria-label="([^"]*)"', lambda m: 'aria-label="' + term_str(m.group(1)) + '"', svg)
    return svg.strip() + "\n"


def clean_svg(svg):
    """Esquema del handoff → esquema para insertar en línea en la web.
    - quita el bloque <metadata> (manifiesto C2PA, ~10 KB por archivo) y su espacio de nombres;
    - normaliza atributos, flechas y terminología (fix_svg);
    - antepone «nc-» a los id: en la web los esquemas comparten página con los de Marx XXI."""
    svg = re.sub(r"<metadata>.*?</metadata>", "", svg, flags=re.S)
    svg = re.sub(r'\s+xmlns:c2pa="[^"]*"', "", svg)
    svg = fix_svg(svg)
    ids = set(re.findall(r'\sid="([^"]+)"', svg))
    for i in sorted(ids, key=len, reverse=True):
        if i.startswith("nc-"):
            continue
        svg = svg.replace(f'id="{i}"', f'id="nc-{i}"').replace(f"url(#{i})", f"url(#nc-{i})") \
                 .replace(f'href="#{i}"', f'href="#nc-{i}"')
    return svg


def words(blocks):
    n = 0
    for b in blocks:
        t = b.get("text") or " ".join(" ".join(r) for r in b.get("rows", []))
        n += len(re.sub(r"\[\^\d+\]|\[\[p\d+\]\]|\*", "", t).split())
    return n


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not os.path.isdir(HANDOFF):
        sys.exit(f"No encuentro {HANDOFF}")
    os.makedirs(os.path.join(OUT, "svg"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "texto"), exist_ok=True)

    with open(os.path.join(HANDOFF, "content.json"), encoding="utf-8") as f:
        data = json.load(f)

    # --- esquemas: los del handoff y, encima, los revisados de diagramas/nuevo-ciclo/
    wanted, own = set(), []
    for src in (os.path.join(HANDOFF, "svg"), OVERRIDES):
        if not os.path.isdir(src):
            continue
        for name in sorted(os.listdir(src)):
            if not name.endswith(".svg"):
                continue
            if src == OVERRIDES:
                own.append(name)
            with open(os.path.join(src, name), encoding="utf-8") as f:
                svg = clean_svg(f.read())
            with open(os.path.join(OUT, "svg", name), "w", encoding="utf-8", newline="\n") as f:
                f.write(svg)
            wanted.add("svg/" + name)
    if own:
        print(f"Esquemas revisados (diagramas/nuevo-ciclo/): {len(own)}")

    def fix(p):
        return f"{PUB}/svg/{os.path.basename(p)}" if p else p

    # --- guía y textos íntegros
    missing = []
    for v in data["volumes"]:
        v["concept_map"]["file"] = fix(v["concept_map"]["file"])
        v["presentation_text"] = None  # la revista no lleva presentación
        for a in v["articles"]:
            for d in a["diagrams"]:
                d["file"] = fix(d["file"])
            src = os.path.join(TEXTO, "nc" + a["id"][1:] + ".json")  # n1-a1 → nc1-a1.json
            if not os.path.isfile(src):
                missing.append(a["id"])
                a["text_file"] = None
                continue
            with open(src, encoding="utf-8") as f:
                t = json.load(f)
            name = a["id"] + ".json"
            with open(os.path.join(OUT, "texto", name), "w", encoding="utf-8", newline="\n") as f:
                json.dump(t, f, ensure_ascii=False, separators=(",", ":"))
            wanted.add("texto/" + name)
            a["text_file"] = f"{PUB}/texto/{name}"
            a["word_count"] = words(t["blocks"])
    cv = data["cross_volume"]
    cv["arc"]["file"] = fix(cv["arc"]["file"])
    cv["map"]["file"] = fix(cv["map"]["file"])
    data = terms(data)
    data["publication"] = PUB
    with open(os.path.join(OUT, "content.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    wanted.add("content.json")

    # --- textos de «Acerca de» propios de Nuevo Ciclo
    about = os.path.join(WEB, "tools", "about_nuevo_ciclo.json")
    if os.path.isfile(about):
        with open(about, encoding="utf-8") as f:
            ab = json.load(f)
        with open(os.path.join(OUT, "about.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(ab, f, ensure_ascii=False, indent=1)
        wanted.add("about.json")

    # --- síntesis de la biblioteca (transversal a las dos revistas)
    synth = os.path.join(HANDOFF, "library-synthesis.json")
    lib = dict(LIBRARY, library_version=data.get("content_version"))
    if os.path.isfile(synth):
        with open(synth, encoding="utf-8") as f:
            s = json.load(f)
        def fix_files(x):
            if isinstance(x, dict):
                return {k: (fix(v) if k == "file" and isinstance(v, str) else fix_files(v)) for k, v in x.items()}
            if isinstance(x, list):
                return [fix_files(v) for v in x]
            return x
        s = terms(fix_files(s))
        with open(os.path.join(DATA, "library-synthesis.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(s, f, ensure_ascii=False, separators=(",", ":"))
        lib["synthesis"] = "library-synthesis.json"
    with open(os.path.join(DATA, "library.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(lib, f, ensure_ascii=False, indent=1)

    # --- borrar lo sobrante de data/nuevo-ciclo (p. ej. un esquema renombrado)
    for dp, _, names in os.walk(OUT):
        for n in names:
            rel = os.path.relpath(os.path.join(dp, n), OUT).replace(os.sep, "/")
            if rel not in wanted:
                try:
                    os.remove(os.path.join(dp, n))
                except OSError:
                    print("  aviso: no se pudo borrar data/nuevo-ciclo/" + rel)

    n_art = sum(len(v["articles"]) for v in data["volumes"])
    n_svg = sum(1 for w in wanted if w.startswith("svg/"))
    if missing:
        sys.exit("Faltan textos íntegros de: " + ", ".join(missing))
    print(f"Nuevo Ciclo: {len(data['volumes'])} números · {n_art} textos · {n_svg} esquemas · "
          f"{len(data.get('cross_refs', []))} referencias cruzadas -> {OUT}")


if __name__ == "__main__":
    main()
