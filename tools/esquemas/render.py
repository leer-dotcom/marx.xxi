#!/usr/bin/env python3
"""Renderiza un esquema SVG como lo hace la web (data/diagram.css + Alegreya) y lista problemas de encaje.

Uso:  python3 render.py ESQUEMA.svg SALIDA.png [--dark] [--width 760] [--json]
Imprime un informe: textos que se salen de su caja (margen 7 px), textos fuera del viewBox, textos que
pisan líneas/flechas, cuerpo de letra efectivo < 9.5 px, y tamaño del dibujo. Con --json imprime JSON.
"""
import sys, os, json, re, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
FONTS = HERE / 'fonts'
CSS = (HERE.parent.parent / 'data' / 'diagram.css').read_text(encoding='utf-8')
MARGEN, MINIMO = 7, 9.5
FACE = """<style>
@font-face{font-family:Alegreya;font-weight:400;src:url(%(d)s/alegreya-400.woff2)}
@font-face{font-family:Alegreya;font-weight:500;src:url(%(d)s/alegreya-500.woff2)}
@font-face{font-family:Alegreya;font-weight:700;src:url(%(d)s/alegreya-700.woff2)}
@font-face{font-family:Alegreya;font-style:italic;src:url(%(d)s/alegreya-italic.woff2)}
@font-face{font-family:'Alegreya SC';font-weight:400;src:url(%(d)s/alegreya-sc-400.woff2)}
@font-face{font-family:'Alegreya SC';font-weight:500;src:url(%(d)s/alegreya-sc-500.woff2)}
</style>""" % {'d': 'file://' + str(FONTS)}
PAGE = """<!doctype html><html><head><meta charset="utf-8">%s<style>%s
body{margin:0;background:#efecec} .wrap{padding:12px} .dg{padding:10px;border-radius:4px}
</style></head><body><div class="wrap"><div class="dg %s" id="host" style="width:%dpx"></div></div></body></html>"""

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
   const cs = getComputedStyle(t), r = t.getBoundingClientRect();
   out.push({text: t.textContent, ax, ay, rot, fs: parseFloat(cs.fontSize), anchor: cs.textAnchor,
     cls: t.getAttribute('class') || '', box, vbx: vb.x, vby: vb.y, vbw: vb.width, vbh: vb.height,
     left: (r.left - sr.left) * k + vb.x, right: (r.right - sr.left) * k + vb.x, width: r.width * k,
     top: (r.top - sr.top) * k + vb.y, bottom: (r.bottom - sr.top) * k + vb.y});
 }
 return {texts: out, pts, vb: {w: vb.width, h: vb.height}, n_rects: rects.length};
}"""

def analyse(m):
    issues = []
    T = m['texts']
    for t in T:
        if t['rot']: continue
        if t['box'] and not t['box']['soft']:
            b = t['box']; L, R = b['x'] + MARGEN, b['x'] + b['w'] - MARGEN
            if t['left'] < L - 0.5 or t['right'] > R + 0.5:
                issues.append({'tipo': 'caja', 'texto': t['text'], 'detalle': f"se sale {max(L - t['left'], t['right'] - R):.0f} px de su caja (ancho {b['w']:.0f})"})
            if t['top'] < b['y'] - 0.5 or t['bottom'] > b['y'] + b['h'] + 0.5:
                issues.append({'tipo': 'caja', 'texto': t['text'], 'detalle': 'pisa el borde superior/inferior de su caja'})
        if t['left'] < t['vbx'] + 1 or t['right'] > t['vbx'] + t['vbw'] - 1 or t['bottom'] > t['vby'] + t['vbh'] + 1 or t['top'] < t['vby'] - 1:
            issues.append({'tipo': 'viewbox', 'texto': t['text'], 'detalle': 'se sale del dibujo'})
        if t['fs'] < MINIMO:
            issues.append({'tipo': 'fuente', 'texto': t['text'], 'detalle': f'cuerpo {t["fs"]:.1f} px'})
        if (not t['box'] or t['box']['soft']) and t['cls'] in ('sv-t2', 'sv-t3'):
            ink = (t['left'], t['ay'] - 0.72 * t['fs'], t['right'], t['ay'] + 0.2 * t['fs'])
            if any(ink[0] - 1.5 <= X <= ink[2] + 1.5 and ink[1] - 1.5 <= Y <= ink[3] + 1.5 for X, Y in m['pts']):
                issues.append({'tipo': 'linea', 'texto': t['text'], 'detalle': 'pisa una línea o flecha'})
    # solapes entre textos
    boxes = [(t['left'], t['top'], t['right'], t['bottom'], t['text']) for t in T if not t['rot']]
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            ov_y = min(a[3], b[3]) - max(a[1], b[1]); ov_x = min(a[2], b[2]) - max(a[0], b[0])
            if ov_x > 2 and ov_y > 0.45 * min(a[3] - a[1], b[3] - b[1]):
                issues.append({'tipo': 'solape', 'texto': a[4], 'detalle': f'se solapa con «{b[4]}»'})
    return issues

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dark = '--dark' in sys.argv
    width = int(sys.argv[sys.argv.index('--width') + 1]) if '--width' in sys.argv else 760
    src, out = args[0], (args[1] if len(args) > 1 else None)
    svg = open(src, encoding='utf-8').read()
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': width + 48, 'height': 800})
        pg.goto('file://' + str(FONTS) + '/')
        pg.set_content(PAGE % (FACE, CSS, 'dark' if dark else '', width))
        pg.evaluate("Promise.all(['400 14px Alegreya','700 14px Alegreya','500 12px \"Alegreya SC\"'].map(f => document.fonts.load(f)))")
        assert pg.evaluate("document.fonts.check('700 14px Alegreya')"), 'Alegreya no cargada'
        pg.evaluate("s => document.getElementById('host').innerHTML = s", svg)
        m = pg.evaluate(MEASURE)
        issues = analyse(m)
        if out:
            pg.query_selector('.wrap').screenshot(path=out)
        b.close()
    rep = {'file': os.path.basename(src), 'viewBox': m['vb'], 'rects': m['n_rects'], 'texts': len(m['texts']), 'issues': issues}
    if '--json' in sys.argv:
        print(json.dumps(rep, ensure_ascii=False))
    else:
        print(f"{rep['file']}: viewBox {m['vb']['w']:.0f}x{m['vb']['h']:.0f}, {m['n_rects']} rect, {len(m['texts'])} textos, {len(issues)} problemas")
        for i in issues:
            print(f"  [{i['tipo']}] «{i['texto']}» — {i['detalle']}")

if __name__ == '__main__':
    main()
