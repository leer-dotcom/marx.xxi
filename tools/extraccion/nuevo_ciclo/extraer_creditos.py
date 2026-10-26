#!/usr/bin/env python3
"""Extrae la página de créditos (ficha técnica, pág. 2 del PDF) de un número de «Nuevo Ciclo».

Uso:  python extraer_creditos.py RUTA/NC_005.pdf --numero 5 --salida CARPETA [--pagina 2]
Escribe CARPETA/ncN-creditos.json:
  {id, issue, pdf_page, items:[{label, text}], license}
  - label: rótulo en Zenon SemiBold («Primera edición», «ISSN»…, sin los dos puntos finales);
  - text: su valor (las líneas se unen con espacio);
  - license: la nota en cursiva del pie (licencia de uso libre).
Requiere: pip install pymupdf
"""
import argparse, json, os, re, pymupdf

ap = argparse.ArgumentParser()
ap.add_argument('pdf'); ap.add_argument('--numero', type=int, required=True)
ap.add_argument('--salida', required=True); ap.add_argument('--pagina', type=int, default=2)
a = ap.parse_args()
pg = pymupdf.open(a.pdf)[a.pagina - 1]
lines = []
for b in pg.get_text('dict')['blocks']:
    for l in b.get('lines', []):
        t = ''.join(s['text'] for s in l['spans']).strip()
        if t: lines.append((round(l['bbox'][1]), l['spans'][0]['font'], t))
lines.sort()
items, lic, cur = [], [], None
for y, f, t in lines:
    if 'Italic' in f: lic.append(t)
    elif 'SemiBold' in f:
        cur = {'label': t.rstrip(':').strip(), 'text': ''}; items.append(cur)
    elif cur is not None:
        t = t.replace('­', '')
        cur['text'] = (cur['text'] + ('' if cur['text'].endswith('-') else ' ') + t).strip() if cur['text'] else t
rec = dict(id='nc%d-creditos' % a.numero, issue=a.numero, pdf_page=a.pagina, items=items, license=re.sub(r'\s+', ' ', ' '.join(lic)).strip())
os.makedirs(a.salida, exist_ok=True)
out = os.path.join(a.salida, 'nc%d-creditos.json' % a.numero)
json.dump(rec, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out); [print(' ', i['label'], '→', i['text'][:90]) for i in items]; print('  licencia:', rec['license'][:80])
