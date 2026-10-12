"""Copia local de las tipografías (licencia SIL Open Font License) para no depender de Google Fonts.

Descarga de Google Fonts la hoja de estilos de las familias que usa la app, se queda solo con los
subconjuntos latinos (español, catalán, euskera, gallego… y los signos tipográficos) y guarda los .woff2 en
fonts/, junto con la licencia de cada familia (OFL-*.txt), y las reglas @font-face en css/fonts.css.
Así la app solo se conecta a su propio servidor.

Uso (solo hace falta volver a ejecutarlo para cambiar de familias o actualizarlas):
    python tools/fuentes.py
"""
import os
import re
import sys
import urllib.request

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(WEB, "fonts")
CSS = os.path.join(WEB, "css", "fonts.css")

FAMILIES = ("family=Alegreya:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Alegreya+SC:wght@400;500"
            "&family=Alegreya+Sans:ital,wght@0,400;0,700;1,400&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400"
            "&family=IBM+Plex+Mono:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400"
            "&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap")
SUBSETS = ("latin", "latin-ext")
# la licencia exige acompañar las fuentes de su aviso de copyright y su texto: OFL de cada familia (google/fonts)
LICENSES = ("alegreya", "alegreyasc", "alegreyasans", "atkinsonhyperlegible", "ibmplexmono", "literata", "sourceserif4")
# con un navegador moderno, Google sirve woff2
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()


def main():
    css = get("https://fonts.googleapis.com/css2?" + FAMILIES).decode("utf-8")
    os.makedirs(FONTS, exist_ok=True)
    out, used = [], set()
    # cada bloque va precedido de un comentario con su subconjunto: /* latin */ @font-face {…}
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*\{[^}]*\})", css):
        if subset not in SUBSETS:
            continue
        family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*([\d ]+);", block).group(1).strip()
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        name = f"{family.lower().replace(' ', '-')}-{style}-{weight.replace(' ', '_')}-{subset}.woff2"
        if name not in used:
            used.add(name)
            path = os.path.join(FONTS, name)
            if not os.path.isfile(path):
                open(path, "wb").write(get(url))
        out.append(block.replace(url, "../fonts/" + name))
    # archivos de una versión anterior que ya no se usan
    for f in os.listdir(FONTS):
        if f.endswith(".woff2") and f not in used:
            os.remove(os.path.join(FONTS, f))
    for name in LICENSES:
        path = os.path.join(FONTS, f"OFL-{name}.txt")
        if not os.path.isfile(path):
            open(path, "wb").write(get(f"https://raw.githubusercontent.com/google/fonts/main/ofl/{name}/OFL.txt"))
    head = ("/* Tipografías de la app (SIL Open Font License), servidas desde fonts/.\n"
            "   Generado por tools/fuentes.py: no editar a mano. */\n")
    open(CSS, "w", encoding="utf-8", newline="\n").write(head + "\n".join(out) + "\n")
    size = sum(os.path.getsize(os.path.join(FONTS, f)) for f in used)
    print(f"{len(out)} reglas @font-face · {len(used)} archivos · {size / 1e6:.1f} MB en fonts/")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
