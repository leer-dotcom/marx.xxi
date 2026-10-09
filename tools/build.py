"""Comprueba la web en local antes de publicar. data/ es la fuente de los contenidos.

Uso (desde MarxXXI-web):
    python tools/build.py              # comprobar y actualizar data/files.json
    python tools/build.py --release    # además, nueva versión de la caché (sw.js) y de los datos (content.json)

(--no-data se acepta por compatibilidad y no hace nada: ya no se regeneran datos.)
"""
import datetime
import json
import os
import re
import subprocess
import sys

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(WEB, "data")


def step(msg):
    print(f"\n== {msg}")


def file_list():
    """data/files.json: lista de archivos que el service worker precarga para el modo sin conexión."""
    files = sorted(os.path.relpath(os.path.join(dp, f), WEB).replace(os.sep, "/")
                   for dp, _, fs in os.walk(DATA) for f in fs)
    p = os.path.join(DATA, "files.json")
    new = json.dumps(files)
    old = open(p, encoding="utf-8").read() if os.path.isfile(p) else ""
    if new != old:
        open(p, "w", encoding="utf-8", newline="\n").write(new)
        print(f"data/files.json actualizado ({len(files)} archivos)")


def check():
    step("Comprobando")
    errors = []

    def exists(rel):
        if not os.path.isfile(os.path.join(WEB, "data", rel)):
            errors.append(f"falta data/{rel}")

    # Biblioteca: data/library.json enumera las publicaciones (Marx XXI, Nuevo Ciclo…); sin él, solo Marx XXI
    manifest = {"publications": [{"id": "marx-xxi", "content": "content.json"}]}
    if os.path.isfile(os.path.join(DATA, "library.json")):
        with open(os.path.join(DATA, "library.json"), encoding="utf-8") as f:
            manifest = json.load(f)
    if manifest.get("synthesis"):
        exists(manifest["synthesis"])
    ids, refs, n_vol, n_art = set(), [], 0, 0
    for p in manifest["publications"]:
        if p.get("about"):
            exists(p["about"])
        if not os.path.isfile(os.path.join(DATA, p["content"])):
            exists(p["content"])
            continue
        with open(os.path.join(DATA, p["content"]), encoding="utf-8") as f:
            lib = json.load(f)
        refs += lib.get("cross_refs", [])
        for v in lib["volumes"]:
            n_vol += 1
            if v.get("presentation_text"):
                exists(v["presentation_text"])
            if v.get("concept_map"):
                exists(v["concept_map"]["file"])
            for a in v["articles"]:
                n_art += 1
                if a["id"] in ids:
                    errors.append(f"{a['id']}: id repetido entre publicaciones")
                ids.add(a["id"])
                if not a.get("text_file"):
                    errors.append(f"{a['id']}: sin text_file")
                else:
                    exists(a["text_file"])
                for d in a["diagrams"]:
                    exists(d["file"])
        for k in ("arc", "map"):
            if lib["cross_volume"].get(k):
                exists(lib["cross_volume"][k]["file"])
    # Referencias cruzadas («marx-xxi:t4-a7», «n2-a5»): el destino tiene que existir
    for r in refs:
        for k in ("from", "to"):
            if r[k].split(":")[-1] not in ids:
                errors.append(f"cross_refs: no existe {r[k]}")

    # Esquemas: viewBox (da la proporción), sin colores sueltos que ignoren el tema (ver DIAGRAMAS.md)
    n_svg = 0
    for sub in ("svg", "nuevo-ciclo/svg"):
        svg_dir = os.path.join(DATA, sub)
        if not os.path.isdir(svg_dir):
            continue
        for name in os.listdir(svg_dir):
            n_svg += 1
            svg = open(os.path.join(svg_dir, name), encoding="utf-8").read()
            m = re.search(r"<svg\s[^>]*>", svg)
            head = m.group(0) if m else ""
            if "viewBox=" not in head:
                errors.append(f"{sub}/{name}: sin viewBox")
            if "context-stroke" in svg:
                errors.append(f"{sub}/{name}: usa context-stroke (usa la clase sv-arrow)")
            for color in sorted(set(re.findall(r'\s(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[^"]*)"', svg))):
                print(f"  aviso: {sub}/{name} usa el color fijo {color}; no cambiará con el tema")
    if not os.path.isfile(os.path.join(WEB, "data", "diagram.css")):
        errors.append("falta data/diagram.css")

    # Archivos que precarga el service worker
    sw = open(os.path.join(WEB, "sw.js"), encoding="utf-8").read()
    shell = re.search(r"const SHELL = \[(.*?)\];", sw, re.S).group(1)
    for path in re.findall(r"'([^']+)'", shell):
        if path != "./" and not os.path.isfile(os.path.join(WEB, path)):
            errors.append(f"sw.js precarga {path}, que no existe")

    # Módulos JS importados
    for js in ("app.js", "data.js", "reader.js"):
        src = open(os.path.join(WEB, "js", js), encoding="utf-8").read()
        for imp in re.findall(r"from '\./([^']+)'", src):
            if not os.path.isfile(os.path.join(WEB, "js", imp)):
                errors.append(f"js/{js} importa ./{imp}, que no existe")

    # Sintaxis JS, si hay Node instalado
    try:
        for js in ("app.js", "data.js", "reader.js"):
            r = subprocess.run(["node", "--check", os.path.join(WEB, "js", js)], capture_output=True, text=True)
            if r.returncode != 0:
                errors.append(f"js/{js}: {r.stderr.strip()[:300]}")
    except FileNotFoundError:
        print("(Node no instalado: no se comprueba la sintaxis JS)")

    size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(WEB)
               if ".git" not in dp for f in fs)
    print(f"{len(manifest['publications'])} publicaciones · {n_vol} volúmenes y números · {n_art} textos · "
          f"{n_svg} esquemas · {len(refs)} referencias cruzadas · {size / 1e6:.1f} MB")
    if errors:
        print("\n".join("  ✗ " + e for e in errors))
        sys.exit(f"{len(errors)} problema(s)")
    print("OK")


def release():
    step("Nueva versión de la caché offline (sw.js) y de los datos (content.json)")
    now = datetime.datetime.now()
    p = os.path.join(WEB, "sw.js")
    s = open(p, encoding="utf-8").read()
    ver = "mx-" + now.strftime("%Y%m%d-%H%M")
    s = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{ver}';", s, count=1)
    open(p, "w", encoding="utf-8", newline="\n").write(s)
    # Sello de los datos: la web lo añade a las rutas de data/ (?v=…) para no reutilizar copias viejas
    p = os.path.join(DATA, "content.json")
    s = open(p, encoding="utf-8").read()
    s = re.sub(r'"build":"\d+"', '"build":"%s"' % now.strftime("%Y%m%d%H%M%S"), s, count=1)
    open(p, "w", encoding="utf-8", newline="\n").write(s)
    print(ver)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    file_list()
    check()
    if "--release" in args:
        release()
