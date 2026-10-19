#!/usr/bin/env python3
"""Extrae de los PDF de Marx XXI el texto estructurado: títulos, subtítulos, párrafos, citas, epígrafes,
saltos de página y notas (separadas del texto y ancladas en él).  Ver FORMATO.md."""
import pymupdf, re, json, sys, os, unicodedata, collections, statistics, datetime

LIGS = str.maketrans({'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl', ' ': ' ', '‎': '', '​': '', '﻿': '', ' ': ' '})
WORD = re.compile(r"[^\W\d_]+(?:-[^\W\d_]+)*", re.U)
SUPRE = re.compile(r"^\d{1,4}\.?(?:\s*[,;–-]\s*\d{1,4}\.?)*$|^\*+$")


def isital(f): return 'Italic' in f or 'Oblique' in f
def isbold(f): return 'Bold' in f or 'Black' in f


# ------------------------------------------------------------------ páginas -> spans
def page_spans(page):
    out = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                t = s['text'].translate(LIGS)
                if not t.strip():
                    continue
                x0, y0, x1, y1 = s['bbox']
                out.append(dict(t=t, font=s['font'].split('+')[-1], size=round(s['size'], 1), x0=x0, y0=y0, x1=x1, y1=y1,
                                base=s['origin'][1], cls=None))
    return out


def cluster_lines(spans, tol=2.4):
    """Agrupa spans por línea de base."""
    lines = []
    for s in sorted(spans, key=lambda s: (s['base'], s['x0'])):
        for L in lines:
            if abs(L['base'] - s['base']) <= tol:
                L['spans'].append(s)
                n = len(L['spans'])
                L['base'] += (s['base'] - L['base']) / n
                break
        else:
            lines.append(dict(base=s['base'], spans=[s]))
    for L in lines:
        L['spans'].sort(key=lambda s: s['x0'])
    return sorted(lines, key=lambda L: L['base'])


def classify_page(spans, W, H):
    """Marca cada span: pagenum, run (cabecera), sup (número de nota), note (texto de nota), body, title…"""
    printed = None
    for s in spans:
        if s['t'].strip().isdigit() and s['y0'] > 0.85 * H and s['size'] >= 11.5 and not isbold(s['font']):
            s['cls'] = 'pagenum'; printed = int(s['t'].strip())
        elif s['size'] == 10.0 and 'SemiBold' in s['font'] and not isital(s['font']) and s['y0'] < 0.13 * H:
            s['cls'] = 'run'
    rest = [s for s in spans if s['cls'] is None]
    bodyish = [s for s in rest if 10.8 <= s['size'] <= 12.5 and not (isbold(s['font']) and s['size'] >= 17)]
    if bodyish:
        bx0 = min(s['x0'] for s in bodyish); bx1 = max(s['x1'] for s in bodyish)
    else:
        bx0, bx1 = 0, W
    big = [s for s in rest if s['size'] > 8.6]
    small = [s for s in rest if s['size'] <= 8.6]
    for s in big:
        s['cls'] = 'body'
    for s in small:
        inside = s['x0'] >= bx0 - 1 and s['x1'] <= bx1 + 1
        if inside and s['size'] <= 7.1 and SUPRE.match(s['t'].strip()):
            near = [b for b in big if b['base'] - 11 <= s['base'] <= b['base'] + 1.5 and b['x0'] - 3 <= s['x0'] <= b['x1'] + 5]
            if near:
                s['cls'] = 'sup'; continue
        s['cls'] = 'smallbody' if inside else 'note'
    # superíndices dentro de líneas de título/cabecera con tamaño grande (p. ej. Bold 11.7 junto a un título de 20)
    for s in big:
        if SUPRE.match(s['t'].strip()) and s['size'] < 15 and any(b['size'] >= 17 and abs(b['base'] - s['base']) < 10 and b['x1'] <= s['x0'] + 6 for b in big):
            s['cls'] = 'sup'
    return printed, (bx0, bx1)


# ------------------------------------------------------------------ líneas -> segmentos con estilo
def seg_merge(segs):
    segs = list(segs)
    for i in range(1, len(segs) - 1):
        t, st = segs[i]
        if st[0] == 't' and not t.strip():
            a, b = segs[i - 1][1], segs[i + 1][1]
            if a[0] == 't' and b[0] == 't' and a[1:] == b[1:] and (a[1] or a[2]):
                segs[i] = (t, a)
    out = []
    for t, st in segs:
        if out and out[-1][1] == st and st[0] in ('t',):
            out[-1] = (out[-1][0] + t, st)
        else:
            out.append((t, st))
    return out


def build_line(L, allow_emph=True):
    """Devuelve segmentos [(texto, estilo)] con estilo ('t', italic, bold) o ('sup', n) para notas."""
    segs = []; prev = None
    for s in L['spans']:
        if s['cls'] == 'sup':
            nums = [int(x) for x in re.findall(r'\d+', s['t'])] if s['t'].strip() != '*' else []
            if not nums:
                segs.append(('*', ('t', False, False))); prev = s; continue
            for n in nums:
                segs.append((n, ('sup',)))
            prev = s; continue
        t = s['t']
        if prev is not None and prev['cls'] != 'sup':
            gap = s['x0'] - prev['x1']
            if gap > 1.3 and not prev['t'].endswith(' ') and not t.startswith(' ') and not re.match(r'^[,.;:!?)»”\]]', t) and not re.search(r'[(«“¿¡\[]$', prev['t']):
                segs.append((' ', ('t', False, False)))
        elif prev is not None and prev['cls'] == 'sup' and not t.startswith(' '):
            pass
        it = isital(s['font']) and allow_emph
        bd = isbold(s['font']) and allow_emph and s['size'] <= 12.2
        segs.append((t.replace('*', '\\*'), ('t', it, bd)))
        prev = s
    return seg_merge(segs)


def seg_plain(segs):
    return ''.join(t if st[0] == 't' else '' for t, st in segs)


def serialize(segs):
    """Segmentos -> cadena con marcas: *cursiva*, **negrita**, [^n] nota, [[pN]] salto de página."""
    segs = seg_merge([(t, st) for t, st in segs])
    out = []
    for t, st in segs:
        if st[0] == 'sup':
            out.append(f'[^{t}]')
        elif st[0] == 'pb':
            out.append(f'[[p{t}]]')
        else:
            _, it, bd = st
            lead = len(t) - len(t.lstrip()); trail = len(t) - len(t.rstrip())
            core = t.strip()
            if not core:
                out.append(t); continue
            if not re.search(r'[^\W\d_]', core):
                out.append(t); continue
            if it: core = '*' + core + '*'
            if bd: core = '**' + core + '**'
            out.append(t[:lead] + core + t[len(t) - trail:] if trail else t[:lead] + core)
    s = ''.join(out)
    s = re.sub(r'\*\s*\*(?!\*)', ' ', s) if False else s
    s = re.sub(r'  +', ' ', s)
    return s.strip()


# ------------------------------------------------------------------ unión de líneas (guiones)
class Vocab:
    def __init__(self): self.c = collections.Counter()
    def add_text(self, txt): self.c.update(w.lower() for w in WORD.findall(txt))
    def n(self, w): return self.c.get(w.lower(), 0)


def split_trailing(s):
    m = re.search(r"([^\W\d_]+)$", s)
    return (s[:m.start()], m.group(1)) if m else (s, '')


def join_segs(a, b, vocab, log, ctx='', pb=None):
    """Une dos listas de segmentos (líneas consecutivas), resolviendo el guion de final de línea."""
    PB = [(pb, ('pb',))] if pb is not None else []
    if not a: return PB + b
    if not b: return a
    # último texto de a, primer texto de b
    ai = max((i for i, (t, st) in enumerate(a) if st[0] == 't' and t.strip()), default=None)
    bi = next((i for i, (t, st) in enumerate(b) if st[0] == 't' and t.strip()), None)
    if ai is None or bi is None or ai != len(a) - 1 or bi != 0:
        return a + [(' ', ('t', False, False))] + PB + b
    at, ast = a[ai]; bt, bst = b[bi]

    def with_pb(bb):
        if not PB: return bb
        t0, s0 = bb[0]
        m = re.match(r'^(\S+)(.*)$', t0, re.S)
        if not m: return PB + bb
        return [(m.group(1), s0)] + PB + ([(m.group(2), s0)] if m.group(2) else []) + bb[1:]
    if at.endswith(chr(0xAD)):
        a = a[:ai] + [(at[:-1], ast)]; return seg_merge(a + with_pb(b))
    if at.endswith('-') and len(at) > 1 and re.search(r'[^\W\d_]-$', at) and re.match(r'[^\W\d_]', bt):
        pre, left = split_trailing(at[:-1])
        m = re.match(r"[^\W\d_]+", bt)
        right = m.group(0)
        cand = (left + right).lower()
        hy = (left + '-' + right).lower()
        nc, nh, nl, nr = vocab.n(cand), vocab.n(hy), vocab.n(left), vocab.n(right)
        if nc > 0 and nc >= nh:
            keep = False
        elif nh > 0:
            keep = True
        elif bt[0].isupper():
            keep = True
        elif nl >= 3 and nr >= 3 and len(left) >= 3 and len(right) >= 3:
            keep = True; log.append(f'{ctx}: «{left}-{right}» → conservado (no hay «{left}{right}» en el corpus)')
        else:
            keep = False
            if nc == 0: log.append(f'{ctx}: «{left}-{right}» → unido «{left}{right}» (palabra no vista en otro sitio)')
        if keep:
            return seg_merge(a + with_pb(b))
        a = a[:ai] + [(at[:-1], ast)]
        return seg_merge(a + with_pb(b))
    return a + [(' ', ('t', False, False))] + PB + b


# ------------------------------------------------------------------ volumen -> páginas con líneas
def wmode(pairs):
    c = collections.Counter()
    for k, w in pairs: c[k] += w
    return c.most_common(1)[0][0] if c else None


def line_attrs(L):
    sp = [s for s in L['spans'] if s['cls'] != 'sup']
    if not sp: sp = L['spans']
    chars = sum(len(s['t'].strip()) for s in sp) or 1
    L['x0'] = min(s['x0'] for s in sp); L['x1'] = max(s['x1'] for s in sp)
    L['size'] = wmode([(s['size'], len(s['t'].strip())) for s in sp]) or 0
    L['it'] = sum(len(s['t'].strip()) for s in sp if isital(s['font'])) / chars
    L['bd'] = sum(len(s['t'].strip()) for s in sp if isbold(s['font'])) / chars
    L['head_ok'] = all(is_head_span(s) for s in sp)
    L['chars'] = chars
    L['sups'] = [int(n) for s in L['spans'] if s['cls'] == 'sup' for n in re.findall(r'\d+', s['t'])]
    L['y'] = L['base']
    return L


def is_head_span(s):
    f = s['font']; z = s['size']
    if 'SemiBold' in f: return z >= 9.9
    if isbold(f) and not isital(f): return z >= 12.0 and z < 17.5
    return False


def make_lines(spans):
    ns = [s for s in spans if s['cls'] in ('body', 'smallbody')]
    lines = cluster_lines(ns)
    for s in spans:
        if s['cls'] != 'sup': continue
        best = None
        for L in lines:
            d = L['base'] - s['base']
            if -2 <= d <= 10:
                gap = min(abs(s['x0'] - sp['x1']) for sp in L['spans'])
                if best is None or (gap, abs(d)) < best[0]:
                    best = ((gap, abs(d)), L)
        if best: best[1]['spans'].append(s)
        else: s['cls'] = 'smallbody'; lines.append(dict(base=s['base'], spans=[s]))
    for L in lines:
        L['spans'].sort(key=lambda s: s['x0'])
        line_attrs(L)
    return sorted(lines, key=lambda L: L['base'])


def parse_volume(path):
    doc = pymupdf.open(path); pages = []
    for i, p in enumerate(doc):
        W, H = p.rect.width, p.rect.height
        spans = page_spans(p)
        printed, (bx0, bx1) = classify_page(spans, W, H)
        endn = sum(len(s['t']) for s in spans if s['cls'] == 'smallbody') > 1500
        if endn:
            for s in spans:
                if s['cls'] == 'smallbody': s['cls'] = 'note'
        lines = make_lines(spans)
        nspans = [s for s in spans if s['cls'] == 'note']
        nlines = []
        if nspans:
            for L in cluster_lines(nspans):
                for s in L['spans']: s['cls'] = 'note'
                line_attrs(L)
                nlines.append(L)
        pages.append(dict(pdf=i + 1, printed=printed, endnotes=endn, lines=lines, nlines=nlines, W=W, H=H, bx0=bx0, bx1=bx1,
                          run=' '.join(s['t'].strip() for s in spans if s['cls'] == 'run')))
    fix_sups(pages)
    offs = collections.Counter(pg['pdf'] - pg['printed'] for pg in pages if pg['printed'] is not None)
    off = offs.most_common(1)[0][0] if offs else 0
    for pg in pages:
        pg['printed_guess'] = pg['printed'] is None
        if pg['printed'] is None: pg['printed'] = pg['pdf'] - off
    return pages


def build_vocab(pages):
    v = Vocab()
    for pg in pages:
        for group in (pg['lines'], pg['nlines']):
            for k, L in enumerate(group):
                txt = seg_plain(build_line(L, False))
                if txt.endswith('-') or txt.endswith('­'):
                    txt = re.sub(r"[^\W\d_]+-?$", '', txt)
                if k > 0:
                    prev = seg_plain(build_line(group[k - 1], False))
                    if prev.endswith('-') or prev.endswith('­'):
                        txt = re.sub(r"^[^\W\d_]+", '', txt)
                v.add_text(txt)
    return v


# ------------------------------------------------------------------ artículo
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9ñ]', '', ''.join(c for c in s if not unicodedata.combining(c) or c == '̃'))


def merge_heading_lines(lines):
    """Une líneas consecutivas de un mismo título en un solo segmento lista."""
    return lines


JUNK_LOG = []


def assemble(pages, vocab, log, ctx, first_pdf, last_pdf, start_is_title=True):
    """Devuelve dict con title_lines, author, blocks, notes para las páginas first..last (PDF, base 1)."""
    pgs = [p for p in pages if first_pdf <= p['pdf'] <= last_pdf]
    # tamaño de cuerpo del artículo
    BS = wmode([(L['size'], L['chars']) for p in pgs for L in p['lines'] if L['chars'] >= 35 and L['it'] < .5 and 10.9 <= L['size'] <= 12.6 and not L['head_ok']]) or 11.5
    flow = []        # elementos en orden
    title_lines = []; author = ''
    notes = {}; last_note = None; markers = []; warnings = []
    front = True
    for pi, p in enumerate(pgs):
        def _junk(L):
            t = ''.join(x['t'] for x in L['spans']).strip()
            if len(re.sub(r'\W', '', t)) > 5 or t.isdigit(): return False
            return any('Times' in x['font'] for x in L['spans']) or L['size'] <= 8.5
        _dropped = [L for L in p['lines'] if _junk(L)]
        for L in _dropped: JUNK_LOG.append((ctx, p['pdf'], ''.join(x['t'] for x in L['spans'])))
        lines = [L for L in p['lines'] if not _junk(L)]
        # margen izquierdo del cuerpo en esta página
        cand = [L['x0'] for L in lines if abs(L['size'] - BS) <= 0.6 and L['it'] < .5 and L['chars'] >= 25 and not L['head_ok'] and L['size'] < 17]
        left = min(cand) if cand else None
        right = max([L['x1'] for L in lines if abs(L['size'] - BS) <= 0.6 and L['it'] < .5 and L['chars'] >= 25] or [p['bx1']])
        gaps = [b['y'] - a['y'] for a, b in zip(lines, lines[1:]) if 9 <= b['y'] - a['y'] <= 22]
        pitch = statistics.median(gaps) if gaps else 14.4
        BSp = wmode([(L['size'], L['chars']) for L in lines if L['chars'] >= 35 and L['it'] < .5 and 10.9 <= L['size'] <= 12.6 and not L['head_ok']]) or BS
        page_sups = set()
        seq = []
        for L in lines:
            segs = build_line(L, allow_emph=True)
            L['segs'] = segs
            page_sups.update(L['sups'])
        # --- clasificación de líneas
        for L in lines:
            sz = L['size']
            base = dict(L=L, page=p, left=left, right=right, pitch=pitch, BS=BS, BSp=BSp)
            if sz >= 17.5 and L['bd'] > .5:
                kind = 'title'
            elif front and pi == 0 and sz <= 10.4 and L['it'] < .5 and L['bd'] < .5 and any(x['kind'] == 'title' for x in flow + seq) and L['chars'] < 80 and not any(x['kind'] in ('author', 'ep') for x in seq):
                kind = 'author'
            elif L['bd'] > .5 and L['it'] > .5 and 10.5 <= sz < 17 and L['chars'] < 90 and not any(isital(s['font']) is False and isbold(s['font']) and s['size'] >= 12.5 for s in L['spans']):
                kind = 'cite'
            elif L['head_ok']:
                kind = 'head'
            else:
                kind = 'body'
            if kind == 'body' and front and pi == 0:
                lead = L['segs'][0][0].lstrip().startswith('—') if L['segs'] and L['segs'][0][1][0] == 't' else False
                cite = (L['bd'] > .5 and L['it'] > .5) or lead
                epi = cite or L['it'] >= .6 or sz <= 11.2
                if epi or (any(x['kind'] == 'title' for x in flow + seq) and not any(x['kind'] in ('body',) for x in flow + seq)):
                    kind = 'cite' if cite else ('ep' if epi else 'body')
                if kind == 'body': front = False
            elif kind == 'head' and front and pi == 0 and title_lines:
                front = False
            base['kind'] = kind
            seq.append(base)
        # --- nivel de título
        for it in seq:
            if it['kind'] == 'head':
                L = it['L']; z = L['size']
                it['level'] = 2 if z >= 12 else (4 if (L['it'] > .5 and z <= 10.5) else 3)
        flow.extend(seq)
        pnotes = []
        markers.extend(sorted(page_sups))
    return dict(flow=flow, BS=BS, notes=notes, markers=markers, warnings=warnings, pgs=pgs)


NUM_RE = re.compile(r'^\s*(\d{1,4})(?:\s*[.\-–]\s*|\s+|(?=[«“"¿¡(\[A-Za-zÁÉÍÓÚÑáéíóúñ]))')


def page_notes(p, page_sups, last_note, vocab, log, ctx):
    nl = p['nlines']
    if not nl: return []
    # separa por lado (izquierdo/derecho del cuerpo) y ordena de arriba abajo
    mid = (p['bx0'] + p['bx1']) / 2
    ordered = [L for L in nl if (L['x0'] + L['x1']) / 2 < mid] + [L for L in nl if (L['x0'] + L['x1']) / 2 >= mid]
    expected = set(page_sups)
    if last_note is not None: expected.add(last_note + 1)
    out = []; cur = None
    for L in ordered:
        segs = build_line(L, True)
        first = next((i for i, (t, st) in enumerate(segs) if st[0] == 't' and t.strip()), None)
        m = None
        if first is not None:
            m = NUM_RE.match(segs[first][0])
            if m and int(m.group(1)) not in expected and not (cur is None and last_note is None and not expected):
                m = None
        if m:
            n = int(m.group(1))
            segs = segs[:first] + [(segs[first][0][m.end():], segs[first][1])] + segs[first + 1:]
            segs = [x for x in segs if x[0] != '']
            cur = [n, segs, False]; out.append(cur)
            expected.discard(n); expected.add(n + 1)
        else:
            if cur is None:
                cur = [None, segs, True]; out.append(cur)
            else:
                cur[1] = join_segs(cur[1], segs, vocab, log, ctx)
    return [(n, s, c) for n, s, c in out]


# ------------------------------------------------------------------ flujo -> bloques
BULLET = re.compile(r'^\s*[•▪‣◦·]\s*')
LISTSTART = re.compile(r'^\s*((?:\d{1,2}[.)]|[a-z]\)|[•▪‣◦·]))\s+')


def plain_of(it):
    return seg_plain(it['L']['segs'])


def flow_to_blocks(res, vocab, log, ctx):
    flow = res['flow']; BS = res['BS']
    blocks = []; title = []; author = []
    state = dict(par=None, ep=None)

    def indent(it):
        return (it['L']['x0'] - it['left']) if it['left'] is not None else 0

    def qf(it):
        L = it['L']
        return L['size'] <= 11.2 or (L['it'] >= .8 and indent(it) >= 8 and L['chars'] > 8)

    def new_par(a, b):
        La, Lb = a['L'], b['L']
        if qf(a) != qf(b): return True
        if LISTSTART.match(plain_of(b)) and (re.search(r'[.:;!?»”")\]…]\s*$', plain_of(a)) or LISTSTART.match(plain_of(a)) or not re.match(r'\s*\d', plain_of(b))): return True
        same = a['page'] is b['page']
        in_list = bool(LISTSTART.match(plain_of(state['par']['items'][0]))) if state['par'] else False
        if same:
            if Lb['y'] - La['y'] > 1.3 * b['pitch']: return True
            if indent(b) - indent(a) >= 8 and not in_list: return True
        else:
            if re.search(r'[-\u00ad]\s*$', plain_of(a)): return False
            if not qf(b) and indent(b) >= 8 and not (indent(a) >= 8 and abs(indent(a) - indent(b)) < 4): return True
        if La['x1'] < a['right'] - 2.5 * La['size'] and re.search(r'[.!?:;»”")\]…]\s*$', plain_of(a)) and re.match(r'\s*[¿¡«“"—A-ZÁÉÍÓÚÑ0-9]', plain_of(b)):
            return True
        return False

    def flush():
        par = state['par']
        if not par: return
        items = par['items']
        q = sum(qf(i) for i in items) >= len(items) / 2 + 0.01
        if not q and len(items) >= 2:
            ind = statistics.median(indent(i) for i in items[1:])
            if ind >= 8: q = True
        if not q and len(items) == 1 and indent(items[0]) >= 20 and items[0]['L']['it'] >= .5: q = True
        segs = par['segs']
        text = serialize(segs)
        kind = 'q' if q else 'p'
        marker = None
        mm = LISTSTART.match(plain_of(items[0]))
        if mm:
            kind = 'li'; marker = mm.group(1)
            text = re.sub(r'^(\*{0,2})\s*' + re.escape(marker) + r'\s*', r'\1', text, count=1)
        if kind == 'q' and statistics.mean(i['L']['it'] for i in items) >= .6:
            text = re.sub(r'(?<!\\)\*', '', text)
        blk = dict(t=kind, text=text, pg=par['pg'])
        if marker: blk['marker'] = marker
        if par.get('cont'): blk['cont'] = True
        blocks.append(blk)
        state['par'] = None
        state['last_kind'] = kind

    for it in flow:
        k = it['kind']; L = it['L']
        if k == 'title':
            flush(); title.append(it); continue
        if k == 'author':
            flush(); author.append(it); continue
        if k == 'cite':
            flush()
            segs = build_line(L, False)
            tgt = blocks[-1] if blocks and blocks[-1]['t'] in ('ep', 'q') and 'cite_segs' not in blocks[-1] else None
            if tgt is not None:
                tgt['cite_segs'] = segs
            elif blocks and blocks[-1].get('cite_segs') is not None and blocks[-1]['t'] in ('ep', 'q'):
                blocks[-1]['cite_segs'] = join_segs(blocks[-1]['cite_segs'], segs, vocab, log, ctx)
            else:
                blocks.append(dict(t='ep', segs=[], pg=it['page']['printed'], cite_segs=segs, _last=it))
            state['ep'] = None
            continue
        if k == 'ep':
            flush()
            ep = state['ep']
            segs = build_line(L, True)
            if ep and blocks and blocks[-1] is ep and ep['_last']['page'] is it['page'] and L['y'] - ep['_last']['L']['y'] <= 1.35 * it['pitch'] and 'cite_segs' not in ep:
                ep['segs'] = join_segs(ep['segs'], segs, vocab, log, ctx)
                ep['_its'].append(L['it'])
            else:
                ep = state['ep'] = dict(t='ep', segs=segs, pg=it['page']['printed'], _last=it, _its=[L['it']])
                blocks.append(ep)
            ep['_last'] = it
            ep['_it'] = sum(ep['_its']) / len(ep['_its'])
            continue
        state['ep'] = None
        if k == 'head':
            flush()
            segs = build_line(L, False)
            prev = blocks[-1] if blocks else None
            if prev and prev['t'] == 'h' and prev.get('_lvl') == it['level'] and prev.get('_page') is it['page'] and L['y'] - prev['_y'] <= 1.9 * L['size']:
                prev['segs'] = join_segs(prev['segs'], segs, vocab, log, ctx)
                prev['_y'] = L['y']
            else:
                blocks.append(dict(t='h', level=it['level'], segs=segs, pg=it['page']['printed'], _lvl=it['level'], _page=it['page'], _y=L['y']))
            continue
        # cuerpo
        par = state['par']
        if par is None or new_par(par['items'][-1], it):
            prev_par = par
            flush()
            cont = False
            if blocks and blocks[-1]['t'] in ('q',) and indent(it) < 8 and not qf(it) and it['page'] is not None and state.get('last_kind') == 'q':
                cont = True
            state['par'] = par = dict(items=[it], segs=list(L['segs']), pg=it['page']['printed'], cont=cont)
        else:
            last = par['items'][-1]
            pb = it['page']['printed'] if last['page'] is not it['page'] else None
            par['segs'] = join_segs(par['segs'], L['segs'], vocab, log, ctx, pb=pb)
            par['items'].append(it)
    flush()
    for b in blocks:
        cs = b.pop('cite_segs', None)
        if b['t'] == 'h':
            b['text'] = serialize(b.pop('segs')); [b.pop(x, None) for x in ('_lvl', '_page', '_y')]
            b['text'] = b['text'].replace('*', '')
        elif b['t'] == 'ep':
            b['text'] = serialize(b.pop('segs')) if b['segs'] else ''
            b.pop('_last', None); b.pop('closed', None); b.pop('_its', None)
            if b.pop('_it', 0) >= .6: b['text'] = re.sub(r'(?<!\\)\*', '', b['text'])
        if cs: b['cite'] = serialize(cs).replace('*', '')
        b['text'] = re.sub(r' *\n *', '\n', b['text'])
    blocks = [b for b in blocks if not (b['t'] == 'h' and b['text'].strip().lower() in ('notas', 'notas finales', 'notas al final'))]
    tl = [(it['L'], build_line(it['L'], False)) for it in title]
    return blocks, title, author


def run_volume(vol, pdf, content, outdir, minpage):
    log = []
    pages = parse_volume(pdf)
    vocab = build_vocab(pages)
    # inicios de artículo
    starts = []
    for p in pages:
        if p['pdf'] < minpage: continue
        if any(L['size'] >= 17.5 and L['bd'] > .5 and L['size'] < 23 for L in p['lines']):
            starts.append(p['pdf'])
    return pages, vocab, starts, log


def article_record(vol, spec, pages, vocab, first, last, log, content_art, kind_hint, notes_ext=None):
    ctx = f'{spec}'
    res = assemble(pages, vocab, log, ctx, first, last)
    blocks, title_items, author_items = flow_to_blocks(res, vocab, log, ctx)
    # título
    tl = []
    tnotes = []
    for it in title_items:
        segs = build_line(it['L'], False)
        tl.append(seg_plain(segs).strip())
        tnotes += [t for t, st in segs if st[0] == 'sup']
    title_pdf = ' '.join(tl)
    author_pdf = ' '.join(seg_plain(build_line(it['L'], False)).strip() for it in author_items)
    notes = {str(n): dict(text=serialize(v['segs']), pg=v['page']) for n, v in sorted((notes_ext or {}).items())}
    # marcadores citados en el texto
    cited = []
    def scan(t):
        cited.extend(int(x) for x in re.findall(r'\[\^(\d+)\]', t or ''))
    for b in blocks: scan(b['text']); scan(b.get('cite'))
    cited.extend(tnotes)
    rec = dict(title_lines=tl, title_pdf=title_pdf, author_pdf=author_pdf, title_notes=tnotes, blocks=blocks, notes=notes,
               cited=cited, pdf_pages=[first, last], pages=[pages[first - 1]['printed'], pages[last - 1]['printed']],
               body_size=res['BS'], warnings=res['warnings'])
    return rec


def alnum_count(t):
    return sum(1 for c in t if c.isalnum())


def coverage(pages, first, last, rec):
    inp = 0
    for p in pages:
        if not (first <= p['pdf'] <= last): continue
        for grp in (p['lines'], p['nlines']):
            for L in grp:
                for s in L['spans']:
                    if s['cls'] in ('sup', 'run', 'pagenum'): continue
                    inp += alnum_count(s['t'])
    out = 0
    def clean(t):
        t = re.sub(r'\[\^\d+\]', '', t or ''); t = re.sub(r'\[\[p\d+\]\]', '', t); return t
    for b in rec['blocks']:
        out += alnum_count(clean(b['text'])) + alnum_count(clean(b.get('cite')))
    for n, v in rec['notes'].items():
        out += alnum_count(clean(v['text'])) + len(n)
    out += alnum_count(rec['title_pdf']) + alnum_count(rec['author_pdf'])
    return inp, out


SUPFIX_LOG = []


def first_num(L):
    t = seg_plain(build_line(L, False))
    m = re.match(r'^\s*(\d{1,4})\b', t)
    return int(m.group(1)) if m else None


def fix_sups(pages):
    """Normaliza llamadas pegadas ('1819' → 18,19) o con el último dígito duplicado ('900' → 90)."""
    for i, p in enumerate(pages):
        C = set()
        for q in pages[i:i + 3]:
            for L in q['nlines']:
                n = first_num(L)
                if n is not None: C.add(n)
        for L in p['lines']:
            changed = False
            for s in L['spans']:
                if s['cls'] != 'sup' or s['t'].strip() == '*': continue
                new = []
                for t in re.findall(r'\d+', s['t']):
                    n = int(t)
                    if n in C or not C: new.append(n); continue
                    done = False
                    for k in range(1, len(t)):
                        a, b = int(t[:k]), int(t[k:])
                        if t[k] != '0' and b == a + 1 and (a in C or b in C):
                            new += [a, b]; done = True; break
                    if not done and len(t) >= 2 and t[-1] == t[-2] and int(t[:-1]) in C:
                        new.append(int(t[:-1])); done = True
                    if not done: new.append(n)
                txt = ','.join(map(str, new))
                if txt != s['t'].strip():
                    SUPFIX_LOG.append(f"pdf {p['pdf']} (p.{p['printed']}): llamada «{s['t'].strip()}» → {txt}")
                    s['t'] = txt; changed = True
            if changed:
                L['sups'] = [int(n) for s in L['spans'] if s['cls'] == 'sup' for n in re.findall(r'\d+', s['t'])]


def collect_notes(pages, vocab, ids, starts, ends, log):
    """Recorre todas las notas del tomo en orden y las asigna a su artículo (las notas pueden desbordar a la página siguiente
    e incluso a la portada del artículo siguiente)."""
    n_art = len(ids)
    def art_of(pdf):
        for i, (f, l) in enumerate(zip(starts, ends)):
            if f <= pdf <= l: return i
        return None
    pending = [[] for _ in ids]; last = [None] * n_art
    notes = {aid: {} for aid in ids}
    cur = None  # (artículo, n)
    problems = []
    for p in pages:
        ai = art_of(p['pdf'])
        if ai is None: continue
        for L in p['lines']:
            for n in L['sups']:
                if n not in pending[ai] and n not in notes[ids[ai]]: pending[ai].append(n)
        nl = p['nlines']
        if not nl: continue
        mid = (p['bx0'] + p['bx1']) / 2
        ordered = [L for L in nl if (L['x0'] + L['x1']) / 2 < mid] + [L for L in nl if (L['x0'] + L['x1']) / 2 >= mid]
        for L in ordered:
            segs = build_line(L, True)
            first = next((k for k, (t, st) in enumerate(segs) if st[0] == 't' and t.strip()), None)
            m = NUM_RE.match(segs[first][0]) if first is not None else None
            target = None
            if m:
                n = int(m.group(1))
                spill = ai > 0 and p['pdf'] <= starts[ai] + 1
                if spill and n in pending[ai - 1] and last[ai - 1] is not None: target = ai - 1
                elif spill and n in pending[ai - 1] and n not in pending[ai]: target = ai - 1
                elif n in pending[ai]: target = ai
                elif last[ai] is not None and n == last[ai] + 1 and (n not in notes[ids[ai]]): target = ai
                elif last[ai] is None and n == 1 and ai >= 0 and 1 not in notes[ids[ai]]: target = ai
            if target is not None:
                segs = segs[:first] + [(segs[first][0][m.end():], segs[first][1])] + segs[first + 1:]
                segs = [x for x in segs if x[0] != '']
                aid = ids[target]
                notes[aid][n] = dict(segs=segs, page=p['printed'], pdf=p['pdf'])
                if n in pending[target]: pending[target].remove(n)
                last[target] = n; cur = (aid, n)
            else:
                if cur is None:
                    problems.append(f"pdf {p['pdf']}: línea de nota sin nota anterior: {seg_plain(segs)[:60]}")
                else:
                    rec = notes[cur[0]][cur[1]]
                    rec['segs'] = join_segs(rec['segs'], segs, vocab, log, f'nota {cur[1]}')
    return notes, pending, problems


NOTE_LOG = []


def collect_notes(pages, vocab, ids, starts, ends, log):
    """Versión 2: asigna notas a artículos admitiendo desbordes, números con errata y notas sin número."""
    n_art = len(ids)
    def art_of(pdf):
        for i, (f, l) in enumerate(zip(starts, ends)):
            if f <= pdf <= l: return i
        return None
    pending = [[] for _ in ids]; last = [None] * n_art
    notes = {aid: {} for aid in ids}
    cur = None; problems = []
    for p in pages:
        ai = art_of(p['pdf'])
        if ai is None: continue
        for L in p['lines']:
            for n in L['sups']:
                if n not in pending[ai] and n not in notes[ids[ai]]: pending[ai].append(n)
        nl = p['nlines']
        if not nl: continue
        mid = (p['bx0'] + p['bx1']) / 2
        left_side = [L for L in nl if (L['x0'] + L['x1']) / 2 < mid]
        right_side = [L for L in nl if (L['x0'] + L['x1']) / 2 >= mid]
        sides = (nl,) if p.get('endnotes') else (left_side, right_side)
        for side in sides:
            if not side: continue
            colleft = min(L['x0'] for L in side)
            gp = [b['y'] - a['y'] for a, b in zip(side, side[1:]) if 5 <= b['y'] - a['y'] <= 14]
            npitch = statistics.median(gp) if gp else 9.5
            valid = set(pending[ai]) | (set(pending[ai - 1]) if ai > 0 else set())
            if last[ai] is not None: valid.add(last[ai] + 1)
            numbered = []
            for j, L2 in enumerate(side):
                sg = build_line(L2, True)
                f2 = next((k for k, (t, st) in enumerate(sg) if st[0] == 't' and t.strip()), None)
                m2 = NUM_RE.match(sg[f2][0]) if f2 is not None else None
                if m2 and int(m2.group(1)) in valid: numbered.append((j, int(m2.group(1))))
            for idx, L in enumerate(side):
                segs = build_line(L, True)
                first = next((k for k, (t, st) in enumerate(segs) if st[0] == 't' and t.strip()), None)
                m = NUM_RE.match(segs[first][0]) if first is not None else None
                gap_ok = idx == 0 or (L['y'] - side[idx - 1]['y']) >= 1.35 * npitch
                indented = (L['x0'] - colleft) >= 4.5 and gap_ok
                spill = ai > 0 and p['pdf'] <= starts[ai] + 1
                target = None; n = None; generated = False
                if m:
                    n = int(m.group(1))
                    if spill and n in pending[ai - 1] and (last[ai - 1] is not None or n not in pending[ai]): target = ai - 1
                    elif n in pending[ai]: target = ai
                    elif last[ai] is not None and n == last[ai] + 1 and n not in notes[ids[ai]]: target = ai
                    elif last[ai] is None and n == 1 and 1 not in notes[ids[ai]]: target = ai
                    elif indented and n not in notes[ids[ai]]:
                        target = ai; NOTE_LOG.append(f"pdf {p['pdf']} (p.{p['printed']}): nota {n} sin llamada localizada en el texto")
                if target is None and m and indented and pending[ai] and n in notes[ids[ai]]:
                    target = ai; generated = True
                    NOTE_LOG.append(f"pdf {p['pdf']} (p.{p['printed']}): número de nota repetido en el PDF ({n}) → asignada a la llamada {min(pending[ai])} ({ids[ai]})")
                    n = min(pending[ai])
                if target is None and not m and indented:
                    # nota sin número en el PDF: se le asigna la llamada pendiente más baja
                    nxt = next((nn for j, nn in numbered if j > idx), 10 ** 6)
                    if spill and [x for x in pending[ai - 1] if x < nxt]: target = ai - 1
                    elif [x for x in pending[ai] if x < nxt]: target = ai
                    if target is not None:
                        n = min(x for x in pending[target] if x < nxt); generated = True
                        NOTE_LOG.append(f"pdf {p['pdf']} (p.{p['printed']}): nota sin número en el PDF → asignada a la llamada {n} ({ids[target]})")
                if target is not None:
                    if m:
                        segs = segs[:first] + [(segs[first][0][m.end():], segs[first][1])] + segs[first + 1:]
                        segs = [x for x in segs if x[0] != '']
                    aid = ids[target]
                    notes[aid][n] = dict(segs=segs, page=p['printed'], pdf=p['pdf'], generated=generated)
                    if n in pending[target]: pending[target].remove(n)
                    last[target] = n; cur = (aid, n)
                else:
                    if cur is None:
                        problems.append(f"pdf {p['pdf']}: línea de nota sin nota anterior: {seg_plain(segs)[:60]}")
                    else:
                        rec = notes[cur[0]][cur[1]]
                        if indented and idx > 0:
                            rec['segs'] = rec['segs'] + [('\n', ('t', False, False))] + segs
                        else:
                            rec['segs'] = join_segs(rec['segs'], segs, vocab, log, f'nota {cur[1]}')
    return notes, pending, problems


def repair_embedded_markers(pages, ids, starts, ends, notes):
    """Llamadas que el PDF trae como dígitos normales pegados al texto (p. ej. «moralmente.20»)."""
    fixed = []
    for i, aid in enumerate(ids):
        have = set()
        for p in pages[starts[i] - 1:ends[i]]:
            for L in p['lines']: have.update(L['sups'])
        for n, rec in sorted(notes[aid].items()):
            if n in have: continue
            cands = []
            for p in pages[max(starts[i], rec['pdf'] - 1) - 1:rec['pdf']]:
                for L in p['lines']:
                    for s in L['spans']:
                        if s['cls'] == 'sup': continue
                        m = re.search(r'(?<=[^\d\s(\[/])%d(?=\s*$)' % n, s['t'])
                        if m: cands.append((p, L, s, m))
            if len(cands) == 1:
                p, L, s, m = cands[0]
                s['t'] = s['t'][:m.start()]
                sup = dict(s); sup.update(t=str(n), cls='sup', size=6.7, x0=s['x1'], x1=s['x1'] + 6)
                L['spans'].append(sup); L['spans'].sort(key=lambda x: x['x0']); L['sups'].append(n)
                L['sups'].sort() if False else None
                fixed.append(f"{aid}: llamada {n} recuperada al final de «…{s['t'][-30:]}» (pdf {p['pdf']})")
            else:
                fixed.append(f"{aid}: llamada {n} NO localizada ({len(cands)} candidatos)")
    return fixed
