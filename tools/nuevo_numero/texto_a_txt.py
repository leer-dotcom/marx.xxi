#!/usr/bin/env python3
"""Convierte los textos estructurados de un número (data/nuevo-ciclo/texto/n{N}-a*.json) en .txt planos con
marcas [p.N] al inicio de cada página impresa y las notas al pie al final, que es lo que leen las sesiones de notas.

Uso: python tools/nuevo_numero/texto_a_txt.py N DESTINO   (p. ej. 5 "../Marx XXI/txt/nc-art")
Aviso: sólo hay marca [p.N] en las páginas donde EMPIEZA un bloque; una página ocupada por una tabla o una figura
no deja marca. Las sesiones de notas infieren esas páginas por las notas al pie (que llevan «(p.N)»)."""
import json,re,sys,pathlib
n=int(sys.argv[1]); dest=pathlib.Path(sys.argv[2]); dest.mkdir(parents=True,exist_ok=True)
root=pathlib.Path(__file__).resolve().parents[2]
for f in sorted((root/'data/nuevo-ciclo/texto').glob(f'n{n}-a*.json')):
    d=json.load(open(f,encoding='utf-8')); i=d['number']
    title=d['title']+(' '+d['subtitle'] if d.get('subtitle') else '')
    out=[f"# {title}\n## {d['author']}\n[p.{d['printed_pages'][0]}]\n"]
    for b in d['blocks']:
        t=re.sub(r'\[\[p(\d+)\]\]',r'[p.\1]',b['text'])
        if b['t']=='h': out.append('\n'+'#'*b.get('level',2)+' '+t+'\n')
        elif b['t']=='q': out.append('> '+t+('\n> — '+b['cite'] if b.get('cite') else '')+'\n')
        elif b['t']=='ep': out.append('_'+t+'_'+(' — '+b['cite'] if b.get('cite') else '')+'\n')
        elif b['t']=='li': out.append(b.get('marker','•')+' '+t)
        else: out.append(t+'\n')
    out.append('\n## Notas\n')
    for k,v in sorted(d['notes'].items(),key=lambda x:int(x[0])): out.append(f"[^{k}] (p.{v.get('pg','?')}) {v['text']}")
    safe=re.sub(r'[^\w\s-]','',title)[:60].strip()
    fn=dest/f"N{n}_{i:02d} {safe}  {d['author']}.txt"; fn.write_text('\n'.join(out),encoding='utf-8')
    print(fn.name, len(' '.join(out).split()),'palabras')
