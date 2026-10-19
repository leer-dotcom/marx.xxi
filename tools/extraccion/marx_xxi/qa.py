import json,glob,os,re,collections
tot=collections.Counter()
for f in sorted(glob.glob(os.path.join(os.environ.get('MX_OUT','salida_extraccion'),'*.json'))):
    r=json.load(open(f)); aid=r['id']
    for i,b in enumerate(r['blocks']):
        t=re.sub(r'\[\[p\d+\]\]|\[\^\d+\]','',b['text']).strip()
        if b['t'] in ('p','q','li') and t:
            if re.match(r'^[a-záéíóúñ]',t) and not b.get('cont'):
                tot['starts_lower']+=1
                if tot['starts_lower']<=25: print('LOWER',aid,i,b['pg'],repr(t[:70]),'| prev end:',repr(re.sub(r'\[\[p\d+\]\]|\[\^\d+\]','',r['blocks'][i-1]['text'])[-40:]) if i else '')
            if b['t']=='p' and not re.search(r'[.?!:;»”"\)…\]\*]$',t) and len(t)>200:
                tot['no_end']+=1
                if tot['no_end']<=15: print('NOEND',aid,i,b['pg'],repr(t[-60:]))
    for i,b in enumerate(r['blocks']):
        t=b['text']
        if re.search(r'\S\[\[p\d+\]\]\S',t): tot['pb_glued']+=1
        if '  ' in t: tot['dblspace']+=1
print(dict(tot))
