// Marx XXI · lector web. SPA sin dependencias con rutas por hash (compatible con GitHub Pages).
import {
  loadLibrary, lib, dataUrl, pub, volume, article, neighbours, text, esc, highlight, fold,
  searchGuide, searchFullText, KIND, store, FONTS, THEMES, DEFAULT_SETTINGS, HL_COLORS,
  volName, volShort, volHead, volDate, artLabel, byline, isInterview, related, monthName,
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
  guide: '<svg viewBox="0 0 24 24"><path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c3 2.3 8 2.3 11 0V11"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  shelf: '<svg viewBox="0 0 24 24"><path d="M4 4.5v15M8 4.5v15M12.5 5.2l3.8 14.3M3 19.5h18"/></svg>',
  map: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="8.5" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v2.5h11V9M12 11.5V15"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.3c2.3.2 4 1.8 4.5 4.6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};
export { ICON };

// ---------------------------------------------------------------- utilidades de UI

/** Título y botón «atrás». `up` es el nivel superior (no la pantalla anterior del historial). */
export function setBar(title, { back = true, up = '#/' } = {}) {
  $('#appbar-title').textContent = title || '';
  $('#btn-back').hidden = !back;
  $('#btn-back').dataset.up = up;
  document.title = title ? `${title} · Lector de Marx XXI` : 'Lector de Marx XXI';
}
$('#btn-back').addEventListener('click', e => { location.hash = e.currentTarget.dataset.up || '#/'; });

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
new MutationObserver(() => { hydrateDiagrams(); initTabs(); }).observe(document.body, { childList: true, subtree: true });

// ---------------------------------------------------------------- barras de pestañas desplazables
// En pantallas estrechas no caben todas las pestañas: una flecha fija en cada borde («‹» a la izquierda,
// «›» a la derecha, con un degradado sobre la pestaña cortada) indica que hay más por ese lado y, al
// tocarla, desplaza la barra.
// Al abrir la página, la pestaña actual se lleva a la vista.
function updateTabs(nav) {
  nav.classList.toggle('more-right', nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 4);
  nav.classList.toggle('more-left', nav.scrollLeft > 4);
}
function initTabs(root = document) {
  for (const nav of root.querySelectorAll('nav.tabs:not([data-tabs-ready])')) {
    nav.dataset.tabsReady = '';
    const arrow = (cls, text, dir) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = cls;
      btn.setAttribute('aria-label', 'Ver más pestañas');
      btn.tabIndex = -1;
      btn.textContent = text;
      btn.onclick = e => { e.preventDefault(); nav.scrollBy({ left: dir * nav.clientWidth * 0.7, behavior: 'smooth' }); };
      return btn;
    };
    nav.prepend(arrow('tabs-less', '‹', -1));
    nav.append(arrow('tabs-more', '›', 1));
    nav.addEventListener('scroll', () => updateTabs(nav), { passive: true });
    const cur = nav.querySelector('[aria-current="page"]');
    if (cur && cur.offsetLeft + cur.offsetWidth > nav.clientWidth - 40) nav.scrollLeft = cur.offsetLeft - 24;
    updateTabs(nav);
  }
}
addEventListener('resize', () => document.querySelectorAll('nav.tabs').forEach(updateTabs));
document.fonts?.ready.then(() => document.querySelectorAll('nav.tabs').forEach(updateTabs));

let zoomScale = 1;
// Esquemas que se recorren con ‹ › y las flechas del teclado: los visibles de la pantalla (o de la hoja) de partida
let zoomList = [], zoomIdx = -1;
function zoomStep(d) {
  if (zoomList.length < 2) return;
  zoomIdx = (zoomIdx + d + zoomList.length) % zoomList.length;
  openZoom(zoomList[zoomIdx], true);
}
function openZoom(host, keepList = false) {
  const st = $('#zoom-stage');
  const dlg = $('#zoom');
  if (!keepList) {
    const root = host.closest('#sheet-body') || view;
    zoomList = [...root.querySelectorAll('[data-zoom]')].filter(b => b.offsetParent !== null && !b.closest('details:not([open])') && b.querySelector('.dg[data-state="ok"]'));
    zoomIdx = zoomList.indexOf(host);
  }
  $('#zoom-pos').textContent = zoomList.length > 1 ? `${zoomIdx + 1} / ${zoomList.length}` : '';
  for (const b of dlg.querySelectorAll('[data-zstep]')) b.hidden = zoomList.length < 2;
  const vol = host.closest('[data-vol]')?.dataset.vol || document.body.dataset.vol;
  if (vol) dlg.dataset.vol = vol; else delete dlg.dataset.vol;
  st.innerHTML = `<div class="dg">${host.querySelector('.dg')?.innerHTML || ''}</div>`;
  $('#zoom-caption').textContent = host.dataset.caption || '';
  const box = st.firstChild;
  const fit = () => Math.min(st.clientWidth - 24, 1400);
  // En pantallas estrechas «ajustar» deja el texto del esquema en ~5 px: se abre a un tamaño legible
  // (el ancho propio del viewBox, donde el texto mide 12-15 px) y se recorre desplazando.
  const readable = () => {
    const vbW = box.querySelector('svg')?.viewBox?.baseVal?.width || 760;
    return Math.max(1, (vbW * 1.1) / fit());
  };
  // Cambia la escala manteniendo fijo el punto (cx, cy) del visor (centro por defecto)
  const apply = (next = zoomScale, cx = st.clientWidth / 2, cy = st.clientHeight / 2) => {
    next = Math.min(6, Math.max(0.5, next));
    const k = next / zoomScale;
    const sx = (st.scrollLeft + cx) * k - cx, sy = (st.scrollTop + cy) * k - cy;
    zoomScale = next;
    box.style.width = Math.round(fit() * zoomScale) + 'px';
    st.scrollLeft = sx; st.scrollTop = sy;
    $('#zoom-level').textContent = Math.round(zoomScale * 100) + ' %';
  };
  dlg.onclick = e => {
    const sb = e.target.closest('[data-zstep]');
    if (sb) return zoomStep(+sb.dataset.zstep);
    const b = e.target.closest('[data-z]');
    if (!b) return;
    const z = b.dataset.z;
    if (z === '0') apply(zoomScale > 1.01 ? 1 : readable());
    else apply(zoomScale * (z === '+' ? 1.4 : 1 / 1.4));
  };
  box.ondblclick = e => {
    const r = st.getBoundingClientRect();
    apply(zoomScale > readable() + 0.01 || zoomScale < 0.99 ? readable() : zoomScale * 1.8, e.clientX - r.left, e.clientY - r.top);
  };
  // Pellizcar con dos dedos para ampliar o reducir dentro del visor
  const pts = new Map();
  let pinch = null;
  st.onpointerdown = e => { if (e.pointerType === 'touch') pts.set(e.pointerId, e); };
  st.onpointermove = e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);
    if (pts.size !== 2) return;
    const [a, b] = [...pts.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const r = st.getBoundingClientRect();
    const cx = (a.clientX + b.clientX) / 2 - r.left, cy = (a.clientY + b.clientY) / 2 - r.top;
    if (!pinch) pinch = { d, s: zoomScale };
    else apply(pinch.s * d / pinch.d, cx, cy);
  };
  st.onpointerup = st.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
  if (!dlg.open) dlg.showModal();
  zoomScale = 1;
  st.scrollLeft = st.scrollTop = 0;
  apply(readable(), 0, 0);
}
document.addEventListener('keydown', e => {
  if (!$('#zoom').open || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  zoomStep(e.key === 'ArrowRight' ? 1 : -1);
});
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

// ---------------------------------------------------------------- menú lateral
// Todas las secciones de la app, con desplegables por volumen y por lista de artículos.
/** Volumen o número de la pantalla actual (para resaltarlo en el menú). */
function currentVolKey(here) {
  let m = here.match(/^#\/(?:volumen|tomo)\/(\d+)|^#\/leer\/tomo-(\d+)/);
  if (m) return String(m[1] || m[2]);
  if ((m = here.match(/^#\/numero\/(\d+)/))) return 'n' + m[1];
  if ((m = here.match(/^#\/(?:articulo|leer)\/([a-z0-9-]+)/))) return article(m[1])?.v.key || '';
  return '';
}

function menuHtml() {
  const L = lib();
  const here = location.hash || '#/';
  const curVol = currentVolKey(here);
  const curArt = (here.match(/^#\/(?:articulo|leer)\/([tn]\d+-a\d+)/) || [])[1];
  const on = href => (here === href || here.split('?')[0] === href) ? ' aria-current="page"' : '';
  const link = (href, label, icon = '') => `<a class="m-link" href="${href}"${on(href)}>${icon}<span>${label}</span></a>`;
  const lastId = store.last();
  const last = lastId && !lastId.startsWith('tomo-') ? article(lastId) : null;
  const vols = p => p.volumes.map(v => {
    const sub = [
      v.presentation_text || v.presentation?.length ? link(`${v.href}/0`, 'Presentación') : '',
      `<details class="m-arts">
         <summary><span>Artículos</span><span class="m-count">${v.articles.length}</span></summary>
         ${v.articles.map(a => `<div class="m-art${a.id === curArt ? ' on' : ''}">
           <a class="m-art-title" href="#/articulo/${a.id}/${TAB.pildoras}"><b>${isInterview(a) ? 'Entrevista.' : a.number + '.'}</b> ${esc(a.title)}<small>${esc(byline(a))}</small></a>
           <a class="m-art-read" href="#/leer/${a.id}" aria-label="Texto completo de ${esc(a.title)}" title="Texto completo">${ICON.book}</a>
         </div>`).join('')}
       </details>`,
      link(`${v.href}/2`, 'Conclusiones'),
      link(`${v.href}/3`, 'Mapa conceptual'),
      link(`${v.href}/4`, 'Relaciones'),
    ].join('');
    // Nuevo Ciclo: «Nuevo Ciclo #001» y la fecha debajo; Marx XXI: «Volumen 1» encima del título
    const label = v.label ? `${esc(v.title)}<small>${esc(monthName(v.month))}</small>` : `<small>${esc(volName(v))}</small>${esc(v.title)}`;
    return `<details class="m-vol${v.key === curVol ? ' here' : ''}" data-vol="${v.key}">
      <summary data-href="${v.href}"${on(v.href)}><i class="m-dot"></i><span>${label}</span></summary>
      <div class="m-sub">${sub}</div>
    </details>`;
  }).join('');
  // Secciones plegables (cada revista, Estudio, Aplicación): solo empieza desplegada la que contiene la
  // pantalla actual; fuera de ellas (p. ej. en la biblioteca) todas empiezan plegadas.
  const path = here.split('?')[0];
  const curPub = curVol ? (curVol.startsWith('n') ? 'nuevo-ciclo' : 'marx-xxi')
    : (path.match(/^#\/(marx-xxi|nuevo-ciclo)\b/) || [])[1]
      || (/^#\/tesis(\/|$)/.test(path) ? (/^[a-z]/.test(path.split('/')[2] || '') ? path.split('/')[2] : 'marx-xxi') : '');
  const openIf = cond => cond ? ' open' : '';
  const inSection = routes => routes.some(r => path === r || path.startsWith(r + '/'));
  const pubs = L.pubs.map(p => `<details class="m-pub"${openIf(p.id === curPub)}>
    <summary class="m-group">${esc(p.name)}</summary>
    ${link(p.home, `${esc(p.name)}: La publicación`, ICON.shelf)}
    ${vols(p)}
    ${link(thesesHref(p), 'Síntesis', ICON.hub)}
  </details>`).join('');
  return `
    ${link('#/', 'Biblioteca', ICON.home)}
    ${last ? link(`#/leer/${last.a.id}`, `Seguir leyendo<small>${esc(last.a.title)}</small>`, ICON.book) : ''}
    ${pubs}
    <details class="m-pub"${openIf(inSection(['#/sintesis', '#/glosario', '#/mapas', '#/autores', '#/buscar', '#/marcadores']))}><summary class="m-group">Estudio</summary>
    ${L.synthesis ? link('#/sintesis', 'Síntesis de la colección', ICON.hub) : ''}
    ${link('#/glosario', 'Glosario', ICON.az)}
    ${link('#/mapas', 'Mapas conceptuales', ICON.map)}
    ${link('#/autores', 'Autores', ICON.people)}
    ${link('#/buscar', 'Búsqueda', ICON.search)}
    ${link('#/marcadores', 'Marcadores', ICON.mark)}
    </details>
    <details class="m-pub"${openIf(inSection(['#/ajustes', '#/acerca']))}><summary class="m-group">Aplicación</summary>
    ${link('#/ajustes', 'Modo lectura', ICON.aa)}
    ${link('#/acerca', 'Acerca de y créditos', ICON.info)}
    </details>`;
}

export function openMenu() {
  const d = $('#menu');
  $('#menu-body').innerHTML = menuHtml();
  d.showModal(); // siempre con los volúmenes plegados
  $('#menu-body').scrollTop = 0;
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-open-menu]')) { e.preventDefault(); openMenu(); return; }
  // cualquier enlace del menú lo cierra (aunque lleve a la pantalla actual)
  const a = e.target.closest('#menu a[href]');
  if (a) $('#menu').close();
});
$('#menu').addEventListener('click', e => { if (e.target.id === 'menu') e.currentTarget.close(); });
// Títulos de volumen/número: un toque lleva a su página; la flecha de la derecha (último tramo del título)
// pliega y despliega sus apartados.
$('#menu').addEventListener('click', e => {
  const sum = e.target.closest('#menu summary[data-href]');
  if (!sum) return;
  if (e.clientX > sum.getBoundingClientRect().right - 48) return; // flecha
  e.preventDefault();
  $('#menu').close();
  location.hash = sum.dataset.href;
});

const minutes = w => Math.max(1, Math.round(w / 230));
const pct = p => Math.round((p || 0) * 100);
const paras = list => list.map(p => `<p>${esc(p)}</p>`).join('');
/** Pestañas; `primary` marca la principal (Artículos en el volumen, Texto completo en el artículo). */
function tabs(base, names, current, primary = -1) {
  return `<nav class="tabs" aria-label="Secciones">${names.map((n, i) => n == null ? '' : // null: pestaña que no aplica
    `<a href="${base}/${i}"${i === primary ? ' class="primary"' : ''}${i === current ? ' aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>`;
}

const NUM_WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
const numWord = n => NUM_WORDS[n] || String(n);

/** Portada dibujada (reserva si falta la imagen): triángulos sobre negro (Marx XXI) o isotipo (Nuevo Ciclo). */
function coverMotif(v) {
  if (v.label) return `<i><span class="nc-name">Nuevo Ciclo</span><span class="nc-num">${esc(v.label)}</span><img src="img/nuevo-ciclo.png" alt=""></i>`;
  return `<i><b>marx xxi · ${v.number}</b></i>`;
}
/** Portada de un volumen o número: la imagen de img/ (v.cover) o, si no existe, la portada dibujada. */
function coverHtml(v, read = false) {
  const badge = read ? '<span class="badge">Leído</span>' : '';
  const nc = v.label ? ' nc' : '';
  if (!v.cover) return `<div class="cover${nc}">${coverMotif(v)}${badge}</div>`;
  return `<div class="cover photo${nc}" data-motif="${esc(coverMotif(v))}"><img src="${esc(v.cover)}" alt="Portada de ${esc(volName(v))}" loading="lazy" decoding="async">${badge}</div>`;
}
// Si una portada no carga (p. ej. un número nuevo aún sin imagen), se sustituye por la portada dibujada
document.addEventListener('error', e => {
  const img = e.target, box = img.parentElement;
  if (img.tagName !== 'IMG' || !box?.classList.contains('photo')) return;
  box.classList.remove('photo');
  img.outerHTML = box.dataset.motif;
}, true);

/** Tarjeta de volumen o número, con progreso de lectura. */
function volCard(v, read, pos) {
  const done = v.articles.filter(a => read.has(a.id)).length;
  const avg = v.articles.reduce((s, a) => s + (pos[a.id]?.progress || 0), 0) / v.articles.length;
  const n = v.articles.length;
  const what = n === 1 ? 'artículo' : 'artículos';
  return `<a class="card vol-card" href="${v.href}" data-vol="${v.key}">
    ${coverHtml(v, done === n)}
    <div class="vc-body">
      <div class="eyebrow">${v.label ? `${esc(v.label)} · ${esc(monthName(v.month))}` : `Volumen ${v.number}${v.year ? ' · ' + v.year : ''}`}</div>
      <h3>${esc(v.label ? v.subtitle || v.title : v.title)}</h3>
      <div class="meta"><span>${n} ${what}</span>${done ? `<span class="check">✓ ${done} leídos</span>` : ''}</div>
      ${avg > 0 ? `<div class="progress"><i style="width:${pct(avg)}%"></i></div>` : ''}
    </div>
  </a>`;
}

/** Tarjeta «Seguir leyendo» del último texto abierto. */
function continueCard() {
  const lastId = store.last(), last = lastId && (lastId.startsWith('tomo-') ? null : article(lastId));
  if (!last) return '';
  const p = store.positions()[last.a.id]?.progress;
  return `<a class="card" href="#/leer/${last.a.id}" style="margin-top:18px" data-vol="${last.v.key}">
      <div class="eyebrow vol">Seguir leyendo · ${esc(volName(last.v))}</div>
      <h3>${esc(last.a.title)}</h3><div class="muted small">${esc(byline(last.a))}</div>
      <div class="progress blue"><i style="width:${pct(p)}%"></i></div>
      <div class="muted small" style="margin-top:4px">${pct(p)} % leído</div>
    </a>`;
}

const toolCard = (href, icon, title, sub) => `<a class="card tool" href="${href}">${ICON[icon]}<div><strong>${title}</strong><span>${sub}</span></div></a>`;

/** Herramientas de estudio: aviso «Acerca de» y las seis tarjetas. Con `p`, glosario y autores
 *  se cuentan solo en esa publicación y los mapas abren su sección. */
function studyTools(p) {
  const L = lib();
  const gl = p ? L.glossary.filter(e => e.pub === p) : L.glossary;
  const au = p ? L.authors.filter(x => x.items.some(i => i.v.pub.id === p.id)) : L.authors;
  return `<h2 class="sec-title">Herramientas de estudio</h2>
    <div class="grid two">
      <div class="about-banner">
        ${toolCard('#/acerca', 'info', 'Acerca de', 'Las revistas, créditos y licencia')}
        <p>Esta aplicación sirve para leer y subrayar las revistas cómodamente desde dispositivos digitales. Los resúmenes y esquemas
        que acompañan cada texto se han elaborado con Claude Fable 5.1, de Anthropic, uno de los modelos de IA más avanzados,
        como apoyo al estudio. Aun así, son resúmenes hechos con IA: no sustituyen a los textos íntegros, y podrían no
        reflejarlos con exactitud.</p>
      </div>
      ${toolCard(p ? `#/mapas?p=${p.id}` : '#/mapas', 'map', 'Mapas conceptuales', 'De la biblioteca, cada revista, volumen, número y artículo')}
      ${toolCard(p ? `#/glosario?p=${p.id}` : '#/glosario', 'az', 'Glosario', `${gl.length} conceptos`)}
      ${toolCard('#/autores', 'people', 'Autores', p ? `${au.length} firmas en ${esc(p.name)}` : `${au.length} firmas en ${L.pubs.length > 1 ? 'las dos revistas' : 'la revista'}`)}
      ${toolCard('#/buscar', 'search', 'Búsqueda', 'Guía y textos íntegros')}
      ${toolCard('#/marcadores', 'mark', 'Marcadores', 'Subrayados y notas propias')}
      ${toolCard('#/ajustes', 'aa', 'Modo lectura', 'Fuente, tamaño, interlineado')}
    </div>`;
}

function siteFoot(colophon) {
  const L = lib();
  return `<footer class="site-foot">
      ${colophon ? `<span>${esc(colophon)}</span>` : ''}
      <span>Revista: <a href="https://marxxxi.com/" rel="noopener" target="_blank">marxxxi.com</a> · <a href="#/acerca">Acerca de este lector y créditos</a></span>
      <span>${esc(L.about?.ai_short || 'Guía elaborada con Claude (IA).')}</span>
    </footer>`;
}

// ---------------------------------------------------------------- vistas

/** Inicio: la biblioteca con sus publicaciones. */
function libraryView() {
  setBar('', { back: false });
  const L = lib(), S = L.synthesis;
  const span = p => {
    const vs = p.volumes, a = vs[0], b = vs[vs.length - 1];
    const mm = ym => ym.split('-').reverse().join('/'); // "2025-09" → "09/2025"
    if (a.month) return `${mm(a.month)} – ${mm(b.month)}`;
    return `${a.year}–${b.year}`;
  };
  const pubCard = p => {
    const last = p.volumes[p.volumes.length - 1];
    const n = p.volumes.reduce((s, v) => s + v.articles.length, 0);
    return `<a class="card pub-card" href="${p.home}" data-vol="${last.key}" data-pub="${p.id}">
      ${last.cover ? coverHtml(last) : `<div class="pub-covers">${p.volumes.map(v => `<span data-vol="${v.key}">${coverHtml(v)}</span>`).join('')}</div>`}
      <div class="vc-body">
        <div class="eyebrow">${esc(p.kind)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="meta"><span>${numWord(p.volumes.length)} ${esc(p.unit_plural)}</span><span>${n} artículos</span><span>${esc(span(p))}</span></div>
        ${p.description ? `<p class="pub-desc">${esc(p.description)}</p>` : ''}
        <p class="small muted pub-last">Último: ${esc(volName(last))}${last.label ? '' : ' · ' + esc(last.title)}</p>
      </div>
    </a>`;
  };
  return `<div class="wrap">
    <section class="hero">
      <div class="eyebrow">Biblioteca</div>
      <h1>${L.pubs.length > 1 ? 'Colección Marx XXI' : esc(L.pubs[0].name)}</h1>
      <p class="lede">${L.pubs.length > 1
        ? 'Dos revistas de un mismo proyecto socialista. Marx XXI es la de fondo: cada volumen fija a conciencia una pieza de la estrategia. Nuevo Ciclo es la de coyuntura: cada trimestre pone ese marco a prueba frente a lo que está ocurriendo. Textos íntegros, guías de estudio y los enlaces entre ambas.'
        : esc(L.pubs[0].cross_volume.lede || '')}</p>
    </section>
    ${continueCard()}
    <h2 class="sec-title">Publicaciones</h2>
    <div class="grid pubs">${L.pubs.map(pubCard).join('')}</div>
    ${studyTools()}
    ${S ? `<h2 class="sec-title">Síntesis de la colección</h2>
      <div class="prose synth-intro"><p>Marx XXI y Nuevo Ciclo son dos caras de un mismo proyecto: los volúmenes fijan el marco
        (qué es el marxismo, por qué no la socialdemocracia, el partido, el derecho a la revolución, la escala internacional)
        y los números lo ponen a prueba en la coyuntura. La síntesis reúne las dos revistas en <b>${S.theses.length} tesis comunes</b>,
        cada una con su principio en Marx XXI y su aplicación en Nuevo Ciclo, y las alinea con las tesis propias de cada revista.
        Recoge además los ${S.bridge_concepts?.length || 0} conceptos que hacen de puente entre ambas y lo que aporta cada una en exclusiva.</p></div>
      <a class="card tool synth-link" href="#/sintesis">${ICON.hub}<strong>Leer la síntesis de la colección</strong></a>
      ${S.map ? figure(S.map) : ''}` : ''}
    ${siteFoot()}
  </div>`;
}

/** Portada de una publicación: arco, volúmenes o números, herramientas y mapa común. */
function collectionView(p) {
  if (!p) return notFound();
  const mx = p.id === 'marx-xxi';
  setBar(p.name, { up: '#/' });
  const L = lib(), cv = p.cross_volume;
  const read = store.read(), pos = store.positions();
  const n = p.volumes.length;
  const tesis = thesesHref(p);
  return `<div class="wrap" data-pub="${p.id}">
    <section class="hero">
      <div class="eyebrow">${mx ? 'Publicación temática anual de teoría socialista' : `${esc(p.kind)} · ${esc(p.publisher || '')}`}</div>
      <h1>${esc(p.name)}</h1>
      ${cv.intro?.length
        ? `<div class="lede sm"><p>${esc(cv.intro[0])}</p>${cv.lede ? `<p>${esc(cv.lede)}</p>` : ''}</div>`
        : cv.lede ? `<p class="lede">${esc(cv.lede)}</p>` : ''}
    </section>
    ${mx ? continueCard() : ''}
    <h2 class="sec-title">Los ${numWord(n)} ${esc(p.unit_plural)}</h2>
    <div class="grid vols">${p.volumes.map(v => volCard(v, read, pos)).join('')}</div>
    ${cv.arc ? `<h2 class="sec-title">Trayectoria de la publicación</h2>${figure(cv.arc)}` : ''}
    ${studyTools(p)}
    <h2 class="sec-title">Síntesis de la publicación: ${esc(p.name)}</h2>
    <div class="prose synth-intro"><p>Reúne en <b>${cv.theses.length} tesis transversales</b> lo que los ${numWord(n)} ${esc(p.unit_plural)}
      de ${esc(p.name)} sostienen en común: ninguna la defiende un solo autor, y cada ${esc(p.unit.toLowerCase())} las reformula
      desde su propio problema. Cada tesis se despliega para leerla entera, y el mapa conceptual común las ordena de un vistazo.</p></div>
    <a class="card tool synth-link" href="${tesis}">${ICON.hub}<strong>Leer la síntesis de ${esc(p.name)}</strong></a>
    ${cv.map ? figure(cv.map) : ''}
    ${siteFoot(cv.colophon)}
  </div>`;
}

const VOL_TABS = ['Presentación', 'Artículos', 'Conclusiones', 'Mapa', 'Relaciones'];
/** Primera letra en mayúscula (solo al mostrar; los datos no se tocan). */
const upperFirst = s => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

function volumeView(p, n, tab = 1) {
  const v = p && volume(n, p.id);
  if (!v) return notFound();
  const hasPres = !!(v.presentation?.length || v.presentation_text);
  if (!hasPres && tab === 0) tab = 1;
  setBar(v.label ? v.title : `Volumen ${v.number} · ${v.title}`, { up: p.home });
  const pos = store.positions(), read = store.read();
  let body = '';
  if (tab === 0) {
    body = `<div class="eyebrow">Tesis del volumen según la presentación</div><div class="prose" style="margin-top:10px">${paras(v.presentation)}</div>
      ${v.presentation_text ? `<a class="btn ghost block" href="#/leer/tomo-${v.number}">${ICON.book}${v.number === 5 ? 'Leer la nota introductoria completa' : 'Leer la presentación completa'}</a>` : ''}`;
  } else if (tab === 1) {
    body = `<p class="muted small">Índice en el orden de la revista. Abre la guía de cada artículo o ve directamente al texto íntegro.</p>` +
      v.articles.map(a => {
        const p = pos[a.id]?.progress || 0;
        return `<div class="card art-card">
          <div class="art-main">
            <div class="row-actions"><span class="eyebrow vol">${artLabel(a)}</span><span class="muted" style="font-size:15px">≈ ${minutes(a.word_count)} min</span><span class="grow"></span>${read.has(a.id) ? '<span class="check">✓ leído</span>' : ''}</div>
            <h3><a href="#/articulo/${a.id}" style="color:inherit;text-decoration:none">${esc(a.title)}</a></h3>
            <div class="muted small">${esc(byline(a))}</div>
            <div class="art-sum">
              ${a.summary[0] ? `<p class="small">${esc(a.summary[0])}</p>` : ''}
              ${p > 0 ? `<div class="progress" title="${pct(p)} % leído"><i style="width:${pct(p)}%"></i></div>` : ''}
            </div>
          </div>
          <div class="art-actions" role="group" aria-label="Abrir ${esc(a.title)}">
            <a class="btn stack" href="#/leer/${a.id}">${ICON.book}<span>Texto<br>completo</span></a>
            <a class="btn ghost stack" href="#/articulo/${a.id}/${TAB.pildoras}">${ICON.guide}<span>Guía de<br>estudio</span></a>
          </div>
        </div>`;
      }).join('');
  } else if (tab === 2) {
    // conclusiones plegables, como las tesis de la síntesis: a la vista el número y el enunciado
    body = v.conclusions.map((c, i) => `<details class="card thesis" id="conclusion-${i + 1}">
      <summary><div class="eyebrow vol">Conclusión ${i + 1}</div><h3>${esc(c.title)}</h3></summary>
      <div class="thesis-body"><p style="margin:0">${esc(c.text)}</p></div></details>`).join('');
  } else if (tab === 3) {
    body = figure(v.concept_map) + '<p class="muted small">Toca el mapa para ampliarlo.</p>';
  } else {
    body = v.relations.map(r => {
      const nums = [...r.pair.matchAll(/Art\.\s*(\d+)/g)].map(m => +m[1]);
      return `<div class="card"><div class="eyebrow vol">${esc(r.pair)}</div>${r.concept ? `<h3>${esc(upperFirst(r.concept))}</h3>` : ''}<p style="margin:0">${esc(r.text)}</p>
        <div class="chips">${nums.map(n => v.articles.find(a => a.number === n)).filter(Boolean).map(a =>
          `<a class="chip" href="#/articulo/${a.id}">${artLabel(a)} · ${esc(byline(a).split(/ y | e |,/)[0])}</a>`).join('')}</div></div>`;
    }).join('');
  }
  const prev = volume(n - 1, p.id), next = volume(n + 1, p.id);
  return `<div class="wrap" data-vol="${v.key}">
    <header class="page-head with-aside vol-head"><div class="ph-main">
      <a class="eyebrow ph-pub" href="${p.home}">${esc(p.name)}</a>
      <div class="eyebrow vol">${esc(v.eyebrow.replace(/^[^·]*·\s*/, ''))}</div><h1>${esc(v.title)}</h1>
      ${v.subtitle ? `<div class="sub">${esc(v.subtitle)}</div>` : ''}
      ${v.editor ? `<div class="muted small" style="margin-top:6px">Edición: ${esc(v.editor)}${v.issn ? ` · ISSN ${esc(v.issn)}` : ''}${v.deposito_legal ? ` · D. L. ${esc(v.deposito_legal)}` : ''}</div>` : ''}
      ${v.data_notes ? `<details class="vol-notes"><summary>Ficha del número</summary><p>${esc(v.data_notes)}</p></details>` : ''}</div>
      ${v.cover ? `<div class="ph-cover">${coverHtml(v)}</div>` : ''}
      ${headNav(
        // antes del primero, la portada de la revista («Intro»); después del último, sus conclusiones comunes
        prev ? { href: `${prev.href}/${tab}`, label: volShort(prev), tip: volHead(prev), vol: prev.key }
          : { href: p.home, label: 'Intro', tip: `Portada de ${p.name}`, vol: v.key },
        next ? { href: `${next.href}/${tab}`, label: volShort(next), tip: volHead(next), vol: next.key }
          : { href: thesesHref(p), label: 'Concl.', tip: `${p.name}: Síntesis`, vol: v.key },
        v.label ? 'Números contiguos' : 'Volúmenes contiguos')}</header>
    ${tabs(v.href, hasPres ? VOL_TABS : [null, ...VOL_TABS.slice(1)], tab, 1)}
    ${body}
    <nav class="neighbours" aria-label="${v.label ? 'Números contiguos' : 'Volúmenes contiguos'}">
      ${prev ? volNeighbourLink(prev, 'prev', tab) : '<span></span>'}
      ${next ? volNeighbourLink(next, 'next', tab) : '<span></span>'}
    </nav>
  </div>`;
}

/** Paso compacto al anterior / siguiente junto al título (volumen, número o artículo).
 *  prev y next: { href, label, title?, tip?, vol } o null. Sin `title`, solo la etiqueta («Vol. 1»). */
function headNav(prev, next, aria) {
  const one = (x, dir) => x
    ? `<a class="hn-${dir}${x.title ? '' : ' hn-short'}" href="${x.href}" data-vol="${x.vol}" title="${esc(x.tip || x.title)}">
        <span class="hn-arrow" aria-hidden="true">${dir === 'prev' ? '‹' : '›'}</span>
        <span class="hn-text">${x.title ? `<small>${esc(x.label)}</small><span>${esc(x.title)}</span>` : `<b>${esc(x.label)}</b>`}</span></a>`
    : `<span class="hn-${dir} hn-off" aria-hidden="true"><span class="hn-arrow">${dir === 'prev' ? '‹' : '›'}</span></span>`;
  return `<nav class="ph-nav" aria-label="${esc(aria)}">${one(prev, 'prev')}${one(next, 'next')}</nav>`;
}

/** Enlace al volumen o número anterior/siguiente: número, título y nº de artículos. */
function volNeighbourLink(v, dir, tab) {
  return `<a class="${dir}" href="${v.href}${tab != null ? '/' + tab : ''}" data-vol="${v.key}">
    <small>${dir === 'next' ? 'Siguiente →' : '← Anterior'}</small>
    <span class="nb-vol">${v.label ? `${esc(v.label)} · ${esc(monthName(v.month))}` : `Volumen ${v.number}${v.year ? ' · ' + v.year : ''}`}</span>
    <span class="nb-title">${esc(v.label ? v.subtitle || v.title : v.title)}</span>
    <span class="nb-author">${v.articles.length} artículos</span>
  </a>`;
}

export const ART_TABS = ['Píldoras', 'Texto completo', 'Resumen', 'Esquema', 'Conceptos', 'Cita y conclusión'];
/** Índice de cada pestaña del artículo (las rutas #/articulo/<id>/<n> usan estos números). */
export const TAB = { pildoras: 0, texto: 1, resumen: 2, esquema: 3, conceptos: 4, cita: 5 };

/** Contenido de las pestañas de guía (también se usa en la hoja «Guía» del lector). */
/** Aviso breve de que la guía está elaborada con IA (Claude), con enlace a los créditos. */
export function aiNote() {
  const t = lib().about?.ai_short || 'Guía elaborada con Claude (IA).';
  return `<p class="ai-note">${ICON.info}<span>${esc(t)} <a href="#/acerca">Más información</a></span></p>`;
}

export function guideTab(a, tab) {
  return guideTabBody(a, tab) + (tab >= 0 && tab < ART_TABS.length && tab !== TAB.texto ? aiNote() : '');
}

function guideTabBody(a, tab) {
  switch (tab) {
    case TAB.resumen: return `<div class="prose">${paras(a.summary)}</div>
      ${a.references ? `<div class="card" style="margin-top:16px"><div class="eyebrow">Interlocutores y referencias</div><p style="margin:6px 0 0">${esc(a.references)}</p></div>` : ''}`;
    case TAB.pildoras: return `<ol class="steps">${a.argument.map(s => `<li><h3>${esc(s.title)}</h3><div>${esc(s.text)}</div></li>`).join('')}</ol>`;
    case TAB.esquema: return a.diagrams.length ? a.diagrams.map(figure).join('') + '<p class="muted small">Toca el esquema para ampliarlo.</p>' : '<p class="empty">Este artículo no tiene esquema.</p>';
    case TAB.conceptos: return `<dl class="concepts">${a.concepts.map(c => `<dt>${esc(c.term)}</dt><dd>${esc(c.definition)}</dd>`).join('')}</dl>`;
    case TAB.cita: return `${a.quote ? `<blockquote class="quote">${esc(a.quote.text)}<footer>— ${esc(a.quote.source)}</footer></blockquote>` : ''}
      <h2 style="font-size:22px;margin-bottom:10px">Conclusión</h2><div class="prose">${paras(a.conclusion)}</div>`;
    default: return '';
  }
}

const REF_KIND = { cita: 'Cita', tema: 'Mismo tema', autor: 'Mismo autor' };

/** Panel «Relacionado»: textos que este cita o trata (en la otra revista o en otro número) y los que lo citan. */
function relatedPanel(a) {
  const refs = related(a.id);
  if (!refs.length) return '';
  const item = r => {
    const { v, a: o } = r.other;
    const otherPub = v.pub !== article(a.id).v.pub;
    return `<a class="list-item rel-item" href="#/articulo/${o.id}" data-vol="${v.key}">
      <span class="tag ${r.kind === 'cita' ? '' : r.kind === 'tema' ? 'soft' : 'olive'}">${esc(REF_KIND[r.kind] || r.kind)}</span>
      <span class="muted sc" style="font-size:14.5px">${esc(otherPub ? (v.label ? volName(v) : `${v.pub.name} · ${volName(v)}`) : volShort(v))} · ${esc(artLabel(o))}</span>
      <h3>${esc(o.title)}</h3><div class="muted small">${esc(byline(o))}</div>
      ${r.why ? `<p>${esc(r.why)}</p>` : ''}
    </a>`;
  };
  const out = refs.filter(r => r.dir === 'out'), inn = refs.filter(r => r.dir === 'in');
  return `<section class="related" aria-labelledby="rel-h">
    <h2 id="rel-h" class="rel-title">${ICON.link}Relacionado</h2>
    ${out.length ? out.map(item).join('') : ''}
    ${inn.length ? `<div class="eyebrow" style="margin-top:14px">Artículos que remiten a este</div>${inn.map(item).join('')}` : ''}
  </section>`;
}

function articleView(id, tab = 0) {
  const hit = article(id);
  if (!hit) return notFound();
  const { v, a } = hit;
  setBar(`${volShort(v).replace(/^Vol\./, 'Volumen')} · ${artLabel(a)}`, { up: v.href });
  const p = store.position(a.id)?.progress || 0;
  const { prev, next } = neighbours(a.id);
  let body;
  if (tab === TAB.texto) {
    body = `<div class="card">
      <div class="eyebrow">Texto íntegro del artículo</div>
      <p style="margin:8px 0 2px">≈ ${a.word_count.toLocaleString('es')} palabras · ${minutes(a.word_count)} min de lectura</p>
      <div class="muted small">${esc(volName(v))}${v.label ? '' : ' · ' + esc(v.title)}${a.pdf_pages ? ` — Páginas ${a.pdf_pages.from}–${a.pdf_pages.to}` : ''}</div>
      ${v.url ? `<div class="muted small"><a href="${esc(v.url)}" target="_blank" rel="noopener">PDF disponible en marxxxi.com</a></div>` : ''}
      ${a.printed_pages && v.label ? `<div class="muted small">En la revista impresa: páginas ${a.printed_pages.from}–${a.printed_pages.to}</div>` : ''}
      <div style="display:grid;gap:8px;margin-top:16px">
        <a class="btn block" href="#/leer/${a.id}">${ICON.book}${p > 0 ? `Seguir leyendo (${pct(p)} %)` : 'Abrir en modo lectura'}</a>
        ${p > 0 ? `<a class="btn ghost block" href="#/leer/${a.id}?b=0">Empezar desde el principio</a>` : ''}
      </div>
      <p class="muted small" style="margin:14px 0 0">En el modo lectura puedes cambiar la fuente, el tamaño, el interlineado, los márgenes y el tema, guardar marcadores, buscar en el texto y consultar la guía sin perder la posición.</p>
    </div>`;
  } else body = guideTab(a, tab);
  return `<div class="wrap has-fab" data-vol="${v.key}">
    <header class="page-head with-aside vol-head art-band"><div class="ph-main">
      <a class="eyebrow ph-pub" href="${v.pub.home}">${esc(v.pub.name)}</a>
      <a class="eyebrow vol" href="${v.href}" style="text-decoration:none">${esc(volHead(v).replace(v.pub.name + ' ', ''))}</a>
      <div class="eyebrow vol ph-art">${isInterview(a) ? 'Entrevista' : `Artículo ${a.number}`}</div>
      <h1>${esc(a.title)}</h1><div class="by">${esc(byline(a))}</div>
      ${a.interviewee ? `<div class="muted small">${esc(a.author)}</div>` : ''}</div>
      ${(() => {
        // paso dentro del volumen o número: antes del primero y después del último, el propio volumen
        const i = v.articles.indexOf(a), pa = v.articles[i - 1], na = v.articles[i + 1];
        const toVol = { href: v.href, label: volShort(v), tip: volHead(v), vol: v.key };
        const toArt = x => ({ href: `#/articulo/${x.id}/${tab}`, label: artLabel(x), tip: x.title, vol: v.key });
        return headNav(pa ? toArt(pa) : toVol, na ? toArt(na) : toVol, 'Artículos contiguos');
      })()}</header>
    ${tabs(`#/articulo/${a.id}`, ART_TABS, tab, TAB.texto)}
    ${body}
    ${tab !== TAB.texto ? relatedPanel(a) : ''}
    <nav class="neighbours" aria-label="Artículos contiguos">
      ${prev ? neighbourLink(prev, 'prev', tab) : '<span></span>'}
      ${next ? neighbourLink(next, 'next', tab) : '<span></span>'}
    </nav>
  </div>
  <a class="btn fab" href="#/leer/${a.id}" data-vol="${v.key}">${ICON.book}${p > 0 ? 'Seguir leyendo' : 'Leer texto completo'}</a>`;
}

/** Enlace al artículo anterior/siguiente: volumen, título del volumen, título y autor (cruza de volumen). */
function neighbourLink(a, dir, tab) {
  const v = article(a.id)?.v;
  return `<a class="${dir}" href="#/articulo/${a.id}${tab != null ? '/' + tab : ''}" data-vol="${v?.key || ''}">
    <small>${dir === 'next' ? 'Siguiente →' : '← Anterior'}</small>
    ${v ? `<span class="nb-vol">${esc(volHead(v))}</span>` : ''}
    <span class="nb-title">${esc(a.title)}</span>
    <span class="nb-author">${esc(byline(a))}</span>
  </a>`;
}

const THESES_TABS = ['Conclusiones', 'Mapa conceptual'];
/** Ruta de la síntesis de una revista: #/tesis[/pestaña] (Marx XXI) o #/tesis/nuevo-ciclo[/pestaña]. */
const thesesHref = (p, tab) => (p.id === 'marx-xxi' ? '#/tesis' : `#/tesis/${p.id}`) + (tab ? `/${tab}` : '');

/** Síntesis de una revista: sus tesis transversales (plegables) y su mapa conceptual común. */
function thesesView(p, tab = 0, params) {
  if (!p) return notFound();
  if (!(tab >= 0 && tab < THESES_TABS.length)) tab = 0;
  const mx = p.id === 'marx-xxi';
  setBar(`${p.name}: Síntesis`, { up: p.home });
  const cv = p.cross_volume, n = numWord(p.volumes.length);
  const openT = params?.get('t');
  const body = tab === 0
    ? `<p class="muted small">Tesis que atraviesan los ${n} ${esc(p.unit_plural)}. Despliega cada una para leerla, ver dónde aparece e ir a los artículos.</p>
      ${cv.theses.map((t, i) => `<details class="card thesis" id="tesis-${i + 1}"${String(i + 1) === openT ? ' open' : ''}>
        <summary><div class="eyebrow">Tesis ${i + 1}</div><h3>${esc(t.title)}</h3></summary>
        <div class="thesis-body"><p style="margin:0">${esc(t.text)}</p>
        ${t.where ? `<p class="muted small" style="margin:10px 0 0;font-style:italic">${esc(t.where)}</p>
          <div class="chips">${whereLinks(t.where, p).map(([label, href]) => `<a class="chip" href="${href}">${esc(label)}</a>`).join('')}</div>` : ''}</div>
      </details>`).join('')}
      ${lib().synthesis ? `<p class="small" style="margin-top:20px"><a href="#/sintesis/1">Cómo se alinean estas tesis con las de la otra revista: síntesis de la colección →</a></p>` : ''}`
    : `${cv.map ? figure(cv.map) + '<p class="muted small">Toca el mapa para ampliarlo.</p>' : '<p class="empty">Esta revista no tiene mapa común.</p>'}`;
  const html = `<div class="wrap">
    <header class="page-head"><a class="eyebrow ph-pub" href="${p.home}">${esc(p.name)}</a><h1>${esc(p.name)}: Síntesis</h1>
    <div class="sub">${cv.theses.length} tesis comunes a los ${n} ${esc(p.unit_plural)} y su mapa conceptual.</div></header>
    ${tabs(thesesHref(p), THESES_TABS, tab)}
    ${body}
    ${aiNote()}
  </div>`;
  return [html, () => {
    if (openT) requestAnimationFrame(() => document.getElementById('tesis-' + openT)?.scrollIntoView());
  }];
}

/** "Volumen 1 (Ruiz, Bedmar) · Volumen 3 (Gallardo)" o "#1 (Aguiriano) · #003 (Merchant)" → enlaces a los
 *  artículos por apellido, o al volumen/número. */
function whereLinks(where, p = pub()) {
  const out = [];
  const re = p.volumes[0]?.label ? /#0*(\d+)\s*(?:\(([^)]*)\))?/g : /(?:Volumen|Tomo)\s+(\d)\s*(?:\(([^)]*)\))?/g;
  for (const m of where.matchAll(re)) {
    const v = volume(+m[1], p.id);
    if (!v) continue;
    const names = (m[2] || '').split(/[,;]/).map(s => s.replace(/^(en especial|todo el volumen|todo el número)\s*/i, '').trim()).filter(s => s.length >= 2);
    const find = n => v.articles.find(a => fold(byline(a) + ' ' + a.author).includes(fold(n)))
      || v.articles.find(a => n.split(/\s+(?:y|e)\s+/).every(x => fold(byline(a)).includes(fold(x))));
    const found = [...new Set(names.map(find).filter(Boolean))];
    if (!found.length) out.push([volName(v), v.href]);
    else for (const a of found) out.push([`${volShort(v)} · ${byline(a).split(/ y | e /)[0]}`, `#/articulo/${a.id}`]);
  }
  return out;
}

function glossaryView(params) {
  setBar('Glosario');
  const L = lib();
  const multi = L.pubs.length > 1;
  let pubId = L.byId[params.get('p')] ? params.get('p') : '', vol = '', bridges = params.get('p') === 'puentes';
  const volChips = () => {
    const p = L.byId[pubId] || (multi ? null : L.pubs[0]);
    if (!p) return '';
    return [['', 'Todos'], ...p.volumes.map(v => [v.key, volShort(v)])].map(([k, label]) =>
      `<button class="chip" data-v="${k}" aria-pressed="${k === vol}">${esc(label)}</button>`).join('');
  };
  const html = `<div class="wrap">
    <header class="page-head"><h1>Glosario</h1><div class="sub">${L.glossary.length} conceptos definidos en ${multi ? 'los artículos de las dos revistas' : 'los artículos'}. Toca uno para ir a su artículo.${multi ? ' Los <b>conceptos puente</b> aparecen en las dos.' : ''}</div></header>
    <div class="sticky-tools">
      <label class="field">${ICON.search}<input id="g-q" type="search" placeholder="Buscar concepto o definición" value="${esc(params.get('q') || '')}" autocomplete="off"></label>
      ${multi ? `<div class="chips" id="g-pub">${[['', 'Toda la biblioteca'], ...L.pubs.map(p => [p.id, p.name]), ['puentes', 'Puentes']].map(([k, label]) =>
        `<button class="chip" data-p="${k}" aria-pressed="${bridges ? k === 'puentes' : k === pubId}">${esc(label)}</button>`).join('')}</div>` : ''}
      <div class="chips" id="g-vol">${volChips()}</div>
      <div class="muted small" id="g-count" style="margin-top:8px"></div>
    </div>
    <div id="g-list"></div>
  </div>`;
  return [html, () => {
    const input = $('#g-q'), list = $('#g-list');
    const url = () => '#/glosario' + (() => {
      const qs = new URLSearchParams();
      if (input.value) qs.set('q', input.value);
      if (bridges) qs.set('p', 'puentes'); else if (pubId) qs.set('p', pubId);
      return qs.toString() ? '?' + qs : '';
    })();
    const render = () => {
      const q = input.value.trim(), f = fold(q);
      const items = L.glossary.filter(e => (!pubId || e.pub.id === pubId) && (!vol || e.v.key === vol) && (!bridges || e.bridge)
        && (!f || fold(e.c.term).includes(f) || fold(e.c.definition).includes(f)));
      $('#g-count').textContent = `${items.length} conceptos`;
      list.innerHTML = items.slice(0, 400).map(e => `<a class="list-item" href="#/articulo/${e.a.id}/${TAB.conceptos}" data-vol="${e.v.key}">
        <h3 style="font-weight:700"><span style="color:var(--vol)">▪</span> ${highlight(e.c.term, q)}${multi && e.bridge ? ' <span class="tag olive">puente</span>' : ''}</h3><p>${highlight(e.c.definition, q)}</p>
        <div class="src">${multi && !e.v.label ? 'Marx XXI · ' : ''}${esc(volName(e.v))} · ${esc(byline(e.a))} · ${esc(e.a.title)}</div></a>`).join('') || '<p class="empty">Sin resultados.</p>';
    };
    input.addEventListener('input', () => { render(); history.replaceState(null, '', url()); });
    $('#g-pub')?.addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      bridges = b.dataset.p === 'puentes';
      pubId = bridges ? '' : b.dataset.p;
      vol = '';
      for (const c of $('#g-pub').children) c.setAttribute('aria-pressed', c === b);
      $('#g-vol').innerHTML = volChips();
      history.replaceState(null, '', url());
      render();
    });
    $('#g-vol').addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      vol = b.dataset.v;
      for (const c of $('#g-vol').children) c.setAttribute('aria-pressed', c === b);
      render();
    });
    render();
  }];
}

/** Síntesis de la colección: tesis comunes (principio en Marx XXI → aplicación en Nuevo Ciclo), conceptos
 *  puente y aportes propios de cada revista (data/library-synthesis.json). */
const SYNTH_TABS = ['Mapa conceptual', 'Tesis comunes', 'Conceptos puente'];

function synthesisView(tab = 0, params) {
  const S = lib().synthesis;
  if (!S) return notFound();
  if (!(tab >= 0 && tab < SYNTH_TABS.length)) tab = 0;
  setBar('Síntesis de la colección');
  const mx = pub('marx-xxi'), nc = pub('nuevo-ciclo');
  const chipsFor = (where, p) => p && where ? `<div class="chips">${whereLinks(where, p).map(([label, href]) =>
    `<a class="chip" href="${href}">${esc(label)}</a>`).join('')}</div>` : '';
  const thesisLinks = (nums, p) => nums?.length ? nums.map(n =>
    `<a href="${thesesHref(p)}?t=${n}">${n}</a>`).join(', ') : '—';
  const artChip = x => {
    const hit = article(x.article);
    return hit ? `<a class="chip" href="#/articulo/${hit.a.id}/${TAB.conceptos}" data-vol="${hit.v.key}"><i class="m-dot"></i>${esc(volShort(hit.v))} · ${esc(byline(hit.a))}${x.term && fold(x.term) !== fold(hit.a.title) ? ` — <i>${esc(x.term)}</i>` : ''}</a>` : '';
  };
  let body;
  if (tab === 0) {
    body = `<div class="prose synth-intro"><p>${esc(S.intro)}</p></div>
      ${S.map ? figure(S.map) + '<p class="muted small">Toca el mapa para ampliarlo.</p>' : ''}`;
  } else if (tab === 1) {
    // plegables como las tesis de cada revista; ?t=N llega con esa tesis desplegada
    const openT = params?.get('t');
    body = `<p class="muted small">Tesis que comparten las dos revistas. Despliega cada una para leer el principio en Marx XXI, su aplicación en Nuevo Ciclo e ir a los artículos.</p>
      ${S.theses.map(t => `<details class="card thesis synth" id="sintesis-${t.number}"${String(t.number) === openT ? ' open' : ''}>
      <summary><div class="row-actions"><span class="eyebrow">Tesis ${t.number}</span><span class="grow"></span>${t.status ? `<span class="tag ${t.status === 'común' ? 'soft' : 'olive'}">${esc(t.status)}</span>` : ''}</div>
      <h3>${esc(t.title)}</h3></summary>
      <div class="thesis-body">
      ${t.principle ? `<div class="synth-col"><div class="eyebrow vol">Principio · Marx XXI</div><p>${esc(t.principle)}</p>${chipsFor(t.where_marx_xxi, mx)}</div>` : ''}
      ${t.application ? `<div class="synth-col" data-vol="n1"><div class="eyebrow vol">Aplicación · Nuevo Ciclo</div><p>${esc(t.application)}</p>${chipsFor(t.where_nuevo_ciclo, nc)}</div>` : ''}
      <p class="muted small synth-align">Tesis originales: Marx XXI ${thesisLinks(t.marx_xxi_theses, mx)} · Nuevo Ciclo ${thesisLinks(t.nuevo_ciclo_theses, nc)}</p>
    </div></details>`).join('')}`;
  } else {
    body = `${S.bridge_concepts?.length ? `<p class="muted small">Conceptos definidos en las dos revistas: cada uno enlaza con sus artículos en una y otra.</p>
      ${S.bridge_concepts.map(b => `<div class="list-item">
        <h3 style="font-weight:700">${esc(b.term)}</h3>${b.note ? `<p>${esc(b.note)}</p>` : ''}
        <div class="chips">${[...(b.marx_xxi || []), ...(b.nuevo_ciclo || [])].map(artChip).join('')}</div></div>`).join('')}` : ''}
    ${S.only_marx_xxi?.length || S.only_nuevo_ciclo?.length ? `<h2 class="sec-title">Lo que aporta cada revista</h2>
      <div class="grid two synth-only">
        <div class="card"><div class="eyebrow vol">Solo en Marx XXI</div>
          ${(S.only_marx_xxi || []).map(x => `<div class="only-item"><b>${esc(x.term)}</b>${x.where ? `<div class="muted small">${esc(x.where)}</div>` : ''}${chipsFor(x.where, mx)}</div>`).join('')}</div>
        <div class="card" data-vol="n1"><div class="eyebrow vol">Solo en Nuevo Ciclo</div>
          ${(S.only_nuevo_ciclo || []).map(x => `<div class="only-item"><b>${esc(x.term)}</b>${x.note ? `<div class="muted small">${esc(x.note)}</div>` : ''}<div class="chips">${artChip({ article: x.article })}</div></div>`).join('')}</div>
      </div>` : ''}`;
  }
  const html = `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Biblioteca · Marx XXI y Nuevo Ciclo</div><h1>Síntesis de la colección</h1>
      <div class="sub">${S.theses.length} tesis comunes · ${S.bridge_concepts?.length || 0} conceptos puente</div></header>
    ${tabs('#/sintesis', SYNTH_TABS, tab)}
    ${body}
    ${aiNote()}
  </div>`;
  return [html, () => {
    const t = params?.get('t');
    if (t) requestAnimationFrame(() => document.getElementById('sintesis-' + t)?.scrollIntoView());
  }];
}

/** Mapas conceptuales y esquemas de todos los niveles: biblioteca, cada revista (arco y mapa común),
 *  cada volumen o número y cada artículo. `?p=nuevo-ciclo` lleva directamente a una revista. */
function mapsView(params) {
  setBar('Mapas conceptuales');
  const L = lib(), S = L.synthesis;
  const titled = (title, f, href) => f ? `<div class="dg-item">
    ${href ? `<a class="dg-title" href="${href}">${title}</a>` : `<div class="dg-title">${title}</div>`}${figure(f)}</div>` : '';
  const pubSection = p => {
    const cv = p.cross_volume, mx = p.id === 'marx-xxi';
    const tesis = thesesHref(p, 1); // pestaña Mapa conceptual
    return `<details class="maps-sec" id="mapas-${p.id}">
      <summary><h2 class="sec-title">${esc(p.name)}</h2></summary>
      <details class="maps-sub">
        <summary>Mapas comunes de la revista</summary>
        <div class="dg-gallery">
          ${titled('Mapa conceptual común', cv.map, tesis)}
          ${titled('Trayectoria de la publicación', cv.arc, p.home)}
          ${p.volumes.map(v => `<div data-vol="${v.key}">${titled(
            `<b>${esc(volShort(v))}</b> · ${esc(v.label ? monthName(v.month) : v.title)}`, v.concept_map, `${v.href}/3`)}</div>`).join('')}
        </div>
      </details>
      ${p.volumes.map(v => {
        const n = v.articles.reduce((s, a) => s + a.diagrams.length, 0) + (v.concept_map ? 1 : 0);
        return `<details class="maps-sub" data-vol="${v.key}">
        <summary><i class="m-dot"></i><span>${esc(volHead(v))}</span><span class="m-count">${n}</span></summary>
        <div class="dg-gallery">
          ${titled(`<b>Mapa ${v.label ? 'del número' : 'del volumen'}</b> · ${esc(v.label ? v.title : volName(v))}`, v.concept_map, `${v.href}/3`)}
          ${v.articles.filter(a => a.diagrams.length).map(a => titled(
            `<b>${esc(artLabel(a))}</b> · ${esc(a.title)}<small>${esc(byline(a))}</small>`,
            a.diagrams[0], `#/articulo/${a.id}/${TAB.esquema}`) + a.diagrams.slice(1).map(d => `<div class="dg-item">${figure(d)}</div>`).join('')).join('')}
        </div>
      </details>`;
      }).join('')}
    </details>`;
  };
  const html = `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Biblioteca</div><h1>Mapas conceptuales</h1>
      <div class="sub">Todos los mapas y esquemas, de lo general a lo particular: la biblioteca, cada revista y cada volumen o número junto a los esquemas de sus artículos. Toca uno para ampliarlo y pasa al siguiente con las flechas; su título lleva a su página.</div></header>
    <nav class="chips maps-nav" aria-label="Ir a">
      ${S?.map ? '<button class="chip" data-go="mapas-biblioteca">Biblioteca</button>' : ''}
      ${L.pubs.map(p => `<button class="chip" data-go="mapas-${p.id}">${esc(p.name)}</button>`).join('')}
    </nav>
    ${S?.map ? `<details class="maps-sec" id="mapas-biblioteca"><summary><h2 class="sec-title">Biblioteca</h2></summary>
      <div class="dg-gallery wide">${titled('Mapa de la biblioteca: Marx XXI y Nuevo Ciclo', S.map, '#/sintesis')}</div></details>` : ''}
    ${L.pubs.map(pubSection).join('')}
    ${aiNote()}
  </div>`;
  return [html, () => {
    const go = id => { const d = document.getElementById(id); if (d) { d.open = true; d.scrollIntoView(); } };
    view.querySelector('.maps-nav').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    if (params.get('p')) requestAnimationFrame(() => go('mapas-' + params.get('p')));
  }];
}

/** Índice de autores de las dos revistas, con sus textos. */
function authorsView(params) {
  setBar('Autores');
  const L = lib();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Autores</h1><div class="sub">${L.authors.length} firmas${L.pubs.length > 1 ? ' en Marx XXI y Nuevo Ciclo; las que publican en las dos revistas aparecen marcadas' : ''}. Entre los entrevistados figura el nombre de la persona entrevistada.</div></header>
    <div class="sticky-tools"><label class="field">${ICON.search}<input id="au-q" type="search" placeholder="Buscar autor" value="${esc(params.get('q') || '')}" autocomplete="off"></label></div>
    <div id="au-list"></div>
  </div>`;
  return [html, () => {
    const input = $('#au-q'), list = $('#au-list');
    const render = () => {
      const q = input.value.trim(), f = fold(q);
      const items = L.authors.filter(x => !f || fold(x.name).includes(f));
      list.innerHTML = items.map(x => {
        const both = new Set(x.items.map(i => i.v.pub.id)).size > 1;
        return `<div class="list-item author">
          <h3>${highlight(x.name, q)}${both ? ' <span class="tag olive">en las dos revistas</span>' : ''}</h3>
          ${x.items.map(({ v, a }) => `<a class="au-text" href="#/articulo/${a.id}" data-vol="${v.key}"><i class="m-dot"></i><span>${esc(a.title)}<small>${esc(volName(v))}${isInterview(a) ? ' · entrevista' : ''}</small></span></a>`).join('')}
        </div>`;
      }).join('') || '<p class="empty">Sin resultados.</p>';
    };
    input.addEventListener('input', () => {
      render();
      history.replaceState(null, '', '#/autores' + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
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
        : h.a ? `#/articulo/${h.a.id}/${h.kind === 'argument' ? TAB.pildoras : h.kind === 'concept' ? TAB.conceptos : h.kind === 'summary' ? TAB.resumen : TAB.pildoras}`
          : h.kind === 'thesis' ? thesesHref(h.pub)
            : h.kind === 'synthesis' ? `#/sintesis/1?t=${h.n}` : `${h.v.href}/2`;
      // la publicación como prefijo cuando hay más de una
      const pre = lib().pubs.length > 1 && h.pub && !h.v?.label ? h.pub.name + ' · ' : '';
      const src = h.kind === 'synthesis' ? 'Biblioteca' : h.kind === 'thesis' ? `${esc(h.pub.name)} · colección`
        : `${esc(pre + volName(h.v))}${h.a ? ' · ' + esc(byline(h.a)) : ''}`;
      return `<a class="list-item" href="${href}"><span class="tag ${color}">${label}</span> <span class="muted sc" style="font-size:14.5px">${src}</span>
        <h3>${highlight(h.label, input.value)}</h3><p>${highlight(h.text, input.value)}</p></a>`;
    };
    const run = () => {
      ctrl?.abort();
      const q = input.value.trim();
      history.replaceState(null, '', '#/buscar' + (q ? `?q=${encodeURIComponent(q)}${full ? '&en=textos' : ''}` : ''));
      $('#s-prog').hidden = true;
      if (q.length < 2) {
        list.innerHTML = `<p class="empty">Busca en resúmenes, píldoras, conceptos, conclusiones y tesis comunes. Cambia a «Textos íntegros» para buscar dentro de los ${lib().allArticles.length} artículos completos.</p>`;
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

/** Marcadores = subrayados del modo lectura (con su color y nota propia), agrupados por texto. */
function bookmarksView(params) {
  setBar('Marcadores');
  const all = store.highlights();
  const color = params.get('c') || '';
  const shown = color ? all.filter(h => h.color === color) : all;
  const titleOf = key => {
    const hit = article(key);
    if (hit) return { v: hit.v, title: hit.a.title, author: byline(hit.a), order: lib().allArticles.indexOf(hit) };
    const n = +key.replace('tomo-', '');
    // presentaciones de Marx XXI: delante de los artículos de su volumen
    const first = lib().allArticles.findIndex(x => x.v === volume(n));
    return { v: volume(n), title: n === 5 ? 'Nota introductoria' : 'Presentación', author: '', order: first - 0.5 };
  };
  // agrupar por texto, en el orden de la biblioteca; dentro de cada texto, en el orden del pasaje
  const groups = [...new Set(shown.map(h => h.key))].map(key => ({ key, ...titleOf(key),
    items: shown.filter(h => h.key === key).sort((x, y) => x.b0 - y.b0 || x.o0 - y.o0) }))
    .filter(g => g.v).sort((x, y) => x.order - y.order);
  const used = new Set(all.map(h => h.color));
  const html = `<div class="wrap">
    <header class="page-head"><h1>Marcadores</h1>
      <div class="sub">Pasajes subrayados en el modo lectura y tus notas propias.</div></header>
    ${used.size > 1 ? `<div class="chips hl-filter" role="group" aria-label="Filtrar por color">
      <a class="chip" href="#/marcadores"${color ? '' : ' aria-pressed="true"'}>Todos <span class="m-count">${all.length}</span></a>
      ${Object.entries(HL_COLORS).filter(([k]) => used.has(k)).map(([k, [n, c]]) =>
        `<a class="chip" href="#/marcadores?c=${k}"${k === color ? ' aria-pressed="true"' : ''}><i class="hl-dot" style="--hl:${c}"></i>${n}</a>`).join('')}
    </div>` : ''}
    ${groups.length ? groups.map(g => `<section class="hl-group" data-vol="${g.v.key}">
      <div class="eyebrow vol">${esc(volHead(g.v))}</div>
      <h2 class="hl-group-title"><a href="#/leer/${g.key}">${esc(g.title)}</a></h2>
      ${g.author ? `<div class="muted small">${esc(g.author)}</div>` : ''}
      ${g.items.map(h => `<div class="hl-item" style="--hl:${(HL_COLORS[h.color] || HL_COLORS.yellow)[1]}">
        <a class="hl-link" href="#/leer/${g.key}?b=${h.b0}">
          <p class="hl-text">${esc(h.text.length > 320 ? h.text.slice(0, 320) + '…' : h.text)}</p>
          ${h.note ? `<p class="hl-own">${esc(h.note).replace(/\n/g, '<br>')}</p>` : ''}
          <span class="src">${new Date(h.t).toLocaleDateString('es')}</span>
        </a>
        <button class="icon-btn" data-del="${esc(h.uid)}" aria-label="Eliminar subrayado">${ICON.x}</button>
      </div>`).join('')}
    </section>`).join('')
    : `<div class="empty">Aún no hay marcadores.<br>En el modo lectura, <b>selecciona un pasaje</b> y elige un color para subrayarlo; toca después el subrayado para escribir una nota propia.</div>`}
  </div>`;
  return [html, () => {
    view.addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const h = all.find(x => x.uid === b.dataset.del);
      if (h?.note.trim() && !confirm('¿Eliminar el subrayado y su nota?')) return;
      store.removeHighlight(b.dataset.del);
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
  // Textos propios de las demás publicaciones (p. ej. data/nuevo-ciclo/about.json)
  const others = L.pubs.filter(p => p.id !== 'marx-xxi' && p.about);
  const credits = p => p.volumes.map(v => `<div class="credit-vol" data-vol="${v.key}">
      <div class="eyebrow vol">${v.label ? `${esc(volName(v))} · ${esc(monthName(v.month))}` : `Volumen ${v.number}${v.year ? ' · ' + v.year : ''}`}</div>
      <h3>${esc(v.label ? v.subtitle : v.title)}</h3>
      ${v.editor ? `<p class="muted small">Edición: ${esc(v.editor)}${!v.label && v.number <= 3 ? ' · publicado con Contracultura' : ''}</p>` : ''}
      <ul>${v.articles.map(a => `<li><a href="#/articulo/${a.id}">${esc(byline(a))}</a>${isInterview(a) ? ' (entrevista)' : ''} — <span class="muted">${esc(a.title)}</span></li>`).join('')}</ul>
    </div>`).join('');
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Lector Marx XXI</div><h1>Acerca de</h1>
      <div class="sub">Guía de lectura de ${L.pubs.length > 1 ? 'los cinco volúmenes de Marx XXI y los números de la revista trimestral Nuevo Ciclo' : 'los cinco volúmenes de la revista'}: textos íntegros y materiales de estudio.</div></header>

    <section class="card about" id="revista">
      <h2>${esc(mag.title || 'Sobre Marx XXI')}</h2>
      ${paras(mag.paragraphs || [])}
      ${mag.source_url ? `<p class="muted small">${esc(mag.source_label || 'Fuente:')} <a href="${esc(mag.source_url)}" rel="noopener" target="_blank">${esc(mag.source_url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
      ${mag.site_url ? `<a class="btn ghost" href="${esc(mag.site_url)}" rel="noopener" target="_blank">Visitar marxxxi.com</a>` : ''}
    </section>
    ${others.map(p => sec(p.about.magazine?.title || 'Sobre ' + p.name, p.about.magazine?.paragraphs)).join('')}

    ${sec(ab.ai?.title || 'Sobre esta guía de lectura', [...(ab.ai?.paragraphs || []), ...others.flatMap(p => p.about.ai?.paragraphs || [])], 'ai')}
    ${sec(ab.license?.title || 'Textos y licencia', [...(ab.license?.paragraphs || []), ...others.flatMap(p => p.about.license?.paragraphs || [])])}

    <section class="card about" id="creditos">
      <h2>${esc(ab.credits_title || 'Créditos')}</h2>
      ${L.pubs.map(p => `${L.pubs.length > 1 ? `<h3 class="credit-pub">${esc(p.name)}</h3>` : ''}
        <p class="muted small">Autores y ${p.volumes[0]?.label ? 'artículos de cada número' : 'artículos de cada volumen'}, en el orden de la revista.</p>
        ${credits(p)}`).join('')}
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
  // guía de un artículo: cabecera en color pastel del volumen y fondo gris muy claro (ver .art-page)
  document.body.classList.toggle('art-page', parts[0] === 'articulo');
  let out;
  switch (parts[0]) {
    case undefined: out = libraryView(); break;
    case 'marx-xxi': case 'nuevo-ciclo': out = collectionView(pub(parts[0])); break;
    case 'volumen': case 'tomo': out = volumeView(pub('marx-xxi'), +parts[1], parts[2] != null ? +parts[2] : 1); break;
    case 'numero': out = volumeView(pub('nuevo-ciclo'), +parts[1], parts[2] != null ? +parts[2] : 1); break;
    case 'articulo': out = articleView(parts[1], +(parts[2] || TAB.pildoras)); break;
    case 'leer': out = await readerView(parts[1], params); break;
    case 'tesis': {
      const other = parts[1] && !/^\d+$/.test(parts[1]); // #/tesis/nuevo-ciclo[/n] o #/tesis[/n]
      out = thesesView(pub(other ? parts[1] : 'marx-xxi'), +(other ? parts[2] : parts[1]) || 0, params);
      break;
    }
    case 'sintesis': out = synthesisView(+(parts[1] || 0), params); break;
    case 'autores': out = authorsView(params); break;
    case 'mapas': out = mapsView(params); break;
    case 'glosario': out = glossaryView(params); break;
    case 'buscar': out = searchView(params); break;
    case 'marcadores': out = bookmarksView(params); break;
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
  if (lib()) route(); // si los datos aún cargan, la primera ruta ya leerá el hash actual
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
