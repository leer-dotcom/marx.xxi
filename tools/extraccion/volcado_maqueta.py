#!/usr/bin/env python3
"""Volcado de la maqueta de unas páginas de un PDF: una línea por línea de texto con x, y, fuente y tamaño.

Uso:  python volcado_maqueta.py RUTA/NC_005.pdf 3,4,10      (números de página del PDF, empezando en 1)

Columnas: x0  y0  fuente(últimos 12 car.)  tamaño | texto (62 car.)  [cambios de fuente/tamaño dentro de la línea]
Sirve para decidir qué es cabecera, título, subtítulo, epígrafe, cita, nota, llamada (superíndice), etc.
Requiere: pip install pymupdf
"""
import sys, pymupdf
d = pymupdf.open(sys.argv[1])
for i in [int(x) for x in sys.argv[2].split(',')]:
    print('=== pdf', i, d[i - 1].rect.width, 'x', d[i - 1].rect.height)
    for b in d[i - 1].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            sp = l['spans']
            if not sp: continue
            t = ''.join(s['text'] for s in sp); s0 = sp[0]
            fl = [(x['font'][-9:], round(x['size'], 1), x['text'][:5]) for x in sp if (x['font'], round(x['size'], 1)) != (s0['font'], round(s0['size'], 1))]
            print(round(l['bbox'][0]), round(l['bbox'][1]), s0['font'][-12:], round(s0['size'], 1), '|', t[:62], fl[:2] if fl else '')
