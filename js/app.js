// Marx XXI · lector web. SPA sin dependencias con rutas por hash (compatible con GitHub Pages).
import {
  loadLibrary, lib, dataUrl, volume, article, neighbours, text, esc, highlight, fold,
  searchGuide, searchFullText, KIND, store, FONTS, THEMES, DEFAULT_SETTINGS,
} from './data.js';
import { readerView } from './reader.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const ICON = {
  book: '<svg viewBox="0 0 24 24"><path d="M3 5.5C5.5 4.5 8.5 4.5 11.5 6v13c-3-1.5-6-1.5-8.5-.5zM20.5 5.5C18 4.5 15 4.5 12.5 6v13c3-1.5 6-1.5 8-.5z"/></svg>',
  hub: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.5 6.5l3.7 3.7M17.5 6.5l-3.7 3.7M6.5 17.5l3.7-3.7M17.5 17.5l-3.7-3.7"/></svg>',
  az: '<svg viewBox="0 0 24 24"><path d="M3 18L7 6l4 12M4.3 14h5.4M14 6h7l-7 12h7"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4z"/></svg>',
  aa: '<svg viewBox="0 0 24 24"><path d="M4 18L9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
export { ICON };

// ---------------------------------------------------------------- utilidades de UI

export function setBar(title, { back = true } = {}) {
  $('#appbar-title').textContent = title || '';
  $('#btn-back').hidden = !back;
  $('#btn-home').hidden = back;
  document.title = title ? `${title} · Marx XXI` : 'Marx XXI · Lector';
}
$('#btn-back').addEventListener('click', () => (history.length > 1 ? history.back() : (location.hash = '#/')));

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2200);
}

export function openSheet(title, html, onMount) {
  const d = $('#sheet');
  $('#sheet-title').textContent = title;
  const body = $('#sheet-body');
  body.innerHTML = html;
  body.scrollTop = 0;
  if (!d.open) d.showModal();
  onMount?.(body, d);
  return d;
}
export const closeSheet = () => $('#sheet').open && $('#sheet').close();
document.addEventListener('click', e => {
  const c = e.target.closest('[data-close]');
  if (c) c.closest('dialog')?.close();
});
// cerrar al tocar el fondo
for (const d of document.querySelectorAll('dialog.sheet')) {
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
}

// ---------------------------------------------------------------- esquemas
// Los SVG se insertan en línea (no como <img>) para que los pinte diagram.css con los colores del tema:
// modo oscuro, sepia y color de portada del volumen. Ver DIAGRAMAS.md.
const svgCache = new Map();
async function loadSvg(file) {
  if (!svgCache.has(file)) {
    svgCache.set(file, fetch(dataUrl(file)).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }));
  }
  return svgCache.get(file);
}

/** Rellena los huecos .dg[data-svg] que aún estén vacíos (vistas, hojas, guía del lector). */
function hydrateDiagrams(root = document) {
  for (const host of root.querySelectorAll('.dg[data-svg]:not([data-state])')) {
    host.dataset.state = 'loading';
    loadSvg(host.dataset.svg).then(svg => {
      host.innerHTML = svg;
      host.dataset.state = 'ok';
    }).catch(() => {
      host.dataset.state = 'error';
      host.innerHTML = `<p class="dg-error">No se pudo cargar el esquema.</p>`;
    });
  }
}
new MutationObserver(() => hydrateDiagrams()).observe(document.body, { childList: true, subtree: true });

let zoomScale = 1;
function openZoom(host) {
  const st = $('#zoom-stage');
  const dlg = $('#zoom');
  const vol = host.closest('[data-vol]')?.dataset.vol || document.body.dataset.vol;
  if (vol) dlg.dataset.vol = vol; else delete dlg.dataset.vol;
  st.innerHTML = `<div class="dg">${host.querySelector('.dg')?.innerHTML || ''}</div>`;
  $('#zoom-caption').textContent = host.dataset.caption || '';
  const box = st.firstChild;
  const apply = () => {
    const base = Math.min(st.clientWidth - 24, 1400);
    box.style.width = Math.round(base * zoomScale) + 'px';
    $('#zoom-level').textContent = Math.round(zoomScale * 100) + ' %';
  };
  dlg.onclick = e => {
    const b = e.target.closest('[data-z]');
    if (!b) return;
    const z = b.dataset.z;
    zoomScale = z === '0' ? 1 : Math.min(6, Math.max(0.5, zoomScale * (z === '+' ? 1.4 : 1 / 1.4)));
    apply();
  };
  box.ondblclick = () => { zoomScale = zoomScale > 1 ? 1 : 2.5; apply(); };
  dlg.showModal();
  zoomScale = 1;
  requestAnimationFrame(apply);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-zoom]');
  if (b && b.querySelector('.dg[data-state="ok"]')) openZoom(b);
});

export function figure(f) {
  if (!f) return '';
  // La proporción del viewBox reserva el hueco mientras llega el SVG (sin saltos de maquetación)
  const vb = (f.viewBox || '').split(/\s+/).map(Number);
  const ratio = vb.length === 4 && vb[2] > 0 && vb[3] > 0 ? `aspect-ratio:${vb[2]}/${vb[3]}` : 'min-height:200px';
  const label = f.aria_label || f.caption || 'Esquema';
  return `<figure class="diagram">
    <button type="button" data-zoom data-caption="${esc(f.caption)}" aria-label="Ampliar esquema: ${esc(label)}">
      <div class="dg" data-svg="${esc(f.file)}" style="${ratio}" role="img" aria-label="${esc(label)}"></div>
    </button>
    ${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''}
  </figure>`;
}

const minutes = w => Math.max(1, Math.round(w / 230));
const pct = p => Math.round((p || 0) * 100);
const paras = list => list.map(p => `<p>${esc(p)}</p>`).join('');
function tabs(base, names, current) {
  return `<nav class="tabs" aria-label="Secciones">${names.map((n, i) =>
    `<a href="${base}/${i}" ${i === current ? 'aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>`;
}

// ---------------------------------------------------------------- vistas

function homeView() {
  setBar('', { back: false });
  const L = lib(), cv = L.cross_volume;
  const read = store.read(), pos = store.positions();
  const lastId = store.last(), last = lastId && (lastId.startsWith('tomo-') ? null : article(lastId));
  const tool = (href, icon, title, sub) => `<a class="card tool" href="${href}">${ICON[icon]}<div><strong>${title}</strong><span>${sub}</span></div></a>`;
  return `<div class="wrap">
    <section class="hero">
      <div class="eyebrow">Publicación temática anual de teoría socialista</div>
      <h1>Marx XXI</h1>
      ${cv.lede ? `<p class="lede">${esc(cv.lede)}</p>` : ''}
    </section>
    ${last ? `<a class="card" href="#/leer/${last.a.id}" style="margin-top:18px" data-vol="${last.v.number}">
      <div class="eyebrow vol">Seguir leyendo · Volumen ${last.v.number}</div>
      <h3>${esc(last.a.title)}</h3><div class="muted small">${esc(last.a.author)}</div>
      <div class="progress blue"><i style="width:${pct(pos[last.a.id]?.progress)}%"></i></div>
      <div class="muted small" style="margin-top:4px">${pct(pos[last.a.id]?.progress)} % leído</div>
    </a>` : ''}
    <h2 class="sec-title">Los cinco volúmenes</h2>
    <div class="grid vols">${L.volumes.map(v => {
      const done = v.articles.filter(a => read.has(a.id)).length;
      const avg = v.articles.reduce((s, a) => s + (pos[a.id]?.progress || 0), 0) / v.articles.length;
      return `<a class="card vol-card" href="#/volumen/${v.number}" data-vol="${v.number}">
        <div class="cover"><i><b>marx xxi · ${v.number}</b></i>${done === v.articles.length ? '<span class="badge">Leído</span>' : ''}</div>
        <div class="vc-body">
          <div class="eyebrow">Volumen ${v.number}${v.year ? ' · ' + v.year : ''}</div>
          <h3>${esc(v.title)}</h3>
          <div class="meta"><span>${v.articles.length} artículos</span>${done ? `<span class="check">✓ ${done} leídos</span>` : ''}</div>
          ${avg > 0 ? `<div class="progress"><i style="width:${pct(avg)}%"></i></div>` : ''}
        </div>
      </a>`;
    }).join('')}</div>
    <h2 class="sec-title">Herramientas de estudio</h2>
    <div class="grid two">
      ${tool('#/tesis', 'hub', 'Conclusiones comunes', `${cv.theses.length} tesis transversales`)}
      ${tool('#/glosario', 'az', 'Glosario', `${L.glossary.length} conceptos`)}
      ${tool('#/buscar', 'search', 'Búsqueda', 'Guía y textos íntegros')}
      ${tool('#/marcadores', 'mark', 'Marcadores', 'Pasajes guardados')}
      ${tool('#/ajustes', 'aa', 'Modo lectura', 'Fuente, tamaño, interlineado')}
      ${tool('#/acerca', 'info', 'Acerca de', 'La revista, créditos y licencia')}
    </div>
    ${cv.arc ? `<h2 class="sec-title">El arco de la colección</h2>${figure(cv.arc)}` : ''}
    ${cv.intro?.length ? `<h2 class="sec-title">Qué une a los cinco volúmenes</h2><div class="prose">${paras(cv.intro)}</div>` : ''}
    ${cv.map ? `<h2 class="sec-title">Mapa conceptual común</h2>${figure(cv.map)}` : ''}
    <footer class="site-foot">
      ${cv.colophon ? `<span>${esc(cv.colophon)}</span>` : ''}
      <span>Revista: <a href="https://marxxxi.com/" rel="noopener" target="_blank">marxxxi.com</a> · <a href="#/acerca">Acerca de este lector y créditos</a></span>
      <span>${esc(L.about?.ai_short || 'Guía elaborada con Claude (IA).')}</span>
    </footer>
  </div>`;
}

const VOL_TABS = ['Presentación', 'Artículos', 'Conclusiones', 'Mapa', 'Relaciones'];

function volumeView(n, tab = 1) {
  const v = volume(n);
  if (!v) return notFound();
  setBar(`Volumen ${v.number} · ${v.title}`);
  const pos = store.positions(), read = store.read();
  let body = '';
  if (tab === 0) {
    body = `<div class="eyebrow">Tesis del volumen según la presentación</div><div class="prose" style="margin-top:10px">${paras(v.presentation)}</div>
      ${v.presentation_text ? `<a class="btn ghost block" href="#/leer/tomo-${v.number}">${ICON.book}${v.number === 5 ? 'Leer la nota introductoria completa' : 'Leer la presentación completa'}</a>` : ''}`;
  } else if (tab === 1) {
    body = `<p class="muted small">Índice en el orden de la revista. Abre la guía de cada artículo o ve directamente al texto íntegro.</p>` +
      v.articles.map(a => {
        const p = pos[a.id]?.progress || 0;
        return `<div class="card">
          <div class="row-actions"><span class="eyebrow vol">Art. ${a.number}</span><span class="muted" style="font-size:15px">≈ ${minutes(a.word_count)} min</span><span class="grow"></span>${read.has(a.id) ? '<span class="check">✓ leído</span>' : ''}</div>
          <h3><a href="#/articulo/${a.id}" style="color:inherit;text-decoration:none">${esc(a.title)}</a></h3>
          <div class="muted small">${esc(a.author)}</div>
          ${a.summary[0] ? `<p class="small" style="margin:8px 0 0;color:var(--ink-2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(a.summary[0])}</p>` : ''}
          ${p > 0 ? `<div class="progress"><i style="width:${pct(p)}%"></i></div>` : ''}
          <div class="chips">
            <a class="chip" href="#/articulo/${a.id}/0">Resumen</a>
            <a class="chip" href="#/articulo/${a.id}/2">Esquema</a>
            <a class="chip primary" href="#/leer/${a.id}">${p > 0 ? 'Seguir leyendo' : 'Leer'}</a>
          </div>
        </div>`;
      }).join('');
  } else if (tab === 2) {
    body = v.conclusions.map((c, i) => `<div class="card"><div class="eyebrow vol">Conclusión ${i + 1}</div><h3>${esc(c.title)}</h3><p style="margin:0">${esc(c.text)}</p></div>`).join('');
  } else if (tab === 3) {
    body = figure(v.concept_map) + '<p class="muted small">Toca el mapa para ampliarlo.</p>';
  } else {
    body = v.relations.map(r => {
      const nums = [...r.pair.matchAll(/Art\.\s*(\d+)/g)].map(m => +m[1]);
      return `<div class="card"><div class="eyebrow vol">${esc(r.pair)}</div>${r.concept ? `<h3>${esc(r.concept)}</h3>` : ''}<p style="margin:0">${esc(r.text)}</p>
        <div class="chips">${nums.map(n => v.articles.find(a => a.number === n)).filter(Boolean).map(a =>
          `<a class="chip" href="#/articulo/${a.id}">Art. ${a.number} · ${esc(a.author.split(/ y |,/)[0])}</a>`).join('')}</div></div>`;
    }).join('');
  }
  return `<div class="wrap" data-vol="${v.number}">
    <header class="page-head"><div class="eyebrow vol">${esc(v.eyebrow)}</div><h1>${esc(v.title)}</h1>
      ${v.subtitle ? `<div class="sub">${esc(v.subtitle)}</div>` : ''}
      ${v.editor ? `<div class="muted small" style="margin-top:6px">Edición: ${esc(v.editor)}</div>` : ''}</header>
    ${tabs(`#/volumen/${v.number}`, VOL_TABS, tab)}
    ${body}
  </div>`;
}

export const ART_TABS = ['Resumen', 'Argumento', 'Esquema', 'Conceptos', 'Cita y conclusión', 'Texto completo'];

/** Contenido de las pestañas de guía (también se usa en la hoja «Guía» del lector). */
/** Aviso breve de que la guía está elaborada con IA (Claude), con enlace a los créditos. */
export function aiNote() {
  const t = lib().about?.ai_short || 'Guía elaborada con Claude (IA).';
  return `<p class="ai-note">${ICON.info}<span>${esc(t)} <a href="#/acerca">Más información</a></span></p>`;
}

export function guideTab(a, tab) {
  return guideTabBody(a, tab) + (tab >= 0 && tab <= 4 ? aiNote() : '');
}

function guideTabBody(a, tab) {
  switch (tab) {
    case 0: return `<div class="prose">${paras(a.summary)}</div>
      ${a.references ? `<div class="card" style="margin-top:16px"><div class="eyebrow">Interlocutores y referencias</div><p style="margin:6px 0 0">${esc(a.references)}</p></div>` : ''}`;
    case 1: return `<ol class="steps">${a.argument.map(s => `<li><h3>${esc(s.title)}</h3><div>${esc(s.text)}</div></li>`).join('')}</ol>`;
    case 2: return a.diagrams.length ? a.diagrams.map(figure).join('') + '<p class="muted small">Toca el esquema para ampliarlo.</p>' : '<p class="empty">Este artículo no tiene esquema.</p>';
    case 3: return `<dl class="concepts">${a.concepts.map(c => `<dt>${esc(c.term)}</dt><dd>${esc(c.definition)}</dd>`).join('')}</dl>`;
    case 4: return `${a.quote ? `<blockquote class="quote">${esc(a.quote.text)}<footer>— ${esc(a.quote.source)}</footer></blockquote>` : ''}
      <h2 style="font-size:22px;margin-bottom:10px">Conclusión</h2><div class="prose">${paras(a.conclusion)}</div>`;
    default: return '';
  }
}

function articleView(id, tab = 0) {
  const hit = article(id);
  if (!hit) return notFound();
  const { v, a } = hit;
  setBar(`Volumen ${v.number} · Art. ${a.number}`);
  const p = store.position(a.id)?.progress || 0;
  const { prev, next } = neighbours(a.id);
  let body;
  if (tab === 5) {
    body = `<div class="card">
      <div class="eyebrow">Texto íntegro del artículo</div>
      <p style="margin:8px 0 2px">≈ ${a.word_count.toLocaleString('es')} palabras · ${minutes(a.word_count)} min de lectura</p>
      ${a.pdf_pages ? `<div class="muted small">PDF original (${esc(v.pdf)}): páginas ${a.pdf_pages.from}–${a.pdf_pages.to}</div>` : ''}
      <div style="display:grid;gap:8px;margin-top:16px">
        <a class="btn block" href="#/leer/${a.id}">${ICON.book}${p > 0 ? `Seguir leyendo (${pct(p)} %)` : 'Abrir en modo lectura'}</a>
        ${p > 0 ? `<a class="btn ghost block" href="#/leer/${a.id}?b=0">Empezar desde el principio</a>` : ''}
      </div>
      <p class="muted small" style="margin:14px 0 0">En el modo lectura puedes cambiar la fuente, el tamaño, el interlineado, los márgenes y el tema, guardar marcadores, buscar en el texto y consultar la guía sin perder la posición.</p>
    </div>`;
  } else body = guideTab(a, tab);
  return `<div class="wrap" data-vol="${v.number}">
    <header class="page-head"><a class="eyebrow vol" href="#/volumen/${v.number}" style="text-decoration:none">Volumen ${v.number} · ${esc(v.title)}</a>
      <h1>${esc(a.title)}</h1><div class="by">${esc(a.author)}</div></header>
    ${tabs(`#/articulo/${a.id}`, ART_TABS, tab)}
    ${body}
    <nav class="neighbours" aria-label="Artículos contiguos">
      ${prev ? `<a href="#/articulo/${prev.id}"><small>← Anterior</small>${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="#/articulo/${next.id}"><small>Siguiente →</small>${esc(next.title)}</a>` : '<span></span>'}
    </nav>
  </div>
  <a class="btn fab" href="#/leer/${a.id}" data-vol="${v.number}">${ICON.book}${p > 0 ? 'Seguir leyendo' : 'Leer texto completo'}</a>`;
}

function thesesView() {
  setBar('Conclusiones comunes');
  const L = lib(), cv = L.cross_volume;
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Toda la colección</div><h1>Conclusiones comunes</h1>
    <div class="sub">Tesis que atraviesan los cinco volúmenes. Cada una indica dónde aparece y enlaza con los artículos.</div></header>
    ${cv.theses.map((t, i) => `<div class="card" id="tesis-${i + 1}">
      <div class="eyebrow">Tesis ${i + 1}</div><h3>${esc(t.title)}</h3><p style="margin:0">${esc(t.text)}</p>
      ${t.where ? `<p class="muted small" style="margin:10px 0 0;font-style:italic">${esc(t.where)}</p>
        <div class="chips">${whereLinks(t.where).map(([label, href]) => `<a class="chip" href="${href}">${esc(label)}</a>`).join('')}</div>` : ''}
    </div>`).join('')}
    ${cv.map ? `<h2 class="sec-title">Mapa conceptual común</h2>${figure(cv.map)}` : ''}
  </div>`;
}

/** "Volumen 1 (Ruiz, Bedmar) · Volumen 3 (Gallardo)" → enlaces a artículos por apellido, o al volumen. */
function whereLinks(where) {
  const out = [];
  for (const m of where.matchAll(/(?:Volumen|Tomo)\s+(\d)\s*(?:\(([^)]*)\))?/g)) {
    const v = volume(+m[1]);
    if (!v) continue;
    const names = (m[2] || '').split(/[,;]/).map(s => s.replace(/^(en especial|todo el volumen)\s*/i, '').trim()).filter(s => s.length >= 3);
    const found = [...new Set(names.map(n => v.articles.find(a => fold(a.author).includes(fold(n)))).filter(Boolean))];
    if (!found.length) out.push([`Volumen ${v.number}`, `#/volumen/${v.number}`]);
    else for (const a of found) out.push([`Vol. ${v.number} · ${a.author.split(' y ')[0]}`, `#/articulo/${a.id}`]);
  }
  return out;
}

function glossaryView(params) {
  setBar('Glosario');
  const L = lib();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Glosario</h1><div class="sub">${L.glossary.length} conceptos definidos en los artículos. Toca uno para ir a su artículo.</div></header>
    <div class="sticky-tools">
      <label class="field">${ICON.search}<input id="g-q" type="search" placeholder="Buscar concepto o definición" value="${esc(params.get('q') || '')}" autocomplete="off"></label>
      <div class="chips" id="g-vol">${[0, 1, 2, 3, 4, 5].map(n => `<button class="chip" data-v="${n}" aria-pressed="${n === 0}">${n ? 'Vol. ' + n : 'Todos'}</button>`).join('')}</div>
      <div class="muted small" id="g-count" style="margin-top:8px"></div>
    </div>
    <div id="g-list"></div>
  </div>`;
  return [html, () => {
    let vol = 0;
    const input = $('#g-q'), list = $('#g-list');
    const render = () => {
      const q = input.value.trim(), f = fold(q);
      const items = L.glossary.filter(e => (!vol || e.v.number === vol) && (!f || fold(e.c.term).includes(f) || fold(e.c.definition).includes(f)));
      $('#g-count').textContent = `${items.length} conceptos`;
      list.innerHTML = items.slice(0, 400).map(e => `<a class="list-item" href="#/articulo/${e.a.id}/3" data-vol="${e.v.number}">
        <h3 style="font-weight:700"><span style="color:var(--vol)">▪</span> ${highlight(e.c.term, q)}</h3><p>${highlight(e.c.definition, q)}</p>
        <div class="src">Volumen ${e.v.number} · ${esc(e.a.author)} · ${esc(e.a.title)}</div></a>`).join('') || '<p class="empty">Sin resultados.</p>';
    };
    input.addEventListener('input', () => {
      render();
      history.replaceState(null, '', '#/glosario' + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
    });
    $('#g-vol').addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      vol = +b.dataset.v;
      for (const c of $('#g-vol').children) c.setAttribute('aria-pressed', c === b);
      render();
    });
    render();
  }];
}

function searchView(params) {
  setBar('Buscar');
  const html = `<div class="wrap">
    <div class="sticky-tools">
      <label class="field">${ICON.search}<input id="s-q" type="search" placeholder="Concepto, autor, tema…" value="${esc(params.get('q') || '')}" autocomplete="off" enterkeyhint="search"></label>
      <div class="chips">
        <button class="chip" id="s-guide" aria-pressed="${params.get('en') !== 'textos'}">Guía</button>
        <button class="chip" id="s-full" aria-pressed="${params.get('en') === 'textos'}">Textos íntegros</button>
      </div>
      <div class="progress blue" id="s-prog" hidden><i style="width:0"></i></div>
    </div>
    <div id="s-list"></div>
  </div>`;
  return [html, () => {
    const input = $('#s-q'), list = $('#s-list');
    let full = params.get('en') === 'textos', ctrl = null, timer = 0;
    const item = h => {
      const [label, color] = KIND[h.kind];
      const href = h.kind === 'fulltext' ? `#/leer/${h.a.id}?b=${h.block}&q=${encodeURIComponent(input.value.trim())}`
        : h.a ? `#/articulo/${h.a.id}/${h.kind === 'argument' ? 1 : h.kind === 'concept' ? 3 : 0}`
          : h.kind === 'thesis' ? '#/tesis' : `#/volumen/${h.v.number}/2`;
      const src = h.kind === 'thesis' ? 'Colección' : `Volumen ${h.v.number}${h.a ? ' · ' + esc(h.a.author) : ''}`;
      return `<a class="list-item" href="${href}"><span class="tag ${color}">${label}</span> <span class="muted sc" style="font-size:14.5px">${src}</span>
        <h3>${highlight(h.label, input.value)}</h3><p>${highlight(h.text, input.value)}</p></a>`;
    };
    const run = () => {
      ctrl?.abort();
      const q = input.value.trim();
      history.replaceState(null, '', '#/buscar' + (q ? `?q=${encodeURIComponent(q)}${full ? '&en=textos' : ''}` : ''));
      $('#s-prog').hidden = true;
      if (q.length < 2) {
        list.innerHTML = `<p class="empty">Busca en resúmenes, argumentos, conceptos, conclusiones y tesis comunes. Cambia a «Textos íntegros» para buscar dentro de los ${lib().allArticles.length} artículos completos.</p>`;
        return;
      }
      if (!full) {
        const hits = searchGuide(q);
        list.innerHTML = hits.length ? `<p class="muted small">${hits.length} resultados</p>` + hits.map(item).join('') : '<p class="empty">Sin resultados en la guía. Prueba en «Textos íntegros».</p>';
        return;
      }
      if (q.length < 3) { list.innerHTML = '<p class="empty">Escribe al menos 3 letras para buscar en los textos.</p>'; return; }
      ctrl = new AbortController();
      const my = ctrl;
      let n = 0;
      list.innerHTML = '<p class="muted small" id="s-count">Buscando…</p>';
      const bar = $('#s-prog'); bar.hidden = false;
      searchFullText(q, {
        signal: my.signal,
        onHit: h => { if (my.signal.aborted) return; n++; list.insertAdjacentHTML('beforeend', item(h)); },
        onProgress: (i, t) => {
          if (my.signal.aborted) return;
          bar.firstChild.style.width = (i / t * 100) + '%';
          $('#s-count').textContent = i < t ? `Buscando… ${n} coincidencias` : `${n} coincidencias (máx. 5 por artículo)`;
          if (i === t) bar.hidden = true;
        },
      }).catch(err => { list.insertAdjacentHTML('beforeend', `<p class="empty">Error: ${esc(err.message)}</p>`); });
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, full ? 400 : 120); });
    $('#s-guide').onclick = () => { full = false; $('#s-guide').setAttribute('aria-pressed', true); $('#s-full').setAttribute('aria-pressed', false); run(); };
    $('#s-full').onclick = () => { full = true; $('#s-full').setAttribute('aria-pressed', true); $('#s-guide').setAttribute('aria-pressed', false); run(); };
    run();
    if (!input.value) input.focus();
    return () => ctrl?.abort();
  }];
}

function bookmarksView() {
  setBar('Marcadores');
  const marks = store.bookmarks();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Marcadores</h1></header>
    ${marks.length ? marks.map(b => {
      const hit = article(b.id);
      const title = hit ? hit.a.title : `Presentación del volumen ${b.id.replace('tomo-', '')}`;
      return `<div class="list-item row-actions" style="align-items:flex-start">
        <a href="#/leer/${b.id}?b=${b.block}" style="flex:1;color:inherit;text-decoration:none">
          <div class="src" style="margin:0">${hit ? `Volumen ${hit.v.number} · ${esc(hit.a.author)}` : ''} · ${new Date(b.t).toLocaleDateString('es')}</div>
          <h3>${esc(title)}</h3><p>${esc(b.excerpt)}…</p></a>
        <button class="icon-btn" data-del="${esc(b.id)}|${b.block}" aria-label="Eliminar marcador">${ICON.x}</button>
      </div>`;
    }).join('') : '<p class="empty">Aún no hay marcadores. En el modo lectura, toca el icono de marcador para guardar el pasaje que estás leyendo.</p>'}
  </div>`;
  return [html, () => {
    view.addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const [id, block] = b.dataset.del.split('|');
      store.removeBookmark(id, +block);
      route();
    });
  }];
}

/** Panel de ajustes de lectura; se usa en /ajustes y en la hoja «Aa» del lector. */
export function settingsPanel(s) {
  const range = (key, label, min, max, step, fmt) => `<div class="range-row">
    <label for="set-${key}">${label}</label><output id="out-${key}">${fmt(s[key])}</output>
    <input type="range" id="set-${key}" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}"></div>`;
  const sw = (key, label) => `<label class="switch-row">${label}<input type="checkbox" data-key="${key}" ${s[key] ? 'checked' : ''}></label>`;
  return `
    <div class="set-group">Tema</div>
    <div class="swatches">${Object.entries(THEMES).map(([k, [label, bg, ink]]) =>
      `<button class="swatch" data-theme-set="${k}" aria-pressed="${s.theme === k}"><i style="${bg ? `background:${bg};color:${ink}` : 'background:linear-gradient(135deg,#efecec 50%,#2c332f 50%);color:#716a56'}">Aa</i>${label}</button>`).join('')}</div>
    <div class="set-group">Fuente</div>
    <div class="chips" style="margin:0">${Object.entries(FONTS).map(([k, [label, css]]) =>
      `<button class="chip" data-font-set="${k}" aria-pressed="${s.font === k}" style='font-family:${css};font-weight:400'>${label}</button>`).join('')}</div>
    <div class="set-group">Texto</div>
    ${range('size', 'Tamaño', 13, 32, 1, v => v + ' px')}
    ${range('lineHeight', 'Interlineado', 1.1, 2.4, 0.05, v => (+v).toFixed(2))}
    ${range('paraGap', 'Espacio entre párrafos', 0, 2, 0.1, v => (+v).toFixed(1))}
    ${range('margin', 'Márgenes', 8, 72, 2, v => v + ' px')}
    ${range('width', 'Ancho máximo de línea', 480, 900, 20, v => v + ' px')}
    <div class="set-group">Opciones</div>
    ${sw('justify', 'Texto justificado')}
    ${sw('hyphens', 'Partir palabras con guion')}
    ${sw('indent', 'Sangría de primera línea')}
    ${sw('notes', 'Mostrar notas al pie')}
    ${'wakeLock' in navigator ? sw('wakeLock', 'Mantener la pantalla encendida') : ''}
    <button class="link-btn" data-reset>Restablecer valores</button>`;
}

/** Conecta el panel: cada cambio se guarda y se pasa a onChange. */
export function bindSettings(root, onChange) {
  const apply = s => { store.saveSettings(s); applyTheme(s); onChange?.(s); };
  root.addEventListener('input', e => {
    const k = e.target.dataset.key; if (!k) return;
    const s = store.settings();
    s[k] = e.target.type === 'checkbox' ? e.target.checked : +e.target.value;
    const out = root.querySelector('#out-' + k);
    if (out) out.textContent = { size: v => v + ' px', margin: v => v + ' px', width: v => v + ' px', lineHeight: v => (+v).toFixed(2), paraGap: v => (+v).toFixed(1) }[k]?.(s[k]) ?? '';
    apply(s);
  });
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-theme-set],[data-font-set],[data-reset]'); if (!t) return;
    let s = store.settings();
    if (t.dataset.themeSet) s.theme = t.dataset.themeSet;
    else if (t.dataset.fontSet) s.font = t.dataset.fontSet;
    else s = { ...DEFAULT_SETTINGS };
    apply(s);
    root.innerHTML = settingsPanel(s);
  });
}

export function applyTheme(s = store.settings()) {
  if (s.theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = s.theme === 'light' ? 'light' : s.theme;
  const head = getComputedStyle(document.documentElement).getPropertyValue('--head').trim();
  document.querySelector('meta[name=theme-color]').content = head || '#2c332f';
}

/** Aplica los ajustes de lectura como variables CSS y clases sobre un contenedor .reader. */
export function styleReader(el, s) {
  el.style.setProperty('--r-size', s.size + 'px');
  el.style.setProperty('--r-lh', s.lineHeight);
  el.style.setProperty('--r-gap', s.paraGap + 'em');
  el.style.setProperty('--r-margin', s.margin + 'px');
  el.style.setProperty('--r-width', s.width + 'px');
  el.style.setProperty('--r-font', FONTS[s.font]?.[1] || FONTS.source[1]);
  el.classList.toggle('justify', s.justify);
  el.classList.toggle('hyphens', s.hyphens);
  el.classList.toggle('indent', s.indent);
  el.classList.toggle('no-notes', !s.notes);
}

function settingsView() {
  setBar('Modo lectura');
  const s = store.settings();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Modo lectura</h1><div class="sub">Los ajustes se guardan en este navegador y se aplican a todos los textos.</div></header>
    <div class="preview"><div class="reader" id="pv">
      <div class="eyebrow">vista previa</div>
      <p class="first" style="margin-top:8px">Así se verá el texto íntegro de cada artículo. Ajusta el tamaño, la fuente y el interlineado hasta que la lectura resulte cómoda durante sesiones largas.</p>
      <p>Los cambios se guardan automáticamente.</p>
      <p class="note">Las notas al pie aparecen así, más pequeñas y con una barra lateral.</p>
    </div></div>
    <div id="set-panel">${settingsPanel(s)}</div>
  </div>`;
  return [html, () => {
    styleReader($('#pv'), s);
    bindSettings($('#set-panel'), ns => styleReader($('#pv'), ns));
  }];
}

function aboutView() {
  setBar('Acerca de');
  const L = lib(), ab = L.about || {};
  const sec = (title, paragraphs, cls = '') => paragraphs?.length
    ? `<section class="card about ${cls}"><h2>${esc(title)}</h2>${paras(paragraphs)}</section>` : '';
  const mag = ab.magazine || {};
  const credits = L.volumes.map(v => `<div class="credit-vol" data-vol="${v.number}">
      <div class="eyebrow vol">Volumen ${v.number}${v.year ? ' · ' + v.year : ''}</div>
      <h3>${esc(v.title)}</h3>
      ${v.editor ? `<p class="muted small">Edición: ${esc(v.editor)}${v.number <= 3 ? ' · publicado con Contracultura' : ''}</p>` : ''}
      <ul>${v.articles.map(a => `<li><a href="#/articulo/${a.id}">${esc(a.author)}</a> — <span class="muted">${esc(a.title)}</span></li>`).join('')}</ul>
    </div>`).join('');
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Lector Marx XXI</div><h1>Acerca de</h1>
      <div class="sub">Guía de lectura de los cinco volúmenes de la revista: textos íntegros y materiales de estudio.</div></header>

    <section class="card about" id="revista">
      <h2>${esc(mag.title || 'Sobre Marx XXI')}</h2>
      ${paras(mag.paragraphs || [])}
      ${mag.source_url ? `<p class="muted small">${esc(mag.source_label || 'Fuente:')} <a href="${esc(mag.source_url)}" rel="noopener" target="_blank">${esc(mag.source_url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
      ${mag.site_url ? `<a class="btn ghost" href="${esc(mag.site_url)}" rel="noopener" target="_blank">Visitar marxxxi.com</a>` : ''}
    </section>

    ${sec(ab.ai?.title || 'Sobre esta guía de lectura', ab.ai?.paragraphs, 'ai')}
    ${sec(ab.license?.title || 'Textos y licencia', ab.license?.paragraphs)}

    <section class="card about" id="creditos">
      <h2>${esc(ab.credits_title || 'Créditos')}</h2>
      <p class="muted small">Autores y artículos de cada volumen, en el orden de la revista.</p>
      ${credits}
    </section>

    <section class="card about">
      <h2>Uso sin conexión</h2>
      ${ab.privacy ? `<p>${esc(ab.privacy)}</p>` : ''}
      <p class="muted small">Puedes instalar la aplicación desde el menú del navegador («Añadir a pantalla de inicio»).</p>
      <button class="btn ghost" id="offline-all">Descargar todos los textos para leer sin conexión</button>
      <p class="muted small" id="offline-msg" style="margin:8px 0 0"></p>
    </section>

    ${ab.design ? `<p class="muted small" style="margin-top:20px">${esc(ab.design)}</p>` : ''}
  </div>`;
}

function notFound() {
  setBar('No encontrado');
  return `<div class="wrap"><p class="empty">No existe esta página. <a href="#/">Volver al inicio</a></p></div>`;
}

// ---------------------------------------------------------------- router

let cleanup = null;

async function route() {
  cleanup?.(); cleanup = null;
  closeSheet();
  document.body.classList.remove('reading', 'chrome-hidden');
  const [path, qs] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(qs || '');
  const parts = (path || '/').split('/').filter(Boolean);
  let out;
  switch (parts[0]) {
    case undefined: out = homeView(); break;
    case 'volumen': case 'tomo': out = volumeView(+parts[1], parts[2] != null ? +parts[2] : 1); break;
    case 'articulo': out = articleView(parts[1], +(parts[2] || 0)); break;
    case 'leer': out = await readerView(parts[1], params); break;
    case 'tesis': out = thesesView(); break;
    case 'glosario': out = glossaryView(params); break;
    case 'buscar': out = searchView(params); break;
    case 'marcadores': out = bookmarksView(); break;
    case 'ajustes': out = settingsView(); break;
    case 'acerca': out = aboutView(); break;
    default: out = notFound();
  }
  const [html, mount] = Array.isArray(out) ? out : [out, null];
  view.innerHTML = html;
  const key = location.hash;
  const saved = scrollMemory.get(key);
  if (parts[0] !== 'leer') window.scrollTo(0, saved || 0);
  cleanup = mount?.() || null;
  if (parts[0] === 'acerca') bindOffline();
}

// Recordar el scroll de cada vista al volver atrás
const scrollMemory = new Map();
let currentKey = location.hash;
window.addEventListener('hashchange', () => {
  scrollMemory.set(currentKey, window.scrollY);
  currentKey = location.hash;
  route();
});

function bindOffline() {
  const b = $('#offline-all'); if (!b) return;
  b.onclick = async () => {
    b.disabled = true;
    const msg = $('#offline-msg');
    const all = lib().allArticles;
    for (let i = 0; i < all.length; i++) {
      await text(all[i].a.text_file).catch(() => null);
      msg.textContent = `Descargando… ${i + 1}/${all.length}`;
    }
    msg.textContent = navigator.serviceWorker?.controller ? 'Listo: todos los textos están disponibles sin conexión.' : 'Textos cargados. El modo sin conexión requiere abrir la app desde https (GitHub Pages).';
    b.disabled = false;
  };
}

// ---------------------------------------------------------------- arranque

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
loadLibrary().then(route).catch(err => {
  view.innerHTML = `<div class="wrap"><p class="empty">No se pudieron cargar los contenidos (${esc(err.message)}). Si has abierto el archivo directamente desde el disco, sírvelo con un servidor local: <code>python -m http.server</code>.</p></div>`;
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

export { route };
