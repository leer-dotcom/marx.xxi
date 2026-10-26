#!/usr/bin/env python3
"""Construye la entrada del número para data/nuevo-ciclo/content.json a partir de las notas de lectura.

Entrada (carpeta NOTAS): a1.md … a6.md con el formato de docs/PLANTILLA-NOTAS.md, numeroN-cierre.md (formato de
docs/briefs/02-sintesis.md) y meta/n{N}-a{i}.json + meta/numero-N-mapa.json (los JSON que entregan las sesiones de
esquemas, con aria_label, caption y viewBox). Salida: NOTAS/out/volume.json con {volume, cross_refs}.
Uso: python tools/nuevo_numero/notas_a_json.py N NOTAS [--mes 2026-09] [--issn 3101-5433] [--pages 144]"""
import json,re,sys,pathlib,argparse
ap=argparse.ArgumentParser(); ap.add_argument('n',type=int); ap.add_argument('notas'); ap.add_argument('--mes',required=True); ap.add_argument('--issn',default=None); ap.add_argument('--dl',default=None); ap.add_argument('--pages',type=int,default=None)
A=ap.parse_args(); n=A.n; N=pathlib.Path(A.notas); root=pathlib.Path(__file__).resolve().parents[2]
MESES={'01':'enero','02':'febrero','03':'marzo','04':'abril','05':'mayo','06':'junio','07':'julio','08':'agosto','09':'septiembre','10':'octubre','11':'noviembre','12':'diciembre'}
def sections(md):
    parts=re.split(r'\n### ',md); out={}
    for p in parts[1:]:
        name,_,body=p.partition('\n'); out[name.strip()]=body.strip()
    return parts[0],out
def paras(t): return [x.strip() for x in re.split(r'\n\s*\n',t) if x.strip()]
def items(t): return [re.sub(r'^\s*(\d+\.|-)\s*','',l).strip() for l in t.split('\n') if re.match(r'^\s*(\d+\.|-)\s',l)]
def mdclean(s): return s.replace('\\*','*').replace('*','')
arts=[]
for f in sorted(N.glob('a[0-9].md')):
    i=int(f.stem[1:]); head,sec=sections(f.read_text(encoding='utf-8'))
    src=json.load(open(root/f'data/nuevo-ciclo/texto/n{n}-a{i}.json',encoding='utf-8'))
    meta=json.load(open(N/f'meta/n{n}-a{i}.json',encoding='utf-8'))
    m=re.search(r'\*\*Autor/a:\*\* (.+?)\s+·',head); author=m.group(1).strip()
    interview=src['interview']; p1,p2=src['printed_pages']
    arg=[]
    for it in items(sec['Estructura argumental']):
        mm=re.match(r'\*\*(.+?)\*\*\s*(.*)',it,re.S); arg.append({'title':mdclean(mm.group(1).strip()),'text':mdclean(mm.group(2).strip())} if mm else {'title':it,'text':''})
    concepts=[]
    for it in items(sec['Conceptos clave']):
        mm=re.match(r'\*\*(.+?)\*\*\s*[—–-]\s*(.*)',it,re.S)
        if mm: concepts.append({'term':mdclean(mm.group(1).strip()),'definition':mdclean(mm.group(2).strip())})
    q=re.search(r'>\s*(«.*?»)\s*\[p\.(\d+(?:-\d+)?)\]',sec['Cita'],re.S); qtext=q.group(1).replace('\n',' ').strip(); qpage=int(q.group(2).split('-')[0])
    title=src['title']+(' '+src['subtitle'] if src.get('subtitle') and not interview else '')
    if interview:
        who=src['author']; a_author=f'Entrevista con {who} · preguntas de la redacción'; interviewee=who
        qsource=f'{who}, entrevista en Nuevo Ciclo #{n:03d} (p. {qpage})'
    else:
        a_author=author; interviewee=None; qsource=f"{author}, {src['title'].rstrip(':')} (p. {qpage})"
    words=sum(len(b['text'].split()) for b in src['blocks'])
    arts.append({'id':f'n{n}-a{i}','number':i,'type':'interview' if interview else 'article','title':title,'author':a_author,'interviewee':interviewee,
      'summary':[mdclean(p) for p in paras(sec['Resumen'])],'argument':arg,
      'diagrams':[{'file':meta['file'],'aria_label':meta['aria_label'],'caption':meta['caption'],'viewBox':meta['viewBox_simple'],'viewBox_detailed':meta.get('viewBox_detailed')}],
      'concepts':concepts,'quote':{'text':qtext,'source':qsource,'page':qpage},'conclusion':[mdclean(p) for p in paras(sec['Conclusión del artículo'])],
      'references':mdclean(' '.join(paras(sec['Interlocutores']))),'arc_position':mdclean(' '.join(paras(sec.get('Posición en el arco','')))),
      'text_file':f'nuevo-ciclo/texto/n{n}-a{i}.json','source_text_file':f'nuevo-ciclo/texto/n{n}-a{i}.json','word_count':words,'words_txt':words,
      'printed_pages':{'from':p1,'to':p2},'pdf_pages':{'from':p1,'to':p2,'note':'una página del PDF = una página impresa'}})
md=(N/f'numero{n}-cierre.md').read_text(encoding='utf-8')
def sec(name):
    m=re.search(r'^## '+re.escape(name)+r'\n(.*?)(?=^## |\Z)',md,re.S|re.M); return m.group(1).strip()
concl=[{'title':m.group(1).strip(),'text':mdclean(m.group(2).strip())} for l in sec('Conclusiones del número').split('\n') if (m:=re.match(r'-\s*\*\*(.+?)\*\*\s*(.*)',l))]
rels=[{'pair':m.group(1),'concept':m.group(2).strip(),'text':mdclean(m.group(3).strip())} for l in sec('Cómo se relacionan los artículos').split('\n') if (m:=re.match(r'-\s*(Art\. \d+ ↔ Art\. \d+)\s*—\s*(.+?)\s*—\s*(.*)',l))]
xrefs=[]
for l in sec('Referencias cruzadas').split('\n'):
    m=re.match(r'-\s*(n\d-a\d)\s*→\s*(.+?)\s*—\s*(cita|tema|autor)\s*—\s*(.*)',l)
    if m: xrefs+=[{'from':m.group(1),'to':t.strip(),'kind':m.group(3),'why':mdclean(m.group(4).strip())} for t in m.group(2).split(',')]
angle=sec('Ángulo del número'); sub=re.search(r'«(.+?)»',angle.split('Subtítulo de ficha')[1]).group(1)
cap=json.load(open(N/f'meta/numero-{n}-mapa.json',encoding='utf-8'))['caption']
yy,mm=A.mes.split('-')
vol={'number':n,'id':f'numero-{n}','slug':f'nuevo-ciclo-{n:03d}','title':f'Nuevo Ciclo #{n:03d}','label':f'#{n:03d}','year':int(yy),'month':A.mes,'pdf':f'NC_{n:03d}.pdf','url':f'https://marxxxi.com/products/nuevo-ciclo-{n:03d}','pages':A.pages,'editor':'Asociación Nuevo Ciclo','issn':A.issn,'deposito_legal':A.dl,
 'eyebrow':f'Nuevo Ciclo · #{n:03d} · {MESES[mm]} de {yy}','subtitle':sub,'presentation':[],'source_text_files':{'presentation':None},'data_notes':mdclean(sec('Datos del número')),'articles':arts,'conclusions':concl,
 'concept_map':{'file':f'nuevo-ciclo/svg/numero-{n}-mapa.svg','caption':cap,'viewBox':(re.search(r'viewBox="([^"]+)"',(root/f'data/nuevo-ciclo/svg/numero-{n}-mapa.svg').read_text(encoding='utf-8')).group(1) if (root/f'data/nuevo-ciclo/svg/numero-{n}-mapa.svg').exists() else None)},'relations':rels,'presentation_text':None}
(N/'out').mkdir(exist_ok=True); json.dump({'volume':vol,'cross_refs':xrefs},open(N/'out/volume.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(arts),'textos',len(concl),'conclusiones',len(rels),'relaciones',len(xrefs),'referencias cruzadas →',N/'out/volume.json')
