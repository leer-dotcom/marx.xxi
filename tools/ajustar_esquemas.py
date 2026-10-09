"""Encuadre de los textos de los esquemas con data/diagram.css (Alegreya), con las mismas reglas que los
esquemas revisados de Marx XXI. Solo añade atributos style a <text> (y, para las etiquetas con halo, las pasa
al final del SVG para que se pinten encima de las líneas): no cambia textos, coordenadas ni clases.

Reglas
  1. Texto dentro de una caja (rect que no sea sv-soft): ≥ MARGEN de margen lateral y las líneas sin pisar
     el borde superior/inferior ni solaparse entre sí (escala común para todas las líneas de la caja).
     Se reduce el cuerpo de letra; nunca por debajo de MINIMO (lo que no quepa se lista).
  2. Etiquetas sueltas (fuera de caja o en un panel sv-soft) que se salen del dibujo: se desplaza hacia dentro
     el grupo de líneas con la misma x.
  3. Etiquetas sueltas que pisan una línea o flecha: se desplazan lo mínimo (≤ 14) a un hueco libre; si no lo
     hay, o es el título de un panel, llevan halo del color del fondo (paint-order: stroke) y van encima.

Uso (desde MarxXXI-web; necesita Playwright y Microsoft Edge, Google Chrome o Chromium):
    python tools/ajustar_esquemas.py data/nuevo-ciclo/svg            # solo informe
    python tools/ajustar_esquemas.py data/nuevo-ciclo/svg --aplicar  # corregir en el sitio
    --fuentes DIR   medir con alegreya*.ttf locales en vez de Google Fonts (sin conexión)
"""
import glob
import html
import os
import re
import sys

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARGEN = 7
MINIMO = 9.5
DESPLAZAMIENTO_MAX = 14
HALO_PANEL = "color-mix(in srgb,var(--d-ink) 5.5%,var(--d-bg))"
HALO_FONDO = "var(--d-bg)"

GOOGLE = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;'
          '0,700;1,400&family=Alegreya+SC:wght@400;500&display=block">')
PAGE = """<!doctype html><html><head><meta charset="utf-8">%s
<style>%s</style></head><body style="margin:0"><div class="dg" id="host" style="width:760px"></div></body></html>"""

MEASURE = """() => {
 const svg = document.querySelector('#host svg'); const vb = svg.viewBox.baseVal;
 const rects = [...svg.querySelectorAll('rect')].map((r, i) => ({i, x: r.x.baseVal.value, y: r.y.baseVal.value,
   w: r.width.baseVal.value, h: r.height.baseVal.value, soft: (r.getAttribute('class') || '').includes('sv-soft')}));
 const pts = [];
 for (const g of svg.querySelectorAll('line,path,polyline')) {
   if (g.closest('marker')) continue;
   const L = g.getTotalLength(); for (let s = 0; s <= L; s += 1) { const p = g.getPointAtLength(s); pts.push([p.x, p.y]); }
 }
 const sr = svg.getBoundingClientRect(), k = vb.width / sr.width;
 const out = [];
 for (const t of svg.querySelectorAll('text')) {
   const rot = !!t.getAttribute('transform');
   const b = t.getBBox(), ax = +t.getAttribute('x'), ay = +t.getAttribute('y');
   let box = null;
   if (!rot) for (const r of rects) {
     if (r.w >= vb.width * 0.98) continue;
     if (ax >= r.x - 1 && ax <= r.x + r.w + 1 && ay - 4 >= r.y && ay - 4 <= r.y + r.h && (!box || r.w * r.h < box.w * box.h)) box = r;
   }
   const panel = rot ? null : rects.find(r => r.soft && ax >= r.x && ax <= r.x + r.w && ay - 4 >= r.y && ay - 4 <= r.y + r.h) || null;
   const cs = getComputedStyle(t), r = t.getBoundingClientRect();
   out.push({text: t.textContent, x: t.getAttribute('x'), y: t.getAttribute('y'), ax, ay, rot, fs: parseFloat(cs.fontSize),
     anchor: cs.textAnchor, cls: t.getAttribute('class') || '', style: t.getAttribute('style') || '', bw: b.width,
     box, panel, vbx: vb.x, vbw: vb.width, left: (r.left - sr.left) * k + vb.x, width: r.width * k});
 }
 return {texts: out, pts};
}"""


def ink(t, dx=0, dy=0):
    return (t["left"] + dx, t["ay"] - 0.72 * t["fs"] + dy, t["left"] + t["width"] + dx, t["ay"] + 0.2 * t["fs"] + dy)


def hits(b, pts, pad=1.5):
    return any(b[0] - pad <= X <= b[2] + pad and b[1] - pad <= Y <= b[3] + pad for X, Y in pts)


def loose(t):
    return not t["rot"] and (not t["box"] or t["box"]["soft"])


def plan(m):
    """Devuelve {(x, y, texto): {propiedad: valor}}, la lista de etiquetas a pasar delante y avisos."""
    T, pts = m["texts"], m["pts"]
    rules, front, notes = {}, set(), []

    def add(t, **decl):
        rules.setdefault((t["x"], t["y"], t["text"]), {}).update({k.replace("_", "-"): v for k, v in decl.items()})

    # 1 · cajas
    boxes = {}
    for t in T:
        if not t["rot"] and t["box"] and not t["box"]["soft"]:
            boxes.setdefault(t["box"]["i"], (t["box"], []))[1].append(t)
    for b, ts in boxes.values():
        ls = sorted(ts, key=lambda t: t["ay"])
        vs = min(1.0, (ls[0]["ay"] - b["y"] - 2) / (0.72 * ls[0]["fs"]),
                 (b["y"] + b["h"] - 0.3 - ls[-1]["ay"]) / (0.2 * ls[-1]["fs"]))
        for a, c in zip(ls, ls[1:]):
            if c["ay"] - a["ay"] > 0.5:
                vs = min(vs, (c["ay"] - a["ay"] - 1.5) / (0.72 * c["fs"] + 0.2 * a["fs"]))
        for t in ts:
            L, R = b["x"] + MARGEN, b["x"] + b["w"] - MARGEN
            avail = (2 * min(t["ax"] - L, R - t["ax"]) if t["anchor"] == "middle"
                     else t["ax"] - L if t["anchor"] == "end" else R - t["ax"])
            s = min(1.0, avail / t["bw"], vs)
            if s < 0.995:
                size = max(MINIMO, int(t["fs"] * s * 10) / 10)
                if t["fs"] * s < MINIMO:
                    notes.append(f"NO CABE ni a {MINIMO}px: «{t['text']}»")
                if size < t["fs"] - 0.05:
                    add(t, font_size=f"{size}px", letter_spacing="0")
    # 2 · bordes del dibujo
    groups, moved = {}, {}
    for t in T:
        if loose(t):
            groups.setdefault(t["x"], []).append(t)
    for ts in groups.values():
        sh = 0
        for t in ts:
            l, _, r, _ = ink(t)
            if l < t["vbx"] + 2: sh = max(sh, t["vbx"] + 2 - l)
            if r > t["vbx"] + t["vbw"] - 2: sh = min(sh, t["vbx"] + t["vbw"] - 2 - r)
        if abs(sh) > 0.05:
            for t in ts:
                moved[id(t)] = sh
                add(t, transform=f"translate({sh:.1f}px,0px)")
    # 3 · etiquetas sobre líneas
    for t in T:
        if not loose(t) or t["cls"] not in ("sv-t2", "sv-t3") or "paint-order" in t["style"]:
            continue
        if not hits(ink(t), pts):
            continue
        heading = bool(t["panel"] and t["anchor"] == "start" and t["ay"] - t["panel"]["y"] < 20)
        best = None
        if not heading:
            others = [ink(o) for o in T if o is not t and not o["rot"]]
            for d in range(1, DESPLAZAMIENTO_MAX + 1):
                for dx, dy in ((d, 0), (-d, 0), (0, -d / 2), (0, d / 2), (d, -d / 2), (-d, -d / 2)):
                    b = ink(t, dx, dy)
                    if b[0] < t["vbx"] + 2 or b[2] > t["vbx"] + t["vbw"] - 2 or hits(b, pts):
                        continue
                    if any(not (b[2] < o[0] - 2 or b[0] > o[2] + 2 or b[3] < o[1] - 1 or b[1] > o[3] + 1) for o in others):
                        continue
                    best = (dx + moved.get(id(t), 0), dy)
                    break
                if best:
                    break
        if best:
            add(t, transform=f"translate({best[0]:.1f}px,{best[1]:.1f}px)")
        else:
            color = HALO_PANEL if t["panel"] else HALO_FONDO
            add(t, paint_order="stroke", stroke=color, stroke_width="5px", stroke_linejoin="round")
            front.add((t["x"], t["y"], t["text"]))
    return rules, front, notes


TEXT = re.compile(r"<text\b([^>]*)>(.*?)</text>\n?", re.S)


def attr(a, n):
    m = re.search(r"\s" + n + r'="([^"]*)"', a)
    return m.group(1) if m else None


def apply(svg, rules, front):
    tail = []

    def rep(m):
        a, body = m.group(1), m.group(2)
        key = (attr(a, "x"), attr(a, "y"), html.unescape(re.sub(r"<[^>]+>", "", body)))
        if key in rules:
            st = attr(a, "style")
            props = {}
            for p in (st or "").split(";"):
                if ":" in p:
                    k, v = p.split(":", 1); props[k.strip()] = v.strip()
            props.update(rules[key])
            new = ";".join(f"{k}:{v}" for k, v in props.items())
            a = a.replace(f' style="{st}"', f' style="{new}"') if st is not None else a + f' style="{new}"'
        el = f"<text{a}>{body}</text>\n"
        if key in front:
            tail.append(el)
            return ""
        return el
    out = TEXT.sub(rep, svg)
    return out.replace("</svg>", "".join(tail) + "</svg>") if tail else out


def skeleton(s):
    """Lo que no debe cambiar: el SVG sin atributos style y con los <text> ordenados."""
    s = re.sub(r'\sstyle="[^"]*"', "", s)
    texts = sorted(TEXT.findall(s))
    return TEXT.sub("", s), texts


def main():
    from playwright.sync_api import sync_playwright
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_apply = "--aplicar" in sys.argv
    fonts = sys.argv[sys.argv.index("--fuentes") + 1] if "--fuentes" in sys.argv else None
    if fonts:
        args = [a for a in args if a != fonts]
    folder = os.path.join(WEB, args[0] if args else "data/nuevo-ciclo/svg")
    css = open(os.path.join(WEB, "data", "diagram.css"), encoding="utf-8").read()
    head = GOOGLE
    if fonts:
        u = lambda n: "file://" + os.path.abspath(os.path.join(fonts, n)).replace("\\", "/")
        head = ("<style>@font-face{font-family:Alegreya;src:url(%s);font-weight:400 900}"
                "@font-face{font-family:Alegreya;font-style:italic;src:url(%s)}"
                "@font-face{font-family:'Alegreya SC';src:url(%s);font-weight:400 700}</style>"
                % (u("alegreya.ttf"), u("alegreya_italic.ttf"), u("alegreya_sc.ttf")))
    files = sorted(glob.glob(os.path.join(folder, "*.svg")))
    total = fixed = 0
    with sync_playwright() as p:
        browser = None
        for ch in ((None,) if fonts else ("msedge", "chrome", None)):
            try:
                browser = p.chromium.launch(channel=ch) if ch else p.chromium.launch()
                break
            except Exception:
                continue
        if not browser:
            sys.exit("No encuentro Edge, Chrome ni Chromium para Playwright")
        page = browser.new_page()
        if fonts:  # las fuentes file:// solo cargan desde una página con origen file://
            page.goto("file://" + os.path.abspath(fonts).replace("\\", "/") + "/")
        page.set_content(PAGE % (head, css))
        page.evaluate("Promise.all(['400 14px Alegreya','700 14px Alegreya','500 12px \"Alegreya SC\"'].map(f => document.fonts.load(f)))")
        if not page.evaluate("document.fonts.check('700 14px Alegreya')"):
            sys.exit("No se ha cargado Alegreya (¿sin conexión? prueba con --fuentes): la medida no sería válida")
        for f in files:
            name = os.path.basename(f)
            svg = open(f, encoding="utf-8").read()
            changed, notes, count = svg, [], 0
            for _ in range(3):  # medir → ajustar → volver a medir
                page.evaluate("s => document.getElementById('host').innerHTML = s", changed)
                rules, front, notes = plan(page.evaluate(MEASURE))
                if not rules:
                    break
                count += len(rules)
                changed = apply(changed, rules, front)
            assert skeleton(changed) == skeleton(svg), name
            total += 1
            if changed != svg:
                fixed += 1
                print(f"{name}: {count} ajustes" + ("; " + "; ".join(notes) if notes else ""))
                if do_apply:
                    open(f, "w", encoding="utf-8", newline="\n").write(changed)
            elif notes:
                print(f"{name}: " + "; ".join(notes))
        browser.close()
    print(f"{total} esquemas · {fixed} con ajustes{' (aplicados)' if do_apply else ' (usa --aplicar)'}")


if __name__ == "__main__":
    main()
