import re
import sys, os, json, collections, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract
# Rutas (variables de entorno): MX_PDF_DIR = carpeta con mxxi1.pdf… · MX_WEB = carpeta MarxXXI-web (para data/content.json) · MX_OUT = carpeta de salida
SRC = os.environ.get('MX_PDF_DIR', '.')
WEB = os.environ.get('MX_WEB', '../..')
OUT = os.environ.get('MX_OUT', 'salida_extraccion')
content = json.load(open(os.path.join(WEB, 'data', 'content.json'), encoding='utf-8'))
MINP = {1: 1, 2: 1, 3: 6, 4: 6, 5: 6}
only = sys.argv[1:]
out = {}
report = []
for v in content['volumes']:
    n = v['number']
    if only and str(n) not in only and not any(o.startswith(f't{n}') for o in only): continue
    pages, vocab, starts, log = extract.run_volume(n, f'{SRC}/mxxi{n}.pdf', None, None, MINP[n])
    ids = ([f'tomo-{n}-presentacion'] if v.get('presentation_text') else []) + [a['id'] for a in v['articles']]
    if len(ids) != len(starts):
        print('!! vol', n, 'inicios', starts, ids); continue
    ends = starts[1:] + [len(pages)]
    ends = [e - 1 for e in ends[:-1]] + [len(pages)]
    notes_by, pend, probs = extract.collect_notes(pages, vocab, ids, starts, ends, [])
    for pr in probs: print('   !!', pr)
    for fx in extract.repair_embedded_markers(pages, ids, starts, ends, notes_by): print('   ~~', fx)
    for x in extract.NOTE_LOG: print('   nota:', x)
    extract.NOTE_LOG.clear()
    print('  sup fixes:', len(extract.SUPFIX_LOG)); [print('     ', x) for x in extract.SUPFIX_LOG]; extract.SUPFIX_LOG.clear()
    for aid, f, l in zip(ids, starts, ends):
        if only and not any(aid == o or o == str(n) for o in only): continue
        lg = []
        rec = extract.article_record(n, aid, pages, vocab, f, l, lg, None, None, notes_by[aid])
        _nt = [v['text'][:25] for v in rec['notes'].values()]
        _keep = []
        for _b in rec['blocks']:
            if _b['t'] == 'q' and re.match(r'\d{1,3}\s+', _b['text']) and any(_b['text'][len(re.match(r'\d{1,3}\s+', _b['text']).group(0)):].startswith(x) for x in _nt):
                print('   dup-note-block removed', aid, _b['text'][:40]); continue
            _keep.append(_b)
        rec['blocks'] = _keep
        art = next((a for a in v['articles'] if a['id'] == aid), None)
        rec['id'] = aid; rec['vol'] = n
        rec['hyphen_log'] = lg
        inp, outc = extract.coverage(pages, f, l, rec)
        c = set(rec['cited']); nn = set(int(k) for k in rec['notes'])
        rec['check'] = dict(chars_in=inp, chars_out=outc, cited_without_note=sorted(c - nn), note_without_marker=sorted(nn - c),
                            dup_markers=sorted(k for k, m in collections.Counter(rec['cited']).items() if m > 1))
        out[aid] = rec
        os.makedirs(OUT, exist_ok=True)
        json.dump(rec, open(os.path.join(OUT, f'{aid}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        ck = rec['check']
        print(aid, f, l, 'blocks', len(rec['blocks']), 'notes', len(rec['notes']), 'in/out', inp, outc, 'diff', outc - inp,
              'sin_nota', ck['cited_without_note'][:6], 'sin_marca', ck['note_without_marker'][:6], 'warn', len(rec['warnings']))
