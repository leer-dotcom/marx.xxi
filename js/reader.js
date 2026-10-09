// Modo lectura: texto íntegro con ajustes tipográficos, posición guardada, búsqueda, marcadores, índice y guía.
import { article, volume, neighbours, text, esc, highlight, fold, store, MK, HL_COLORS, volHead, volShort, artLabel, byline } from './data.js';
import { ICON, openSheet, closeSheet, settingsPanel, bindSettings, styleReader, guideTab, ART_TABS, TAB, toast } from './app.js';

const $ = (s, el = document) => el.querySelector(s);
const SVG = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
  guide: '<svg viewBox="0 0 24 24"><path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c3 2.3 8 2.3 11 0V11M21.5 9v5"/></svg>',
  aa: '<svg viewBox="0 0 24 24"><path d="M4 18L9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12H10l-5 4z"/><path d="M8.5 8.5h7M8.5 12h4.5"/></svg>',
};
const hlColor = k => (HL_COLORS[k] || HL_COLORS.yellow)[1];

/** Convierte las marcas internas (cursiva, negrita, llamadas a nota, página impresa) en HTML. */
function rich(html) {
  let it = false, bd = false;
  return html.replace(/[\uE000\uE001]|[\u{F0000}-\u{F7FFF}]/gu, m => {
    if (m === MK.it) { it = !it; return it ? '<em>' : '</em>'; }
    if (m === MK.bd) { bd = !bd; return bd ? '<strong>' : '</strong>'; }
    const c = m.codePointAt(0);
    if (c >= MK.page) return `<span class="pgm" data-pg="${c - MK.page}" aria-label="Comienza la página ${c - MK.page}"></span>`;
    const n = c - MK.note;
    return `<sup class="fn"><button type="button" class="fn-b" data-note="${n}" aria-label="Nota ${n}">${n}</button></sup>`;
  }) + (it ? '</em>' : '') + (bd ? '</strong>' : '');
}

function inner(b, q) {
  if (b.k === 'tabla') { // tabla de Nuevo Ciclo: la primera fila es la cabecera; las filas de una celda, subtítulos
    const cell = c => rich(highlight(c, q));
    const width = Math.max(...b.rows.map(r => r.length));
    const rows = b.rows.map((r, i) => r.length === 1
      ? `<tr class="${i ? 'tsub' : 'thead'}"><th colspan="${width}">${cell(r[0])}</th></tr>`
      : `<tr>${r.map((c, j) => `<td${j ? ' class="num"' : ''}>${cell(c)}</td>`).join('')}${'<td></td>'.repeat(width - r.length)}</tr>`).join('');
    return `<div class="tbl-wrap"><table>${rows}</table></div>${b.caption ? `<p class="tbl-cap">${cell(b.caption)}</p>` : ''}`;
  }
  const cite = b.cite ? ` <span class="cite">${rich(highlight(b.cite, q))}</span>` : '';
  const mk = b.k === 'li' && b.mk ? `<span class="mk">${esc(b.mk)}</span> ` : '';
  return mk + rich(highlight(b.t, q)) + cite;
}

function blockHtml(b, i, q, firstPara) {
  const t = inner(b, q);
  switch (b.k) {
    case 'h': {
      const l = b.lvl >= 4 ? 4 : b.lvl === 3 ? 3 : 2;
      return `<h${l} class="sect l${l}" data-b="${i}">${t}</h${l}>`;
    }
    case 'n': return `<p class="note" data-b="${i}">${t}</p>`;
    case 'e': return `<p class="epi" data-b="${i}">${t}</p>`;
    case 'q': return `<p class="bq" data-b="${i}">${t}</p>`;
    case 'li': return `<p class="li" data-b="${i}">${t}</p>`;
    case 'qn': return `<p class="qn" data-b="${i}">${t}</p>`; // pregunta de la entrevista
    case 'sep': return `<p class="sep" data-b="${i}" aria-hidden="true">${esc(b.t)}</p>`;
    case 'tabla': return `<figure class="tbl" data-b="${i}">${t}</figure>`;
    default: return `<p class="${firstPara && !b.cont ? 'first' : ''}${b.cont ? ' cont' : ''}" data-b="${i}">${t}</p>`;
  }
}

// ---------------------------------------------------------------- subrayados
// Las posiciones se cuentan sobre el texto visible del bloque sin llamadas a nota, viñetas ni
// fuente de la cita: coincide con el texto sin marcas (b.p), así que no depende del HTML.
const SKIP = '.fn,.mk,.cite';
function textNodes(el) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const out = [];
  for (let n; (n = w.nextNode());) out.push(n);
  return out;
}
/** Carácter del bloque `el` en el que cae el punto (node, off) de una selección. */
function offsetAt(el, node, off) {
  const r = document.createRange();
  r.setStart(el, 0);
  try { r.setEnd(node, off); } catch { return 0; }
  let n = 0;
  for (const t of textNodes(el)) {
    if (t === node) return n + off;
    if (r.comparePoint(t, t.length) <= 0) n += t.length; else break;
  }
  return n;
}
/** Envuelve en <mark> los caracteres [from, to) del bloque. */
function paint(el, from, to, h) {
  const segs = [];
  let pos = 0;
  for (const t of textNodes(el)) {
    const a = pos, b = pos + t.length;
    pos = b;
    const s = Math.max(from, a), e = Math.min(to, b);
    if (e > s) segs.push([t, s - a, e - a]);
  }
  for (const [t, s, e] of segs) {
    let x = t;
    if (s > 0) x = x.splitText(s);
    if (e - s < x.length) x.splitText(e - s);
    const m = document.createElement('mark');
    m.className = 'hl' + (h.note ? ' has-note' : '');
    m.dataset.hl = h.uid;
    m.style.setProperty('--hl', hlColor(h.color));
    x.replaceWith(m);
    m.append(x);
  }
}

export async function readerView(key, params) {
  const isPres = key?.startsWith('tomo-');
  const pv = isPres ? volume(+key.slice(5)) : null;
  const hit = isPres ? null : article(key);
  if (!pv?.presentation_text && !hit) return `<div class="wrap"><p class="empty">Texto no encontrado. <a href="#/">Inicio</a></p></div>`;

  const v = pv || hit.v, a = hit?.a || null;
  const path = pv ? pv.presentation_text : a.text_file;
  const title = a ? a.title : (v.number === 5 ? 'Nota introductoria' : 'Presentación');
  const author = a ? byline(a) : (v.editor || '');
  document.title = `${title} · Lector de Marx XXI`;

  let blocks;
  try { blocks = await text(path); }
  catch (e) { return `<div class="wrap"><p class="empty">No se pudo cargar el texto (${esc(e.message)}).</p></div>`; }

  const next = a ? neighbours(a.id).next : null;
  let prevKind = null;
  const body = blocks.map((b, i) => {
    const first = b.k === 'p' && prevKind !== 'p';
    prevKind = b.k;
    return blockHtml(b, i, '', first);
  }).join('');

  const html = `
  <div class="reader-top"><div class="inner" id="r-top">
    <button class="icon-btn" data-open-menu aria-label="Menú" title="Menú">${SVG.menu}</button>
    <a class="icon-btn" href="${a ? '#/articulo/' + a.id : v.href + '/0'}" aria-label="Volver" id="r-back">${SVG.back}</a>
    <div class="titles"><b>${esc(title)}</b><span>${esc(volShort(v))}${author ? ' · ' + esc(author) : ''}</span></div>
    <button class="icon-btn" id="r-find" aria-label="Buscar en el texto">${SVG.search}</button>
  </div></div>
  <div class="hl-bar" id="hl-bar" role="toolbar" aria-label="Subrayar el pasaje seleccionado" hidden>
    ${Object.entries(HL_COLORS).map(([k, [n, c]]) => `<button type="button" class="hl-sw" data-color="${k}" style="--hl:${c}" aria-label="Subrayar en ${n.toLowerCase()}" title="${n}"></button>`).join('')}
    <button type="button" class="hl-add-note" data-color="note" aria-label="Subrayar y añadir una nota" title="Subrayar y añadir nota">${SVG.note}</button>
  </div>

  <article class="reader" id="reader" lang="es" data-vol="${v.key}">
    <header class="r-head">
      <a class="eyebrow r-vol" href="${v.href}">${esc(volHead(v))}${a ? ' · ' + artLabel(a) : ''}</a>
      <h1>${esc(title)}${(blocks.titleNotes || []).map(n => rich(String.fromCodePoint(MK.note + n))).join('')}</h1>
      ${author ? `<div class="by">${esc(author)}</div>` : ''}
      ${a?.interviewee ? `<div class="by-sub">${esc(a.author)}</div>` : ''}
    </header>
    ${body}
    ${blocks.orphans.length ? `<section class="orphans"><h3>Notas sin llamada en el texto</h3>
      <p class="muted small">Estas notas figuran en ${v.label ? 'la revista' : 'el libro'}, pero la llamada no se imprimió en el texto.</p>
      ${blocks.orphans.map(n => `<p class="note" data-orphan="${n}"><b>${n}.</b> ${rich(esc(blocks.notes[n].text))}</p>`).join('')}</section>` : ''}
    <footer class="reader-end">
      <div class="fleuron" aria-hidden="true">❧</div>
      ${a ? `<a class="btn ghost" href="#/articulo/${a.id}/${TAB.cita}">Ver la cita y la conclusión de la guía</a>` : ''}
      ${next ? `<a class="btn" href="#/leer/${next.id}">Siguiente: ${esc(next.title)}</a>` : ''}
    </footer>
  </article>

  <div class="reader-bottom"><div class="inner">
    <div class="seek"><input type="range" id="r-seek" min="0" max="1000" value="0" aria-label="Posición en el texto"><span class="pct" id="r-pct">0 %</span></div>
    <div class="buttons">
      <button class="bar-btn" id="r-index">${SVG.list}Índice</button>
      ${a ? `<button class="bar-btn" id="r-guide">${SVG.guide}Guía de estudio</button>` : ''}
      <button class="bar-btn" id="r-aa">${SVG.aa}Aa</button>
    </div>
  </div></div>`;

  return [html, () => mount({ key, a, v, blocks, params })];
}

function mount({ key, a, v, blocks, params }) {
  document.body.classList.add('reading');
  document.body.dataset.vol = $('#reader').dataset.vol;
  const reader = $('#reader');
  let s = store.settings();
  styleReader(reader, s);
  const els = [...reader.querySelectorAll('[data-b]')];
  const elByB = new Map(els.map(e => [+e.dataset.b, e]));
  const topH = () => ($('.reader-top')?.offsetHeight || 56) + 8;

  // --- subrayados: pintar, crear y editar
  let hls = store.highlights(key), curQ = '';
  const end = h => (h.o1 < 0 ? Infinity : h.o1);
  function paintBlock(i) {
    const el = elByB.get(i); if (!el) return;
    for (const h of [...hls].reverse()) { // los más recientes, encima
      if (i < h.b0 || i > h.b1) continue;
      paint(el, i === h.b0 ? h.o0 : 0, i === h.b1 ? end(h) : Infinity, h);
    }
  }
  function renderBlock(i, q = curQ) {
    const el = elByB.get(i); if (!el) return;
    el.innerHTML = inner(blocks[i], q);
    paintBlock(i);
  }
  const repaint = h => { for (let i = h.b0; i <= h.b1; i++) renderBlock(i); };
  new Set(hls.flatMap(h => Array.from({ length: h.b1 - h.b0 + 1 }, (_, k) => h.b0 + k))).forEach(paintBlock);

  function hlText(h) {
    const parts = [];
    for (let i = h.b0; i <= h.b1; i++) {
      const p = blocks[i]?.p || '';
      parts.push(p.slice(i === h.b0 ? h.o0 : 0, i === h.b1 && h.o1 >= 0 ? h.o1 : p.length));
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
  /** Selección actual → { b0, o0, b1, o1 } o null. */
  function selectionRange() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    if (!reader.contains(r.commonAncestorContainer)) return null;
    const hit = els.filter(e => e.offsetParent !== null && !e.classList.contains('tbl') && r.intersectsNode(e));
    if (!hit.length) return null;
    const len = e => blocks[+e.dataset.b].p.length;
    let o0 = hit[0].contains(r.startContainer) ? offsetAt(hit[0], r.startContainer, r.startOffset) : 0;
    let o1 = hit.at(-1).contains(r.endContainer) ? offsetAt(hit.at(-1), r.endContainer, r.endOffset) : len(hit.at(-1));
    // triple clic: la selección acaba al principio del bloque siguiente (o empieza al final del anterior)
    while (hit.length > 1 && o1 === 0) { hit.pop(); o1 = len(hit.at(-1)); }
    while (hit.length > 1 && o0 >= len(hit[0])) { hit.shift(); o0 = 0; }
    const h = { b0: +hit[0].dataset.b, o0, b1: +hit.at(-1).dataset.b, o1 };
    if (h.b0 === h.b1 && h.o0 >= h.o1) return null;
    return hlText(h) ? h : null;
  }

  const bar = $('#hl-bar');
  let pending = null, selT = 0;
  function placeBar() {
    pending = selectionRange();
    if (!pending) { bar.hidden = true; return; }
    const rects = getSelection().getRangeAt(0).getClientRects();
    const first = rects[0], last = rects[rects.length - 1] || first;
    bar.hidden = false;
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    const bottomBar = document.body.classList.contains('chrome-hidden') ? 0 : ($('.reader-bottom')?.offsetHeight || 0);
    // debajo de la selección (en el móvil el menú del sistema aparece encima); si no cabe, encima
    let top = last.bottom + 12;
    if (top + bh > innerHeight - bottomBar - 8) top = Math.max(8, first.top - bh - 12);
    const cx = (first.left + last.right) / 2;
    bar.style.top = top + 'px';
    bar.style.left = Math.min(innerWidth - bw - 8, Math.max(8, cx - bw / 2)) + 'px';
  }
  const onSel = () => { clearTimeout(selT); selT = setTimeout(placeBar, 150); };
  document.addEventListener('selectionchange', onSel);
  bar.addEventListener('pointerdown', e => e.preventDefault()); // no perder la selección
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-color]'); if (!b || !pending) return;
    const withNote = b.dataset.color === 'note';
    const h = store.addHighlight({ key, ...pending, color: withNote ? store.lastColor() : b.dataset.color, text: hlText(pending) });
    hls = store.highlights(key);
    getSelection().removeAllRanges();
    bar.hidden = true; pending = null;
    repaint(h);
    if (withNote) openHighlight(h.uid, true);
    else toast('Subrayado guardado · tócalo para añadir una nota');
  });

  function openHighlight(id, focusNote = false) {
    const h = hls.find(x => x.uid === id); if (!h) return;
    const colors = cur => Object.entries(HL_COLORS).map(([k, [n, c]]) =>
      `<button type="button" class="hl-sw" data-color="${k}" style="--hl:${c}" aria-pressed="${k === cur}" aria-label="${n}" title="${n}"></button>`).join('');
    openSheet('Subrayado', `
      <blockquote class="hl-quote" style="--hl:${hlColor(h.color)}">${esc(h.text.length > 600 ? h.text.slice(0, 600) + '…' : h.text)}</blockquote>
      <div class="hl-colors" role="group" aria-label="Color del subrayado">${colors(h.color)}</div>
      <label class="hl-label" for="hl-note">Nota propia</label>
      <textarea id="hl-note" rows="5" placeholder="Escribe aquí tu comentario sobre este pasaje…">${esc(h.note)}</textarea>
      <div class="hl-actions">
        <button type="button" class="btn" data-done>Guardar</button>
        <button type="button" class="btn ghost" data-remove>Quitar subrayado</button>
      </div>
      <p class="muted small" style="margin-top:14px">Los subrayados y sus notas se guardan en este navegador y aparecen en <a href="#/marcadores" data-close>Marcadores</a>.</p>`,
    body => {
      const ta = $('#hl-note', body);
      let t = 0;
      const save = () => {
        clearTimeout(t);
        if (ta.value === h.note || !hls.includes(h)) return;
        h.note = ta.value;
        store.updateHighlight(h.uid, { note: h.note });
        repaint(h);
      };
      body.oninput = e => { if (e.target === ta) { clearTimeout(t); t = setTimeout(save, 400); } };
      body.onclick = e => {
        const sw = e.target.closest('.hl-colors [data-color]');
        if (sw) {
          h.color = sw.dataset.color;
          store.updateHighlight(h.uid, { color: h.color });
          body.querySelectorAll('.hl-colors [data-color]').forEach(b => b.setAttribute('aria-pressed', b === sw));
          $('.hl-quote', body).style.setProperty('--hl', hlColor(h.color));
          repaint(h);
        } else if (e.target.closest('[data-done]')) { save(); closeSheet(); }
        else if (e.target.closest('[data-remove]')) {
          if (h.note.trim() && !confirm('¿Quitar el subrayado y su nota?')) return;
          clearTimeout(t);
          store.removeHighlight(h.uid);
          hls = store.highlights(key);
          repaint(h);
          closeSheet();
          toast('Subrayado eliminado');
        }
      };
      $('#sheet').addEventListener('close', () => { save(); body.oninput = body.onclick = null; }, { once: true });
      if (focusNote) ta.focus();
    });
  }
  if (!store.highlights().length) {
    let seen = true;
    try { seen = !!sessionStorage.getItem('mx.hlHint'); sessionStorage.setItem('mx.hlHint', '1'); } catch { /* sin almacenamiento */ }
    if (!seen) setTimeout(() => toast('Selecciona un pasaje para subrayarlo'), 900);
  }

  // --- bloque actual (búsqueda binaria sobre las posiciones en pantalla)
  function currentBlock() {
    const y = topH();
    let lo = 0, hi = els.length - 1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const r = els[mid].getBoundingClientRect();
      if (r.bottom > y) { ans = mid; hi = mid - 1; } else lo = mid + 1;
    }
    return +els[ans]?.dataset.b || 0;
  }
  function elOf(block) {
    return els.find(e => +e.dataset.b >= block && e.offsetParent !== null) || els[els.length - 1];
  }
  function goTo(block, { flash = false, smooth = false } = {}) {
    const el = elOf(block); if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - topH() - 8, behavior: smooth ? 'smooth' : 'auto' });
    if (flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max <= 0 ? 1 : Math.min(1, Math.max(0, scrollY / max));
  };

  // --- restaurar posición
  const startB = params.get('b');
  const saved = store.position(key);
  let restored = false; // hasta volver a la posición guardada no se guarda nada (no pisar el % con un 0)
  requestAnimationFrame(() => {
    restored = true;
    if (startB != null) goTo(+startB, { flash: true });
    else if (saved) goTo(saved.block);
    else window.scrollTo(0, 0);
    if (params.get('q')) openFind(params.get('q'));
    updateUi();
  });

  // --- scroll: progreso, guardado, ocultar barras
  let lastY = scrollY, saveT = 0, ticking = false;
  const seek = $('#r-seek'), pctEl = $('#r-pct');
  function updateUi() {
    const p = progress();
    if (!seek.matches(':active')) seek.value = Math.round(p * 1000);
    pctEl.textContent = Math.round(p * 100) + ' %';
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      if (!finding && Math.abs(y - lastY) > 30) {
        document.body.classList.toggle('chrome-hidden', y > lastY && y > 120);
        lastY = y;
      }
      updateUi();
      clearTimeout(saveT);
      saveT = setTimeout(() => restored && store.savePosition(key, currentBlock(), progress()), 500);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  seek.addEventListener('input', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, (seek.value / 1000) * max);
  });

  // --- tocar el texto muestra/oculta las barras
  reader.addEventListener('click', e => {
    if (e.target.closest('a,button,mark.hl') || String(getSelection()).length) return;
    document.body.classList.toggle('chrome-hidden');
  });

  // --- notas: al pulsar el número se abre la referencia completa
  reader.addEventListener('click', e => {
    const bt = e.target.closest('[data-note]'); if (!bt) return;
    e.preventDefault(); e.stopPropagation();
    const n = bt.dataset.note, nt = blocks.notes[n];
    openSheet('Nota ' + n, nt
      ? `<div class="note-sheet"><p>${rich(esc(nt.text)).replace(/\n/g, '</p><p>')}</p>${nt.pg ? `<p class="muted small">Página ${nt.pg} ${v.label ? 'de la revista' : 'del libro'}</p>` : ''}</div>`
      : `<p class="empty">No se encontró la nota ${esc(n)}.</p>`);
  });

  // --- tocar un subrayado abre su nota
  reader.addEventListener('click', e => {
    const m = e.target.closest('mark.hl');
    if (!m || e.target.closest('[data-note]') || String(getSelection()).length) return;
    openHighlight(m.dataset.hl);
  });

  // --- búsqueda en el texto
  let finding = false, hits = [], cursor = 0, lit = new Set();
  const topInner = $('#r-top'), topNormal = topInner.innerHTML;
  function renderMatches(q) {
    const f = fold(q).trim();
    curQ = q;
    for (const i of lit) renderBlock(i, '');
    lit = new Set();
    hits = [];
    if (f.length < 2) return;
    blocks.forEach((b, i) => {
      if (fold(b.p).includes(f)) {
        const el = els.find(e => +e.dataset.b === i);
        if (!el || el.offsetParent === null) return; // nota oculta
        renderBlock(i, q);
        lit.add(i); hits.push(i);
      }
    });
  }
  function openFind(initial = '') {
    finding = true;
    document.body.classList.remove('chrome-hidden');
    topInner.innerHTML = `<div class="findbar">
      <button class="icon-btn" id="f-close" aria-label="Cerrar búsqueda">${SVG.x}</button>
      <input id="f-q" type="search" placeholder="Buscar en este texto" autocomplete="off" enterkeyhint="search">
      <span class="count" id="f-count">0</span>
      <button class="icon-btn" id="f-prev" aria-label="Anterior">${SVG.up}</button>
      <button class="icon-btn" id="f-next" aria-label="Siguiente">${SVG.down}</button></div>`;
    const input = $('#f-q'), count = $('#f-count');
    const show = () => { count.textContent = hits.length ? `${cursor + 1}/${hits.length}` : '0'; };
    const jump = d => { if (!hits.length) return; cursor = (cursor + d + hits.length) % hits.length; goTo(hits[cursor], { flash: true }); show(); };
    let t = 0;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        renderMatches(input.value);
        const cb = currentBlock();
        cursor = Math.max(0, hits.findIndex(h => h >= cb));
        show();
      }, 200);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); jump(e.shiftKey ? -1 : (hits[cursor] === currentBlock() ? 1 : 0)); }
      if (e.key === 'Escape') closeFind();
    });
    $('#f-prev').onclick = () => jump(-1);
    $('#f-next').onclick = () => jump(1);
    $('#f-close').onclick = closeFind;
    if (initial) { input.value = initial; renderMatches(initial); cursor = Math.max(0, hits.indexOf(+params.get('b'))); show(); }
    else input.focus();
  }
  function closeFind() {
    finding = false;
    renderMatches('');
    topInner.innerHTML = topNormal;
    bindTop();
  }
  function bindTop() {
    $('#r-find').onclick = () => openFind();
    updateUi();
  }
  bindTop();

  // --- índice (secciones + subrayados)
  $('#r-index').onclick = () => {
    const cut = t => esc(t.length > 140 ? t.slice(0, 140) + '…' : t);
    const lvlOf = b => (b.lvl >= 3 ? ' sub' + (b.lvl >= 4 ? 2 : 1) : '');
    const items = [
      ...blocks.map((b, i) => b.k === 'h' && { i, o: -1, html: `<a href="#" data-jump="${i}" class="${lvlOf(b)}">${cut(b.p)}</a>` }).filter(Boolean),
      ...hls.map(h => ({ i: h.b0, o: h.o0, html: `<a href="#" data-jump="${h.b0}" class="mark${h.note ? ' has-note' : ''}" style="--hl:${hlColor(h.color)}">${cut(h.text)}</a>` })),
    ].sort((x, y) => x.i - y.i || x.o - y.o);
    openSheet('Índice del texto', `<div class="toc-list">
      <a href="#" data-jump="0">Inicio del texto</a>
      ${items.map(x => x.html).join('')}
      ${items.length ? '' : '<p class="muted small" style="margin-top:12px">No se han detectado secciones en este texto y aún no hay subrayados.</p>'}
    </div>`, body => {
      body.onclick = e => {
        const j = e.target.closest('[data-jump]'); if (!j) return;
        e.preventDefault(); closeSheet();
        +j.dataset.jump === 0 ? window.scrollTo(0, 0) : goTo(+j.dataset.jump, { flash: true });
      };
    });
  };

  // --- guía del artículo sin salir del texto
  if (a) $('#r-guide').onclick = () => {
    // todas las pestañas de la guía menos «Texto completo», que es el propio lector
    const ids = ART_TABS.map((_, i) => i).filter(i => i !== TAB.texto);
    const render = t => `<nav class="tabs" aria-label="Guía">${ids.map(i =>
      `<a href="#" data-gt="${i}" ${i === t ? 'aria-current="page"' : ''}>${ART_TABS[i]}</a>`).join('')}</nav><div id="g-body">${guideTab(a, t)}</div>`;
    openSheet('Guía de estudio', render(ids[0]), body => {
      body.onclick = e => {
        const t = e.target.closest('[data-gt]'); if (!t) return;
        e.preventDefault(); body.innerHTML = render(+t.dataset.gt); body.scrollTop = 0;
      };
    });
  };

  // --- ajustes tipográficos conservando la posición
  $('#r-aa').onclick = () => {
    openSheet('Ajustes de lectura', settingsPanel(store.settings()), body => {
      body.onclick = null;
      bindSettings(body, ns => {
        const cb = currentBlock();
        s = ns; styleReader(reader, s);
        requestAnimationFrame(() => { goTo(cb); updateUi(); });
        requestWake(s.wakeLock);
      });
    });
  };

  // --- teclado (escritorio)
  function onKey(e) {
    if (e.target.matches('input,textarea') || $('#sheet').open || $('#menu').open) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); openFind(); }
    else if (e.key === 'Escape' && finding) closeFind();
  }
  addEventListener('keydown', onKey);

  // --- pantalla encendida
  let wake = null;
  async function requestWake(on) {
    try {
      if (on && !wake && 'wakeLock' in navigator) wake = await navigator.wakeLock.request('screen');
      if (!on && wake) { await wake.release(); wake = null; }
    } catch { wake = null; }
  }
  const onVis = () => { if (document.visibilityState === 'visible' && s.wakeLock) { wake = null; requestWake(true); } };
  document.addEventListener('visibilitychange', onVis);
  requestWake(s.wakeLock);

  return () => {
    if (restored) store.savePosition(key, currentBlock(), progress());
    removeEventListener('scroll', onScroll);
    removeEventListener('keydown', onKey);
    document.removeEventListener('selectionchange', onSel);
    clearTimeout(selT);
    document.removeEventListener('visibilitychange', onVis);
    clearTimeout(saveT);
    requestWake(false);
    document.body.classList.remove('reading', 'chrome-hidden');
    delete document.body.dataset.vol;
  };
}
