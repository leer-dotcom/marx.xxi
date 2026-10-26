#!/usr/bin/env python3
"""Aplica a los JSON de la app la entrada del número nuevo y las tablas de enmienda del cierre.

Lee NOTAS/out/volume.json (de notas_a_json.py) y NOTAS/numeroN-cierre.md (tablas «Tesis de Nuevo Ciclo», «Tesis
comunes» y lista «Conceptos puente»), y escribe data/nuevo-ciclo/content.json, data/library-synthesis.json,
data/files.json y data/library.json. Haz copia antes (o trabaja sobre una rama git): el script modifica en sitio.
Uso: python tools/nuevo_numero/aplicar_enmiendas.py N NOTAS [--fecha 2026-10-26] [--alinear 11=5]
  --alinear T=C  alinea la tesis nueva T de Nuevo Ciclo con la tesis común C (la tabla no lo dice; decídelo tú).
Decisiones que aplica: confirmada → añade «#N (autores)» a «dónde»; matizada → añade el texto propuesto al final de
la tesis y marca `revised`; nueva → tesis nueva al final con `added`; sin cambios → nada. Puentes: «ya puente» añade
los artículos n{N}; «nuevo puente» crea el puente y lo retira de los exclusivos de Marx XXI; «exclusivo» va a
only_nuevo_ciclo. Revisa el resultado con tools/estado_sintesis.py."""
import json,re,sys,pathlib,argparse,datetime
ap=argparse.ArgumentParser(); ap.add_argument('n',type=int); ap.add_argument('notas'); ap.add_argument('--fecha',default=datetime.date.today().isoformat()); ap.add_argument('--alinear',action='append',default=[])
A=ap.parse_args(); n=A.n; N=pathlib.Path(A.notas); root=pathlib.Path(__file__).resolve().parents[2]; tag=f'{A.fecha[:7]} · #{n:03d}'
md=(N/f'numero{n}-cierre.md').read_text(encoding='utf-8')
def sec(name):
    m=re.search(r'^## '+re.escape(name)+r'\n(.*?)(?=^## |\Z)',md,re.S|re.M); return m.group(1).strip()
def rows(t): return [[c.strip() for c in l.strip().strip('|').split('|')] for l in t.split('\n') if l.startswith('|') and not l.startswith('|---') and 'Decisión' not in l]
def mdclean(s): return s.replace('\\*','*').replace('*','')
def quoted(s):
    m=re.search(r'«(.*)»',s,re.S); return m.group(1).strip() if m else s
log=[]
nc=json.load(open(root/'data/nuevo-ciclo/content.json',encoding='utf-8')); th=nc['cross_volume']['theses']
for r in rows(sec('Tesis de Nuevo Ciclo: propuesta de enmienda')):
    num=int(re.match(r'(\d+)',r[0]).group(1)); dec=r[1].split()[0]; authors=re.sub(r'\s*\((?:matiz|de paso)\)','',r[2]).replace(';',',')
    if dec=='nueva':
        title=re.sub(r'^\d+ \(nueva\)\.\s*','',r[0]).strip(); title+='' if title.endswith('.') else '.'
        th.append({'title':title,'text':mdclean(quoted(r[3])),'where':f'#{n} ({authors})','added':tag}); log.append(f'NC {num}: nueva'); continue
    t=th[num-1]
    if dec in ('confirmada','matizada'): t['where']+=f' · #{n} ({authors})'
    if dec=='matizada': t['text']=t['text'].rstrip()+' '+mdclean(quoted(r[3])); t['revised']=tag
    log.append(f'NC {num}: {dec}')
ls=json.load(open(root/'data/library-synthesis.json',encoding='utf-8'))
for r in rows(sec('Tesis comunes: propuesta de enmienda')):
    num=int(re.match(r'(\d+)',r[0]).group(1)); dec=r[1].split()[0]; t=ls['theses'][num-1]
    if dec in ('confirmada','matizada'):
        t['application']=t['application'].rstrip()+f' En el #{n:03d}: '+mdclean(r[2])
        if r[3]!='sin cambios': t['where_nuevo_ciclo']=r[3]
        t['revised']=tag
    log.append(f'Común {num}: {dec}')
for al in A.alinear:
    tn,cn=map(int,al.split('=')); ls['theses'][cn-1]['nuevo_ciclo_theses']=sorted(set(ls['theses'][cn-1].get('nuevo_ciclo_theses',[])+[tn])); log.append(f'alineada NC {tn} → común {cn}')
bc={b['term']:b for b in ls['bridge_concepts']}
def find(term):
    if term in bc: return bc[term]
    for cand in [p.strip() for p in term.split('/')]:
        for k in bc:
            if cand.lower()==k.lower() or cand.lower() in k.lower() or k.lower() in cand.lower(): return bc[k]
    return None
for l in sec('Conceptos puente: propuesta').split('\n'):
    m=re.match(r'-\s*(.+?)\s*—\s*(ya puente|nuevo puente|exclusivo de \*?Nuevo Ciclo\*?)\s*(\((.*?)\))?\s*—\s*(.*)',l)
    if not m: continue
    term=m.group(1).strip(); kind=m.group(2); par=m.group(4) or ''; note=mdclean(m.group(5).strip()); ids=sorted(set(re.findall(rf'n{n}-a\d',note+' '+par)))
    if kind=='ya puente':
        b=find(term)
        if not b: log.append(f'?? puente no encontrado: {term}'); continue
        for a in ids:
            if not any(x['article']==a for x in b['nuevo_ciclo']): b['nuevo_ciclo'].append({'article':a,'term':term})
        b['note']=b['note'].rstrip()+' '+note.replace('Añadir ','')
    elif kind=='nuevo puente':
        mx=re.findall(r't\d-a\d+',par)
        ls['bridge_concepts'].append({'term':term,'note':note,'marx_xxi':[{'article':a,'term':term} for a in mx],'nuevo_ciclo':[{'article':a,'term':term} for a in ids],'added':tag})
        key=term.lower().split('/')[0].strip()[:8]; ls['only_marx_xxi']=[b for b in ls['only_marx_xxi'] if key not in b['term'].lower()]
        log.append(f'nuevo puente: {term}')
    else:
        ls['only_nuevo_ciclo'].append({'term':term,'article':', '.join(re.findall(r'n\d-a\d',par) or ids),'note':note})
v=json.load(open(N/'out/volume.json',encoding='utf-8'))
nc['volumes']=[x for x in nc['volumes'] if x['number']!=n]+[v['volume']]; nc['cross_refs']=[x for x in nc['cross_refs'] if not x['from'].startswith(f'n{n}-')]+v['cross_refs']; nc['content_version']=A.fecha
ntx=sum(len(x['articles']) for x in nc['volumes']); nv=len(nc['volumes'])
ls['library_synthesis_version']=A.fecha; PAL={1:'un',2:'dos',3:'tres',4:'cuatro',5:'cinco',6:'seis',7:'siete',8:'ocho',9:'nueve',10:'diez',11:'once',12:'doce'}
ls['intro']=re.sub(r'Nuevo Ciclo \([^)]*números, \d+ textos\)',f'Nuevo Ciclo ({PAL.get(nv,nv)} números, {ntx} textos)',ls['intro'])
json.dump(nc,open(root/'data/nuevo-ciclo/content.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
json.dump(ls,open(root/'data/library-synthesis.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
files=json.load(open(root/'data/files.json')); files=sorted(set(files)|{f'data/nuevo-ciclo/svg/{p.name}' for p in (root/'data/nuevo-ciclo/svg').glob('*.svg')}|{f'data/nuevo-ciclo/texto/{p.name}' for p in (root/'data/nuevo-ciclo/texto').glob('*.json')})
json.dump(files,open(root/'data/files.json','w'),indent=1)
lib=json.load(open(root/'data/library.json',encoding='utf-8')); lib['library_version']=A.fecha; json.dump(lib,open(root/'data/library.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('\n'.join(log)); print(f'{nv} números, {ntx} textos, {len(th)} tesis NC, {len(ls["bridge_concepts"])} puentes. Revisa a mano: arc.caption, lede, map.caption y colophon de cross_volume; description de library.json; mapa-biblioteca.svg.')
