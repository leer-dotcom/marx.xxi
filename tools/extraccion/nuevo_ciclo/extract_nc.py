# Extractor de «Nuevo Ciclo» (NC_001–004.pdf): texto estructurado con títulos, notas, páginas, citas y entrevistas.
import pymupdf, re, os, json, statistics, collections, sys

HOME = os.path.expanduser('~')
SRC = os.environ.get('NC_PDF_DIR', '.')   # solo lo usa el antiguo análisis en .md (parse_md); extraer_nc.py no lo necesita
HDR_Y = 56  # banda de cabecera (coordenadas ya escaladas)
WORDRE = re.compile(r"[A-Za-zÀ-ÿÑñ]+")
LISTSTART = re.compile(r'^\s*((?:\d{1,2}[.)]|[a-z]\)|[•▪‣◦·]))\s+')
NOTESTART = re.compile(r'^\s*(\d{1,3})\s*\.\s+(?=\S)')
SUPRE = re.compile(r'^[\d,\s]+$')
TERM = re.compile(r'[.!?:;»”")\]…]\s*$')


def isit(f): return 'Italic' in f
def isbd(f): return ('SemiBold' in f or 'Bold' in f or 'Black' in f) and 'Italic' not in f


def dominant(spans, key):
    c = collections.Counter()
    for s in spans: c[s[key]] += len(s['t'].strip())
    return c.most_common(1)[0][0]


def load_lines(path, k=1.0):
    """k = factor de escala (tamaño de cuerpo / 12): reduce tamaños y coordenadas a la maqueta estándar."""
    d = pymupdf.open(path)
    pages = []
    for i, p in enumerate(d):
        lines = []
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                sp = [dict(t=s['text'], font=s['font'], size=round(s['size'] / k, 1)) for s in l['spans'] if s['text'] != '']
                if not sp or not ''.join(s['t'] for s in sp).strip(): continue
                L = dict(spans=sp, x0=l['bbox'][0] / k, x1=l['bbox'][2] / k, y=l['bbox'][1] / k)
                big = max((s['size'] for s in sp if re.search(r'[A-Za-zÀ-ÿ]', s['t'])), default=max(s['size'] for s in sp))
                for s in sp:
                    s['sup'] = (s['size'] <= 7.1 or s['size'] <= 0.62 * big) and bool(SUPRE.match(s['t'].strip())) and s['t'].strip() != '' and s['size'] < big
                core = [s for s in sp if not s['sup']] or sp
                n = sum(len(s['t'].strip()) for s in core) or 1
                L['size'] = dominant(core, 'size'); L['font'] = dominant(core, 'font')
                L['it'] = sum(len(s['t'].strip()) for s in core if isit(s['font'])) / n
                L['bd'] = sum(len(s['t'].strip()) for s in core if isbd(s['font'])) / n
                L['chars'] = n
                L['text'] = ''.join(s['t'] for s in sp)
                lines.append(L)
        lines.sort(key=lambda L: (round(L['y']), L['x0']))
        pages.append(dict(pdf=i + 1, lines=lines))
    return pages


def line_segs(L):
    out = []
    for s in L['spans']:
        t = s['t']
        if s['sup']:
            for n in re.findall(r'\d+', t): out.append(('[^%s]' % n, None, None))
            continue
        out.append((t, isit(s['font']), isbd(s['font'])))
    # quitar espacios finales de la línea
    while out and out[-1][1] is not None and not out[-1][0].strip(): out.pop()
    if out and out[-1][1] is not None: out[-1] = (out[-1][0].rstrip(), out[-1][1], out[-1][2])
    return out


def seg_join(a, b):
    if not a: return list(b)
    if not b: return a
    last = next((x for x in reversed(a) if x[1] is not None), None)
    first = next((x for x in b if x[1] is not None), None)
    st = (last[1], last[2]) if last and first and (last[1], last[2]) == (first[1], first[2]) else (False, False)
    return a + [(' ', st[0], st[1])] + list(b)


def serialize(segs):
    merged = []
    for t, it, bd in segs:
        if it is None: merged.append([t, None, None]); continue
        if merged and merged[-1][1] == it and merged[-1][2] == bd: merged[-1][0] += t
        else: merged.append([t, it, bd])
    out = ''
    for t, it, bd in merged:
        if it is None: out += t; continue
        t = t.replace('*', '\\*')
        lead = t[:len(t) - len(t.lstrip())]; trail = t[len(t.rstrip()):]; core = t.strip()
        if not core: out += t; continue
        o = c = ''
        if bd: o += '**'; c = '**' + c
        if it: o += '*'; c = '*' + c
        out += lead + o + core + c + trail
    return re.sub(r'[ \t]+', ' ', out).strip()


def strip_prefix(segs, n):
    out = []; left = n
    for t, it, bd in segs:
        if left > 0 and it is not None:
            k = min(left, len(t)); t = t[k:]; left -= k
        out.append((t, it, bd))
    return out


def plain(segs): return ''.join(t for t, it, bd in segs)


class Vocab:
    def __init__(self): self.words = collections.Counter(); self.hyph = set()
    def feed(self, text):
        for m in re.finditer(r"[A-Za-zÀ-ÿÑñ]+(?:-[A-Za-zÀ-ÿÑñ]+)+", text): self.hyph.add(m.group(0).lower())
        for w in WORDRE.findall(text): self.words[w.lower()] += 1


def build_vocab(allpages):
    v = Vocab()
    for pages in allpages:
        for p in pages:
            for L in p['lines']:
                if L['y'] < HDR_Y or L['size'] > 12.6 or L['size'] < 10.9: continue
                t = L['text'].rstrip()
                if t.endswith('-'): t = re.sub(r"[A-Za-zÀ-ÿÑñ]+-$", '', t)
                v.feed(t)
    return v


def hyphen_decision(prev_segs, next_segs, vocab, log, ctx):
    """prev_segs termina en '-'. Devuelve (prev, next, unido?, primera_palabra_len_en_next)."""
    pt, nt = plain(prev_segs).rstrip(), plain(next_segs).lstrip()
    m1 = re.search(r"([A-Za-zÀ-ÿÑñ]+)(-|­)$", pt); m2 = re.match(r"([A-Za-zÀ-ÿÑñ]+)", nt)
    if pt.endswith('­'): return strip_trailing(prev_segs), next_segs, True
    if not m1 or not m2: return prev_segs, next_segs, False
    a, b = m1.group(1), m2.group(1)
    j, h = (a + b).lower(), (a + '-' + b).lower()
    if h in vocab.hyph and j not in vocab.words:
        log.append('%s: «%s-%s» → conservado el guion' % (ctx, a, b)); return prev_segs, next_segs, False
    if b[0].isupper():
        log.append('%s: «%s-%s» → conservado el guion (mayúscula)' % (ctx, a, b)); return prev_segs, next_segs, False
    if j not in vocab.words: log.append('%s: «%s-%s» → unido «%s» (palabra no vista en otro sitio)' % (ctx, a, b, a + b))
    return strip_trailing(prev_segs), next_segs, True


def strip_trailing(segs):
    segs = list(segs)
    for i in range(len(segs) - 1, -1, -1):
        t, it, bd = segs[i]
        if it is None: continue
        t2 = t.rstrip()
        if t2.endswith('-') or t2.endswith('­'): segs[i] = (t2[:-1], it, bd); return segs
        if t2: break
    return segs


# ------------------------------------------------------------------ índice (md del análisis)
def parse_md():
    md = open(os.path.join(SRC, 'Nuevo Ciclo, cuatro números.md'), encoding='utf-8').read()
    arts = {}
    issue = None; cur = None
    for ln in md.split('\n'):
        m = re.match(r'# Nuevo Ciclo #00(\d)', ln)
        if m: issue = int(m.group(1)); continue
        m = re.match(r'## A(\d+) · (.+)', ln)
        if m and issue:
            cur = dict(issue=issue, n=int(m.group(1)), title_md=m.group(2).strip()); arts.setdefault(issue, []).append(cur); continue
        m = re.match(r'\*\*Autor/a:\*\*\s*(.+?)\s+·\s+\*\*Páginas:\*\*\s*(\d+)\s*[-–]\s*(\d+)', ln)
        if m and cur and 'author' not in cur:
            cur['author'] = m.group(1).strip(); cur['p0'] = int(m.group(2)); cur['p1'] = int(m.group(3))
    return arts


# ------------------------------------------------------------------ tabla
def table_page(p):
    body = [L for L in p['lines'] if L['y'] >= HDR_Y and 11.5 <= L['size'] <= 12.6 and L['chars'] >= 25 and L['font'].endswith('Book')]
    nums = [L for L in p['lines'] if L['y'] >= HDR_Y and 10.9 <= L['size'] <= 11.1 and re.match(r'^[\d.,%\s\u00a0]+$', L['text'].strip())]
    return not body and len(nums) >= 6


def build_table(lines):
    ys = [L['y'] for L in lines if re.match(r'\s*Tabla\s*\d', L['text'])]
    capl = [L for L in lines if ys and L['y'] >= min(ys) - 1 and L['size'] <= 10.2]
    rest = [L for L in lines if L not in capl]
    nums = [L for L in rest if 10.9 <= L['size'] <= 11.1 and re.match(r'^[\d.,%\s\u00a0]+$', L['text'].strip())]
    heads = [L for L in rest if L['size'] >= 12 and L not in nums]
    labels = [L for L in rest if L not in nums and L not in heads]
    labels.sort(key=lambda L: L['y'])
    clusters = []
    for L in labels:
        if clusters and abs(L['x0'] - clusters[-1][-1]['x0']) < 12 and 0 < L['y'] - clusters[-1][-1]['y'] <= 11 and abs(L['size'] - clusters[-1][-1]['size']) < .5 and L['font'] == clusters[-1][-1]['font']: clusters[-1].append(L)
        else: clusters.append([L])
    rows = []
    for c in clusters:
        y0, y1 = c[0]['y'], c[-1]['y']
        rows.append(dict(y=(y0 + y1) / 2, y0=y0, y1=y1, label=' '.join(x['text'].strip() for x in c).replace('- ', '-') if False else ' '.join(x['text'].strip() for x in c), cells=[]))
    extra = []
    for L in sorted(nums, key=lambda L: L['y']):
        best = min(rows, key=lambda r: abs(r['y'] - L['y'])) if rows else None
        if best and (best['y0'] - 7 <= L['y'] <= best['y1'] + 9): best['cells'].append(L)
        else: extra.append(L)
    out = [('h', L['y'], [L['text'].strip()]) for L in heads]
    for r in rows: out.append(('r', r['y'], [re.sub(r'(\w)- (\w)', r'\1\2', r['label'])] + [c['text'].strip() for c in sorted(r['cells'], key=lambda c: c['x0'])]))
    for L in extra: out.append(('r', L['y'], [L['text'].strip()]))
    out.sort(key=lambda x: x[1])
    capt = re.sub(r'(\w)- (\w)', r'\1\2', ' '.join(L['text'].strip() for L in sorted(capl, key=lambda L: L['y'])))
    blk = dict(t='tabla', rows=[[c.replace('\xa0', ' ') for c in r] for _, _, r in out])
    if capt: blk['caption'] = capt
    return blk


# ------------------------------------------------------------------ artículo
def process_article(pages, a, b, vocab, log, interview_hint=False):
    ctx = 'pdf %d-%d' % (a, b)
    P = [p for p in pages if a <= p['pdf'] <= b]
    blocks = []; notes = {}; title_l = []; sub_l = []; auth = None
    st = dict(cur=None, note=None, nextnote=1, front=True, calls=[])
    printed = []
    cov_in = 0
    interview = interview_hint

    def flush():
        c = st['cur']
        if not c: return
        text = serialize(c['segs'])
        t = c['kind']
        blk = dict(t=t, text=text, pg=c['pg'])
        if t == 'h': blk['level'] = c['level']; blk['text'] = re.sub(r'(?<!\\)\*', '', text)
        if t == 'li': blk['marker'] = c['marker']
        if c.get('cont'): blk['cont'] = True
        blocks.append(blk); st['cur'] = None

    def newblock(kind, L, segs, pg, **kw):
        flush()
        prev = blocks[-1] if blocks else None
        c = dict(kind=kind, segs=segs, pg=pg, last=L, page=pg, item_indent=kw.get('item_indent'), level=kw.get('level'), marker=kw.get('marker'))
        if kind == 'p' and prev and prev['t'] in ('q', 'li', 'tabla') and segs and plain(segs).lstrip()[:1].islower(): c['cont'] = True
        st['cur'] = c

    for p in P:
        pg = p['pdf']
        hdr = [L for L in p['lines'] if L['y'] < HDR_Y]
        for L in hdr:
            if re.match(r'^\s*\d{1,3}\s*$', L['text']): pg = int(L['text'])
        printed.append(pg)
        lines = [L for L in p['lines'] if L['y'] >= HDR_Y]
        if not lines: continue
        cov_in += sum(len(re.sub(r'[\W_]', '', L['text'])) for L in lines)
        if table_page(p):
            flush()
            tb = build_table(lines)
            if blocks and blocks[-1]['t'] == 'tabla' and st.get('tpage') == pg - 1:
                blocks[-1]['rows'] += tb['rows']
                if tb.get('caption'): blocks[-1]['caption'] = tb['caption']
            else:
                tb['pg'] = pg; blocks.append(tb)
            st['tpage'] = pg
            continue
        body = [L for L in lines if 11.5 <= L['size'] <= 12.6 and L['chars'] >= 22 and L['font'].endswith('Book') or (L['size'] >= 11.5 and L['chars'] >= 22 and L['size'] <= 12.6 and 'Italic' in L['font'])]
        left = min([L['x0'] for L in body if not LISTSTART.match(L['text'])] or [64])
        diffs = [y - x for x, y in zip([L['y'] for L in body], [L['y'] for L in body][1:]) if 13 <= y - x <= 20]
        pitch = statistics.median(diffs) if diffs else 16.4
        # --- líneas de cuerpo
        first_body_done = not (p is P[0])
        prevL = None
        for L in lines:
            f, sz = L['font'], L['size']
            if sz >= 19.5: k = 'title'
            elif 'Rotunda' in f and 13.5 <= sz <= 16.5: k = 'subtitle'
            elif 'Regular-Dark' in f and sz >= 12.5 and L['text'].strip().lower().startswith('por '): k = 'author'
            elif 'SemiBold' in f and 'Italic' not in f and sz >= 12.5: k = 'h2'
            elif 'Medium' in f and sz >= 12.0: k = 'h3'
            elif 'SemiBoldItalic' in f and sz >= 12.5: k = 'h3'
            elif sz <= 10.2: k = 'note'
            elif 'Garamond' in f and sz >= 10.5 and L['chars'] < 50: k = 'cite'
            elif 'Garamond' in f and sz >= 10.5: k = 'quote'
            elif sz <= 11.2: k = 'quote'
            else: k = 'body'
            if k == 'body' and L['text'].lstrip().startswith('—') and L['chars'] < 60 and not re.match(r'\s*—\s*[.,;)]', L['text']): L['dash'] = True
            if k == 'quote' and L['x0'] > left + 100 and L['chars'] < 60: L['dash'] = True
            L['k'] = k
        # notas se tratan al final de la página
        for L in lines:
            k = L['k']
            if k == 'note': continue
            segs = line_segs(L)
            if L.get('dash') and st['cur'] and st['cur']['kind'] in ('q', 'ep'): k = 'cite'
            if k == 'title': title_l.append(L['text'].strip()); continue
            if k == 'subtitle': sub_l.append(L['text'].strip()); continue
            if k == 'author': auth = re.sub(r'^\s*por\s+', '', L['text'].strip(), flags=re.I); continue
            if k == 'body': first_body_done = True
            if k in ('h2', 'h3'):
                c = st['cur']
                lvl = 2 if k == 'h2' else 3
                if c and c['kind'] == 'h' and c['level'] == lvl and L['y'] - c['last']['y'] < 24 and c['page'] == pg:
                    c['segs'] = seg_join(c['segs'], segs); c['last'] = L
                else: newblock('h', L, segs, pg, level=lvl); st['cur']['last'] = L
                continue
            if k == 'cite':
                flush()
                txt = re.sub(r'^[—–-]\s*', '', serialize(segs))
                if blocks and blocks[-1]['t'] in ('q', 'ep') and 'cite' not in blocks[-1]: blocks[-1]['cite'] = txt
                else: blocks.append(dict(t='q', text=txt, pg=pg))
                continue
            kind = 'p' if k == 'body' else ('ep' if (k == 'quote' and not first_body_done and p is P[0]) else 'q')
            c = st['cur']
            ind = L['x0'] - left
            ls = LISTSTART.match(L['text']) if (kind == 'p' and ind >= 8) else None
            new = False
            if not c or c['kind'] not in (kind, 'li') or (c['kind'] == 'li' and kind != 'p'): new = True
            else:
                P0 = c['last']; same = (c['page'] == pg)
                gap = L['y'] - P0['y']
                pk = 1.36 * P0['size']
                if ls: new = True
                elif c['kind'] == 'li':
                    new = (same and gap > 1.3 * pk) or (10 <= ind < c['item_indent'] + 10)
                elif kind == 'ep': new = same and gap > 1.3 * pk
                elif kind == 'q': new = same and gap > 1.3 * pk or (not same and ind > 8 and False)
                else:
                    if same: new = gap > 1.3 * pk or ind >= 10
                    else: new = ind >= 10
            if new:
                if ls: newblock('li', L, [], pg, item_indent=ind, marker=ls.group(1))
                else: newblock(kind, L, [], pg)
                c = st['cur']
                if ls:
                    segs = strip_prefix(segs, ls.end())
                c['segs'] = segs; c['last'] = L; c['page'] = pg
            else:
                # continuar bloque actual (con guion / marcador de página)
                joined = False
                prev_s = c['segs']
                if plain(prev_s).rstrip().endswith('-') or plain(prev_s).rstrip().endswith('\u00ad'):
                    prev_s, segs2, joined = hyphen_decision(prev_s, segs, vocab, log, ctx + ' p.%d' % pg)
                else: segs2 = segs
                newpage = c['page'] != pg
                if joined:
                    if newpage:
                        # marcador tras la palabra completa
                        s0 = next((i for i, x in enumerate(segs2) if x[1] is not None), None)
                        if s0 is not None:
                            m = re.match(r"\s*[A-Za-zÀ-ÿÑñ]+", segs2[s0][0])
                            if m:
                                t0 = segs2[s0]
                                segs2 = segs2[:s0] + [(t0[0][:m.end()], t0[1], t0[2]), ('[[p%d]]' % pg, None, None), (t0[0][m.end():], t0[1], t0[2])] + segs2[s0 + 1:]
                        c['segs'] = prev_s + segs2
                    else: c['segs'] = prev_s + segs2
                else:
                    if newpage: segs2 = [('[[p%d]]' % pg, None, None)] + segs2
                    c['segs'] = seg_join(c['segs'], segs2) if not (newpage) else (c['segs'] + [(' ', False, False)] + segs2)
                c['last'] = L; c['page'] = pg
        # --- notas de la página
        nl = [L for L in lines if L['k'] == 'note']
        pn = None
        for L in nl:
            m = NOTESTART.match(L['text'])
            segs = line_segs(L)
            cn = st['note']
            if m and int(m.group(1)) == st['nextnote']:
                n = int(m.group(1)); st['nextnote'] = n + 1
                ns = strip_prefix(segs, m.end())
                st['note'] = dict(n=n, segs=ns, pg=pg, last=L, page=pg, paras=[])
                notes[n] = st['note']
            elif cn is None:
                log.append('%s: línea de nota sin número esperado en p.%d: «%s»' % (ctx, pg, L['text'][:50]))
            else:
                same = cn['page'] == pg
                if same and L['y'] - cn['last']['y'] > 16.5:
                    cn['paras'].append(serialize(cn['segs'])); cn['segs'] = segs
                else:
                    prev_s = cn['segs']; joined = False
                    if plain(prev_s).rstrip().endswith('-') or plain(prev_s).rstrip().endswith('\u00ad'):
                        prev_s, segs2, joined = hyphen_decision(prev_s, segs, vocab, log, ctx + ' nota %d' % cn['n'])
                    else: segs2 = segs
                    cn['segs'] = prev_s + segs2 if joined else seg_join(prev_s, segs2)
                cn['last'] = L; cn['page'] = pg
    flush()
    lv = sorted({b['level'] for b in blocks if b['t'] == 'h'})
    for blk in blocks:
        if blk['t'] == 'h': blk['level'] = 2 + lv.index(blk['level'])
    for blk in blocks:
        if blk['t'] == 'p' and re.fullmatch(r'(\\\*\s*){3}', blk['text']): blk['t'] = 'sep'; blk['text'] = '* * *'
    called = lambda: {int(x) for b in blocks if b['t'] != 'tabla' for x in re.findall(r'\[\^(\d+)\]', b['text'] + b.get('cite', ''))}
    for n in sorted(notes):
        if n in called(): continue
        # búsqueda secuencial: entre la llamada n-1 y la n+1
        seq = [(bi, m) for bi, b in enumerate(blocks) if b['t'] != 'tabla' for m in re.finditer(r'\[\^(\d+)\]|(?<=[A-Za-zÀ-ÿ.,;:»”)*])%d(?!\d)(?=\s|[,.;:)»”]|$)' % n, b['text'])]
        prev = max([k for k, (bi, m) in enumerate(seq) if m.group(1) and int(m.group(1)) < n] or [-1])
        nxt = min([k for k, (bi, m) in enumerate(seq) if m.group(1) and int(m.group(1)) > n and k > prev] or [len(seq)])
        cand = [(bi, m) for bi, m in seq[prev + 1:nxt] if not m.group(1)]
        if cand:
            bi, m = cand[0]; t = blocks[bi]['text']
            blocks[bi]['text'] = t[:m.start()] + '[^%d]' % n + t[m.end():]
            log.append('%s: llamada %d recuperada de un número normal tras «%s»' % (ctx, n, t[max(0, m.start() - 20):m.start()]))
    notes_out = {}
    for n, c in notes.items():
        paras = c['paras'] + [serialize(c['segs'])]
        notes_out[str(n)] = dict(text='\n'.join(paras), pg=c['pg'])
    if any(re.search(r'entrevista', s, re.I) for s in sub_l + title_l): interview = True
    if interview:
        for blk in blocks:
            if blk['t'] == 'p' and blk['text'].startswith('*') and blk['text'].count('*') >= 2:
                core = re.sub(r'\[\^\d+\]|\[\[p\d+\]\]', '', blk['text'])
                itl = sum(len(m) for m in re.findall(r'(?<!\\)\*([^*]+)(?<!\\)\*', core))
                if itl >= 0.6 * len(re.sub(r'\*', '', core)): blk['t'] = 'qn'; blk['text'] = re.sub(r'(?<!\\)\*', '', blk['text'])
    return dict(title_lines=title_l, subtitle_lines=sub_l, author_pdf=auth, blocks=blocks, notes=notes_out, printed=[printed[0], printed[-1]],
                cov_in=cov_in, interview=interview)


def coverage(rec):
    s = ' '.join(rec['title_lines'] + rec['subtitle_lines'] + ([('por ' + rec['author_pdf'])] if rec['author_pdf'] else []))
    for b in rec['blocks']:
        if b['t'] == 'tabla': s += ' ' + ' '.join(' '.join(r) for r in b['rows']) + ' ' + b.get('caption', '')
        else: s += ' ' + b['text'] + ' ' + b.get('cite', '') + ' ' + b.get('marker', '')
    for n, v in rec['notes'].items(): s += ' %s %s' % (n, v['text'])
    s = re.sub(r'\[\[p\d+\]\]', '', s); s = s.replace('[^', '').replace(']', '')
    return len(re.sub(r'[\W_]', '', s))
