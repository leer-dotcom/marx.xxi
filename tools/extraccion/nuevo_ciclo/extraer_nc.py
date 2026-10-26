#!/usr/bin/env python3
"""Extracción de un número de «Nuevo Ciclo» (PDF) a JSON estructurado, sin necesidad de ningún análisis previo.

Uso:
    python extraer_nc.py RUTA/NC_005.pdf --numero 5 --salida RUTA/texto-estructurado-nuevo-ciclo [--primer-articulo 1] [--vocab OTRO.pdf ...]

- Detecta solo la escala de la maqueta, la banda de cabecera, el índice (si el PDF lo trae) y el comienzo de cada texto.
- Escribe un JSON por texto (nc<numero>-a<k>.json), actualiza _indice.json y revision-guiones.txt de la carpeta de salida.
- Imprime un resumen con la comprobación de cobertura y de llamadas/notas: léelo antes de dar nada por bueno.
Requiere: pip install pymupdf  (módulo extract_nc.py en la misma carpeta).
"""
import argparse, collections, glob, json, os, re, statistics, sys
import pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_nc as X

is_index = lambda L: L['text'].strip().lower().startswith(('índice', 'indice')) and L['chars'] < 30
norm = lambda s: re.sub(r'[^a-z0-9áéíóúñü]', '', s.lower())


def detect_scale(path):
    """Tamaño de cuerpo / 12: el cuerpo es el tamaño más frecuente entre las líneas largas de Zenon-Book."""
    c = collections.Counter()
    for p in X.load_lines(path, 1.0)[:60]:
        for L in p['lines']:
            if L['font'].endswith('Book') and L['chars'] >= 35 and 11.5 <= L['size'] <= 20: c[L['size']] += L['chars']
    body = c.most_common(1)[0][0]
    return body / 12.0


def detect_header(pages):
    """Y que separa la cabecera (número de página y título corrido) del cuerpo, ya con la escala aplicada."""
    hy, by = [], []
    for p in pages:
        nums = [L for L in p['lines'] if re.fullmatch(r'\s*\d{1,3}\s*', L['text']) and 'Garamond' in L['font']]
        body = [L for L in p['lines'] if L['font'].endswith('Book') and 11.5 <= L['size'] <= 12.6 and L['chars'] >= 25]
        if nums and body: hy.append(max(L['y'] for L in nums)); by.append(min(L['y'] for L in body))
    return (statistics.median(hy) + statistics.median(by)) / 2


def parse_index(pages):
    """Índice impreso (si lo hay): [{'title', 'page', 'author'}]."""
    ip = next((p for p in pages[:8] if any(is_index(L) for L in p['lines'])), None)
    if not ip: return []
    out = []; titles = []; cur = None
    for L in sorted(ip['lines'], key=lambda L: (round(L['y']), L['x0'])):
        t = L['text'].strip()
        if not t or is_index(L) or L['y'] < X.HDR_Y: continue
        if 'SemiBold' in L['font'] and re.fullmatch(r'\d{1,3}', t):
            cur = dict(title=' '.join(titles), page=int(t), author=''); out.append(cur); titles = []
        elif 'SemiBold' in L['font']: titles.append(t)
        elif 'Regular-Dark' in L['font'] and cur is not None and not cur['author']: cur['author'] = t
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf'); ap.add_argument('--numero', type=int, required=True); ap.add_argument('--salida', required=True)
    ap.add_argument('--primer-articulo', type=int, default=1, help='número del primer texto del PDF (usar si el PDF es un extracto)')
    ap.add_argument('--vocab', nargs='*', default=[], help='otros PDF de Nuevo Ciclo para el vocabulario de guiones')
    a = ap.parse_args()
    os.makedirs(a.salida, exist_ok=True)
    k = detect_scale(a.pdf)
    pages = X.load_lines(a.pdf, k)
    X.HDR_Y = detect_header(pages)
    print('escala %.4f, cabecera y<%.1f, %d páginas' % (k, X.HDR_Y, len(pages)))
    # vocabulario: este PDF + los demás
    vp = [pages]
    for v in a.vocab:
        kv = detect_scale(v); h = X.HDR_Y
        vp.append(X.load_lines(v, kv))
    vocab = X.build_vocab(vp)
    index = parse_index(pages)
    # comienzos de texto: páginas con línea de título (≥19.5 tras escalar) bajo la banda de cabecera
    starts = [p['pdf'] for p in pages if any(L['size'] >= 19.5 and L['y'] >= X.HDR_Y for L in p['lines']) and p['pdf'] >= 1]
    starts = [s for i, s in enumerate(starts) if i == 0 or s - 1 != starts[i - 1]]
    starts = [s for s in starts if not any(L['size'] >= 19.5 and 'Black' in L['font'] for L in pages[s - 1]['lines'])]   # excluye la portada
    starts = [s for s in starts if not any(is_index(L) for L in pages[s - 1]['lines'])]                          # y el índice
    starts = [s for s in starts if any(L['font'].endswith('Book') and L['chars'] >= 35 and 11.5 <= L['size'] <= 12.5 and L['y'] >= X.HDR_Y for L in pages[s - 1]['lines'])]   # y toda página sin texto de cuerpo (portada, créditos)
    has_text = lambda pn: any(L['y'] >= X.HDR_Y for L in pages[pn - 1]['lines'])
    last = max(p['pdf'] for p in pages if any(L['y'] >= X.HDR_Y for L in p['lines']))
    if index and len(index) != len(starts): print('AVISO: el índice tiene %d textos y se han detectado %d comienzos' % (len(index), len(starts)))
    rows = []; allhy = []
    for i, s in enumerate(starts):
        e = (starts[i + 1] - 1) if i + 1 < len(starts) else last
        while e > s and not has_text(e): e -= 1      # sin páginas finales en blanco
        num = a.primer_articulo + i
        log = []
        rec = X.process_article(pages, s, e, vocab, log)
        ix = next((x for x in index if x['page'] == rec['printed'][0]), None)
        title = ' '.join(rec['title_lines']).strip(); sub = ' '.join(rec['subtitle_lines']).strip() or None
        if title.isupper() and ix and norm(ix['title']).startswith(norm(title)): title = ix['title'][:len(title)]
        elif title.isupper(): title = title.capitalize()
        author = re.sub(r'^\s*por\s+', '', rec['author_pdf'] or '') or (ix['author'] if ix else '') or None
        author_md = ix['author'] if ix else None
        interview = rec['interview']
        if interview:
            m = re.match(r'Entrevista con (.+)', sub or '')
            if m: author = m.group(1).strip()
        aid = 'nc%d-a%d' % (a.numero, num)
        calls = sorted({int(x) for b in rec['blocks'] if b['t'] != 'tabla' for x in re.findall(r'\[\^(\d+)\]', b['text'] + b.get('cite', ''))})
        nn = sorted(int(x) for x in rec['notes'])
        sin_nota = [c for c in calls if c not in nn]; sin_llamada = [c for c in nn if c not in calls]
        cin = rec['cov_in']; cout = X.coverage(rec)
        out = dict(id=aid, issue=a.numero, number=num, title=title, subtitle=sub, author=author, author_md=author_md, author_pdf=rec['author_pdf'],
                   interview=interview, pdf_pages=[s, e], printed_pages=rec['printed'], blocks=rec['blocks'], notes=rec['notes'], unanchored_notes=sin_llamada)
        json.dump(out, open(os.path.join(a.salida, aid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        kinds = collections.Counter(b['t'] for b in rec['blocks'])
        rows.append(dict(id=aid, title=title, subtitle=sub, author=author, blocks=len(rec['blocks']), kinds=dict(kinds), notes=len(rec['notes']), unanchored=sin_llamada, chars_in=cin, chars_out=cout))
        allhy += ['%s · %s' % (aid, l) if not l.startswith(aid) else l for l in log]
        print('%s pdf %d-%d imp %s | %s%s | %s | %s | notas %d | cobertura %d/%d%s | sin_nota %s sin_llamada %s' % (aid, s, e, rec['printed'], title[:50], (' // ' + sub[:30]) if sub else '', author, dict(kinds), len(nn), cin, cout, ' OK' if cin == cout else ' ¡DIFIERE!', sin_nota, sin_llamada))
    # índice y guiones de la carpeta de salida (se conservan los demás números)
    ip = os.path.join(a.salida, '_indice.json')
    old = json.load(open(ip, encoding='utf-8')) if os.path.exists(ip) else []
    old = [r for r in old if not r['id'].startswith('nc%d-' % a.numero)] + rows
    old.sort(key=lambda r: [int(x) for x in re.findall(r'\d+', r['id'])])
    json.dump(old, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    gp = os.path.join(a.salida, 'revision-guiones.txt')
    keep = []
    if os.path.exists(gp):
        keep = [l.rstrip('\n') for l in open(gp, encoding='utf-8').read().split('\n')[2:] if l.strip() and not l.startswith('nc%d-' % a.numero)]
    open(gp, 'w', encoding='utf-8').write('Palabras con guion de fin de línea y decisión automática (unir o conservar el guion), para revisión.\n\n' + '\n'.join(keep + allhy) + '\n')
    print('hecho: %d textos en %s' % (len(rows), a.salida))


if __name__ == '__main__':
    main()
