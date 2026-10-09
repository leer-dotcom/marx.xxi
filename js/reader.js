// Modo lectura: texto íntegro con ajustes tipográficos, posición guardada, búsqueda, marcadores, índice y guía.
import { article, volume, neighbours, text, esc, highlight, fold, store } from './data.js';
import { ICON, openSheet, closeSheet, settingsPanel, bindSettings, styleReader, guideTab, ART_TABS, toast } from './app.js';

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
};

function blockHtml(b, i, q, marked, firstPara) {
  const t = highlight(b.t, q);
  const bm = marked ? ' bm' : '';
  switch (b.k) {
    case 'h': return `<h2 class="sect${bm}" data-b="${i}">${t}</h2>`;
    case 'n': return `<p class="note${bm}" data-b="${i}">${t}</p>`;
    case 'e': return `<p class="epi${bm}" data-b="${i}">${t}</p>`;
    default: return `<p class="${firstPara ? 'first' : ''}${bm}" data-b="${i}">${t}</p>`;
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
  const author = a ? a.author : (v.editor || '');
  document.title = `${title} · Marx XXI`;

  let blocks;
  try { blocks = await text(path); }
  catch (e) { return `<div class="wrap"><p class="empty">No se pudo cargar el texto (${esc(e.message)}).</p></div>`; }

  const next = a ? neighbours(a.id).next : null;
  const marks = new Set(store.bookmarks().filter(b => b.id === key).map(b => b.block));
  let prevKind = null;
  const body = blocks.map((b, i) => {
    const first = b.k === 'p' && prevKind !== 'p';
    prevKind = b.k === 'n' ? prevKind : b.k;
    return blockHtml(b, i, '', marks.has(i), first);
  }).join('');

  const html = `
  <div class="reader-top"><div class="inner" id="r-top">
    <a class="icon-btn" href="${a ? '#/articulo/' + a.id : '#/volumen/' + v.number + '/0'}" aria-label="Volver" id="r-back">${SVG.back}</a>
    <div class="titles"><b>${esc(title)}</b><span>${esc(author)}</span></div>
    <button class="icon-btn" id="r-find" aria-label="Buscar en el texto">${SVG.search}</button>
    <button class="icon-btn" id="r-mark" aria-label="Marcador en este pasaje">${SVG.mark}</button>
  </div></div>

  <article class="reader" id="reader" lang="es" data-vol="${v.number}">
    <header class="r-head">
      <div class="eyebrow">Marx XXI · Volumen ${v.number}${a ? ' · Art. ' + a.number : ''}</div>
      <h1>${esc(title)}</h1>
      ${author ? `<div class="by">${esc(author)}</div>` : ''}
    </header>
    ${body}
    <footer class="reader-end">
      <div class="fleuron" aria-hidden="true">❧</div>
      ${a ? `<a class="btn ghost" href="#/articulo/${a.id}/4">Ver la cita y la conclusión de la guía</a>` : ''}
      ${next ? `<a class="btn" href="#/leer/${next.id}">Siguiente: ${esc(next.title)}</a>` : ''}
    </footer>
  </article>

  <div class="reader-bottom"><div class="inner">
    <div class="seek"><input type="range" id="r-seek" min="0" max="1000" value="0" aria-label="Posición en el texto"><span class="pct" id="r-pct">0 %</span></div>
    <div class="buttons">
      <button class="bar-btn" id="r-index">${SVG.list}Índice</button>
      ${a ? `<button class="bar-btn" id="r-guide">${SVG.guide}Guía</button>` : ''}
      <button class="bar-btn" id="r-aa">${SVG.aa}Aa</button>
    </div>
  </div></div>`;

  return [html, () => mount({ key, a, blocks, marks, params })];
}

function mount({ key, a, blocks, marks, params }) {
  document.body.classList.add('reading');
  document.body.dataset.vol = $('#reader').dataset.vol;
  const reader = $('#reader');
  let s = store.settings();
  styleReader(reader, s);
  const els = [...reader.querySelectorAll('[data-b]')];
  const topH = () => ($('.reader-top')?.offsetHeight || 56) + 8;

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
  requestAnimationFrame(() => {
    if (startB != null) goTo(+startB, { flash: true });
    else if (saved) goTo(saved.block);
    else window.scrollTo(0, 0);
    if (params.get('q')) openFind(params.get('q'));
    updateUi();
  });

  // --- scroll: progreso, guardado, ocultar barras
  let lastY = scrollY, saveT = 0, ticking = false;
  const seek = $('#r-seek'), pctEl = $('#r-pct'), markBtn = $('#r-mark');
  function updateUi() {
    const p = progress();
    if (!seek.matches(':active')) seek.value = Math.round(p * 1000);
    pctEl.textContent = Math.round(p * 100) + ' %';
    const cb = currentBlock();
    markBtn.classList.toggle('on', marks.has(cb));
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
      saveT = setTimeout(() => store.savePosition(key, currentBlock(), progress()), 500);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  seek.addEventListener('input', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, (seek.value / 1000) * max);
  });

  // --- tocar el texto muestra/oculta las barras
  reader.addEventListener('click', e => {
    if (e.target.closest('a,button') || String(getSelection()).length) return;
    document.body.classList.toggle('chrome-hidden');
  });

  // --- marcadores
  markBtn.addEventListener('click', () => {
    const cb = currentBlock();
    const on = store.toggleBookmark(key, cb, blocks[cb]?.t || '');
    on ? marks.add(cb) : marks.delete(cb);
    elOf(cb)?.classList.toggle('bm', on);
    toast(on ? 'Marcador guardado' : 'Marcador eliminado');
    updateUi();
  });

  // --- búsqueda en el texto
  let finding = false, hits = [], cursor = 0, lit = new Set();
  const topInner = $('#r-top'), topNormal = topInner.innerHTML;
  function renderMatches(q) {
    const f = fold(q).trim();
    for (const i of lit) { const el = els.find(e => +e.dataset.b === i); if (el) el.innerHTML = esc(blocks[i].t); }
    lit = new Set();
    hits = [];
    if (f.length < 2) return;
    blocks.forEach((b, i) => {
      if (fold(b.t).includes(f)) {
        const el = els.find(e => +e.dataset.b === i);
        if (!el || el.offsetParent === null) return; // nota oculta
        el.innerHTML = highlight(b.t, q);
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
    const mb = $('#r-mark');
    if (mb !== markBtn) mb.replaceWith(markBtn);
    updateUi();
  }
  bindTop();

  // --- índice (secciones + marcadores)
  $('#r-index').onclick = () => {
    const items = blocks.map((b, i) => ({ b, i })).filter(({ b, i }) => b.k === 'h' || marks.has(i));
    openSheet('Índice del texto', `<div class="toc-list">
      <a href="#" data-jump="0">Inicio del texto</a>
      ${items.map(({ b, i }) => `<a href="#" data-jump="${i}" class="${b.k === 'h' ? '' : 'mark'}">${esc(b.t.length > 140 ? b.t.slice(0, 140) + '…' : b.t)}</a>`).join('')}
      ${items.length ? '' : '<p class="muted small" style="margin-top:12px">No se han detectado secciones en este texto y aún no hay marcadores.</p>'}
    </div>`, body => body.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]'); if (!j) return;
      e.preventDefault(); closeSheet();
      +j.dataset.jump === 0 ? window.scrollTo(0, 0) : goTo(+j.dataset.jump, { flash: true });
    }));
  };

  // --- guía del artículo sin salir del texto
  if (a) $('#r-guide').onclick = () => {
    const names = ART_TABS.slice(0, 5);
    const render = t => `<nav class="tabs" aria-label="Guía">${names.map((n, i) =>
      `<a href="#" data-gt="${i}" ${i === t ? 'aria-current="page"' : ''}>${n}</a>`).join('')}</nav><div id="g-body">${guideTab(a, t)}</div>`;
    openSheet('Guía del artículo', render(0), body => {
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
    if (e.target.matches('input,textarea') || $('#sheet').open) return;
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
    store.savePosition(key, currentBlock(), progress());
    removeEventListener('scroll', onScroll);
    removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    clearTimeout(saveT);
    requestWake(false);
    document.body.classList.remove('reading', 'chrome-hidden');
    delete document.body.dataset.vol;
  };
}
