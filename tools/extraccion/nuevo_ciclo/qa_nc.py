import json,glob,os,re,sys
for f in sorted(glob.glob(os.path.join(sys.argv[1] if len(sys.argv) > 1 else '.', 'nc*.json'))):
    d=json.load(open(f)); B=d['blocks']
    for i,b in enumerate(B):
        if b['t']=='tabla': continue
        t=re.sub(r'\[\[p\d+\]\]|\[\^\d+\]','',b['text']).strip()
        if b['t'] in('p','qn') and t and t[0].islower() and not b.get('cont'): print('LOWER',d['id'],i,b['pg'],repr(t[:50]),'| prev',repr(B[i-1]['text'][-40:]) if i else '')
        if b['t'] in('p','q','qn') and t and not re.search(r'[.!?:;»”")\]…*]\s*$',t): print('NOEND',d['id'],i,b['pg'],b['t'],repr(t[-50:]),'| next',B[i+1]['t'] if i+1<len(B) else '')
        if b['t']=='p' and len(t)<40: print('SHORT',d['id'],i,b['pg'],repr(t))
