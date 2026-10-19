import json,glob,os,re,sys,collections
OUT=sys.argv[1]
os.makedirs(OUT,exist_ok=True)
C=json.load(open(os.path.join(os.environ.get('MX_WEB','../..'),'data','content.json')))
meta={}
for v in C['volumes']:
    for a in v['articles']: meta[a['id']]=(v['number'],a['number'],a['title'],a['author'])
PRES={'tomo-1-presentacion':('Presentación',),'tomo-2-presentacion':('Presentación',),'tomo-5-presentacion':('Nota introductoria',)}
index=[];report=[]
for f in sorted(glob.glob(os.path.join(os.environ.get('MX_OUT','salida_extraccion'),'*.json'))):
    d=json.load(open(f)); aid=d['id']
    if aid in meta: vol,num,title,author=meta[aid]
    else: vol,num,title,author=d['vol'],None,PRES[aid][0],None
    allt=' '.join(b['text']+' '+b.get('cite','') for b in d['blocks'])+' '+' '.join(str(x) for x in d.get('title_notes',[]))
    called=set(int(x) for x in re.findall(r'\[\^(\d+)\]',allt))|set(int(x) for x in d.get('title_notes',[]))
    notes={str(k):v for k,v in d['notes'].items()}
    unanch=sorted((int(k) for k in notes if int(k) not in called))
    missing=sorted(called-set(int(k) for k in notes))
    blocks=[]
    for b in d['blocks']:
        nb={'t':b['t'],'text':b['text'],'pg':b['pg']}
        if b['t']=='h': nb['level']=b['level']
        for k in ('marker','cite','cont'):
            if b.get(k): nb[k]=b[k]
        blocks.append(nb)
    rec={'id':aid,'vol':vol,'number':num,'title':title,'title_pdf':d['title_pdf'],'author':author,'author_pdf':d['author_pdf'],
         'pdf_pages':d['pdf_pages'],'printed_pages':d['pages'],'blocks':blocks,'notes':notes,'title_notes':[int(x) for x in d.get('title_notes',[])],'unanchored_notes':unanch}
    json.dump(rec,open(os.path.join(OUT,aid+'.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
    index.append({'id':aid,'vol':vol,'title':title,'blocks':len(blocks),'notes':len(notes),'unanchored':unanch,'missing':missing,
      'chars_in':d['check']['chars_in'],'chars_out':d['check']['chars_out']})
json.dump(index,open(os.path.join(OUT,'_indice.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(index),'ficheros;', 'sin llamada:',[(i['id'],i['unanchored']) for i in index if i['unanchored']],'llamadas sin nota:',[(i['id'],i['missing']) for i in index if i['missing']])
