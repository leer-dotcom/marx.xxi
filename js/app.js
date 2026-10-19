// Marx XXI · lector web. SPA sin dependencias con rutas por hash (compatible con GitHub Pages).
import {
  loadLibrary, lib, dataUrl, pub, volume, article, neighbours, text, esc, highlight, fold,
  searchGuide, searchFullText, KIND, store, FONTS, THEMES, DEFAULT_SETTINGS, HL_PALETTE, HL_PALETTE_ORDER, HL_CATEGORIES, DEFAULT_LEGEND, hlHex, hlCat,
  volName, volShort, volHead, volDate, artLabel, byline, isInterview, related, monthName,
} from './data.js';
import { readerView } from './reader.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const ICON = {
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 19h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 5h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M3 5.5C5.5 4.5 8.5 4.5 11.5 6v13c-3-1.5-6-1.5-8.5-.5zM20.5 5.5C18 4.5 15 4.5 12.5 6v13c3-1.5 6-1.5 8-.5z"/></svg>',
  hub: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.5 6.5l3.7 3.7M17.5 6.5l-3.7 3.7M6.5 17.5l3.7-3.7M17.5 17.5l-3.7-3.7"/></svg>',
  az: '<svg viewBox="0 0 24 24"><path d="M3 18L7 6l4 12M4.3 14h5.4M14 6h7l-7 12h7"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4z"/></svg>',
  gear: '<svg class="ico-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  aa: '<svg viewBox="0 0 24 24"><path d="M4 18L9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  guide: '<svg viewBox="0 0 24 24"><path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c3 2.3 8 2.3 11 0V11"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  shelf: '<svg viewBox="0 0 24 24"><path d="M4 4.5v15M8 4.5v15M12.5 5.2l3.8 14.3M3 19.5h18"/></svg>',
  map: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="8.5" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v2.5h11V9M12 11.5V15"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.3c2.3.2 4 1.8 4.5 4.6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M4 6h11M4 12h11M4 18h7M17.5 14.5v6M14.5 17.5h6"/></svg>',
  listOn: '<svg viewBox="0 0 24 24"><path d="M4 6h11M4 12h11M4 18h7M14 17.5l2.6 2.5L21.5 15"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
};
export { ICON };

// ---------------------------------------------------------------- utilidades de UI

/** Título y botón «atrás». `up` es el nivel superior, al que va «atrás» si no hay pantalla anterior. */
export function setBar(title, { back = true, up = '#/' } = {}) {
  $('#appbar-title').textContent = title || '';
  $('#btn-back').hidden = !back;
  $('#btn-back').dataset.up = up;
  document.title = title ? `${title} · Lector de Marx XXI` : 'Lector de Marx XXI';
}
// El nombre de la barra lleva a la portada; si ya se está en ella, sube hasta arriba
$('.appbar .brand').addEventListener('click', e => {
  if (normHash(location.hash) !== '#/') return;
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
// «Atrás»: a la pantalla anterior del recorrido (las pestañas no cuentan); si no la hay, al nivel superior
$('#btn-back').addEventListener('click', e => {
  const h = backHash();
  if (h) { backBtn = true; location.hash = h; } else location.hash = e.currentTarget.dataset.up || '#/';
});

// Compartir: el enlace de la pantalla actual (útil sobre todo con la app instalada, que no muestra la barra de
// direcciones). Hoja de compartir del sistema si la hay; si no, se copia al portapapeles.
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-share]')) return;
  // en el texto íntegro, sin el bloque por el que se entró (b) ni la palabra buscada (q): ya no es donde se lee
  const [path, query = ''] = (location.hash || '#/').split('?');
  const qs = new URLSearchParams(query);
  if (path.startsWith('#/leer/')) { qs.delete('b'); qs.delete('q'); }
  const url = location.href.split('#')[0] + path + (qs.toString() ? '?' + qs : '');
  const title = document.title;
  if (navigator.share) {
    try { await navigator.share({ title, url }); } catch { /* cancelado */ }
    return;
  }
  try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
  catch { prompt('Copia el enlace:', url); }
});

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2200);
}

/** Ventana de confirmación propia de la app (en lugar del confirm() del navegador, que no se puede adaptar).
 *  Devuelve una promesa con true (botón principal) o false (cancelar, Esc o tocar fuera). */
export function confirmDialog({ title, text, ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = 'confirm';
    d.setAttribute('aria-labelledby', 'confirm-title');
    d.innerHTML = `<h2 id="confirm-title">${esc(title)}</h2>
      ${text ? `<p>${text.split('\n').map(esc).join('<br>')}</p>` : ''}
      <div class="confirm-actions">
        ${cancel ? `<button type="button" class="btn ghost" data-answer="0">${esc(cancel)}</button>` : ''}
        <button type="button" class="btn${danger ? ' danger' : ''}" data-answer="1" autofocus>${esc(ok)}</button>
      </div>`;
    let done = false;
    const finish = yes => { if (done) return; done = true; if (d.open) d.close(); d.remove(); resolve(yes); };
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-answer]');
      if (b) finish(b.dataset.answer === '1');
      else if (e.target === d) finish(null); // fuera de la ventana: ni una cosa ni otra (null)
    });
    d.addEventListener('cancel', e => { e.preventDefault(); finish(null); }); // Esc
    d.addEventListener('close', () => finish(null));
    document.body.append(d);
    d.showModal();
  });
}

export function openSheet(title, html, onMount) {
  const d = $('#sheet');
  $('#sheet-title').textContent = title;
  const body = $('#sheet-body');
  body.innerHTML = html;
  body.scrollTop = 0;
  d.classList.remove('sheet-max'); // a tamaño máximo solo la que lo pida (la guía de estudio del lector)
  if (!d.open) { d.showModal(); d.focus(); } // el foco, en la ventana (no recuadrar su botón de cerrar)
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
      // sin proporción en los datos se reservó una altura mínima: ya cargado, la caja se ajusta al dibujo
      const vb = (host.querySelector('svg')?.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { host.style.minHeight = ''; host.style.aspectRatio = `${vb[2]}/${vb[3]}`; }
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

// Visor de esquemas y mapas: fondo blanco y el dibujo ajustado a la pantalla (lo más grande posible sin que nada
// quede fuera). Zoom con la rueda, pellizcando con dos dedos, con doble clic o doble toque, o con los botones; se
// arrastra para desplazarlo. Barra flotante inferior: anterior y siguiente (también flechas del teclado), zoom y
// cerrar. El pie va arriba, entero; el dibujo se ajusta al espacio que queda.
// Esquemas que se recorren: los visibles de la pantalla (o de la hoja) de partida.
let zoomList = [], zoomIdx = -1, zoomFit = null, zoomBy = null;
// Versión de cada figura (temporal, para contrastar la revisión de los esquemas): 0 = simplificada 1 (la de siempre,
// por defecto), 1 = simplificada 2 (derivada de la detallada, de svg/simplificada/) o 2 = detallada (de svg/revision/),
// las tres con el mismo nombre. No se recuerda: al cerrar el visor, simplificada 1.
let zoomVer = 0, zoomHost = null, zoomForced = false, zoomOpening = false;
const ZOOM_VERS = [
  { tag: 's1', name: 'Simplificada 1', dir: '' },
  { tag: 's2', name: 'Simplificada 2', dir: 'simplificada/' },
  { tag: 'd', name: 'Detallada', dir: 'revision/' },
];
const verFile = (f, v = zoomVer) => f.replace(/(^|\/)svg\//, `$1svg/${ZOOM_VERS[v].dir}`);
/** Etiqueta «Versión simplificada / detallada» sobre el interruptor, con una flechita hacia él: al abrir el visor y
 *  cada vez que se cambia de versión. Aparece en 0,2 s, se ve 0,4 s y se difumina en 0,3 s (animación «tipflash»).
 *  En los visores de varios esquemas, la primera vez que se amplía o se reduce en cada uso, la misma etiqueta sale
 *  sobre «n / N», solo con el icono de restablecer (tocarlo devuelve el zoom inicial); es otra etiqueta, así que
 *  no corta la de la versión si coinciden. */
let zoomTipsShown = new Set();
const RESTORE_ICON = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M4 4l6 6M20 9V4h-5M20 4l-6 6M4 15v5h5M4 20l6-6M20 15v5h-5M20 20l-6-6"/></svg>';
/** Primera vez que cambia el zoom en este uso del visor, con varios esquemas: aviso sobre «n / N» (restablecer). */
function flashZoomRestore() {
  if (zoomList.length < 2 || zoomTipsShown.has('r')) return;
  zoomTipsShown.add('r');
  showZoomTip($('#zoom-pos'), RESTORE_ICON, $('#zoom-restore-tip'));
}
/** Muestra una etiqueta sobre un botón de la barra (por defecto, la versión vista sobre el interruptor S | D), con
 *  una flechita que lo señala. La posición se mide dentro de la barra, así que vale también con el visor girado. */
function showZoomTip(anchor = $('#zoom [data-zfull]'), html = null, t = $('#zoom-full-tip')) {
  const bar = $('.zoom-bar');
  if (html) t.innerHTML = html;
  else t.textContent = `Versión ${ZOOM_VERS[zoomVer].name}`; // como en el interruptor (S1 | S2 | D)
  let x = anchor.offsetWidth / 2, el = anchor;
  for (; el && el !== bar; el = el.offsetParent) x += el.offsetLeft;
  t.style.left = el === bar && anchor.offsetWidth ? `${x}px` : '';
  t.classList.add('at-switch');
  clearTimeout(t._t);
  t.hidden = true; void t.offsetWidth; t.hidden = false; // reinicia la animación
  t._t = setTimeout(() => { t.hidden = true; }, 900);
}
/** Título del visor a partir del código de la figura: volumen o número, artículo, título y autor; o qué mapa es. */
function figLabel(code, type) {
  const L = lib(); let m;
  if (code === 'CC') return { text: 'Colección · Mapa conceptual', hi: 0 };
  if (!(m = code?.match(/^([A-Z]{2})(\d+)?(?:\.(\d+))?/))) return null;
  const p = L.pubs.find(x => x.code === m[1]); if (!p) return null;
  if (!m[2]) return { text: type === 'Trayectoria' ? `${p.name} · Trayectoria de la publicación`
    : `${p.name} · Mapa conceptual · Los ${numWord(p.volumes.length)} ${p.unit_plural}`, hi: 0 };
  const v = p.volumes.find(x => x.number === +m[2]); if (!v) return null;
  if (!m[3]) return { text: `${v.label ? 'Número ' + v.label : 'Volumen ' + v.number} · ${v.articles.length} artículos`, hi: 1, vol: v.key };
  const a = v.articles.find(x => x.number === +m[3]); if (!a) return null;
  return { text: `${volShort(v)} · ${artLabel(a)} · ${a.title}`, hi: 2, author: byline(a), vol: v.key };
}
function setZoomVer(v) {
  zoomVer = v;
  const b = $('#zoom [data-zfull]'), next = ZOOM_VERS[(v + 1) % ZOOM_VERS.length];
  b.dataset.ver = v;
  b.querySelectorAll('[data-zv]').forEach(s => s.classList.toggle('on', +s.dataset.zv === v));
  b.title = `Viendo la versión ${ZOOM_VERS[v].name.toLowerCase()} (${ZOOM_VERS[v].tag}): pasar a la ${next.name.toLowerCase()}`;
}
/** Abre o cierra el control vertical de zoom (sobre la lupa). */
function toggleZoomSlider(on) {
  const sl = $('#zoom-slider'), b = $('#zoom [data-zmenu]');
  on ??= sl.hidden;
  sl.hidden = !on;
  b.setAttribute('aria-expanded', on);
  b.classList.toggle('on', on);
}
function zoomStep(d) {
  if (zoomList.length < 2) return;
  zoomIdx = (zoomIdx + d + zoomList.length) % zoomList.length;
  openZoom(zoomList[zoomIdx], true);
}
// zoom del visor, relativo a «ajustado a la pantalla» (1 = 100 %), y su posición (0-100) en el control vertical
const ZOOM_MIN = 0.5, ZOOM_MAX = 10, ZL = Math.log10(ZOOM_MIN), ZR = Math.log10(ZOOM_MAX) - ZL;
const zoomPos = k => (Math.log10(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k))) - ZL) / ZR * 100;
const zoomAt = v => 10 ** (ZL + v / 100 * ZR);
function openZoom(host, keepList = false, markup = null) {
  const st = $('#zoom-stage'), dlg = $('#zoom'), cap = $('#zoom-caption'), level = $('#zoom-level'), range = $('#zoom-range');
  if (!keepList) {
    if (!$('#zoom').open) { setZoomVer(0); zoomForced = false; zoomTipsShown = new Set(); zoomOpening = true; } // cada vez que se abre el visor, la simplificada
    const root = host.closest('#sheet-body') || view;
    zoomList = [...root.querySelectorAll('[data-zoom]')].filter(b => b.offsetParent !== null && !b.closest('details:not([open])') && b.querySelector('.dg[data-state="ok"]'));
    zoomIdx = zoomList.indexOf(host);
  }
  // varios esquemas: «n / N»; uno solo: el icono de las cuatro flechas. En los dos casos, restablece la vista
  $('#zoom-pos').innerHTML = zoomList.length > 1 ? `${zoomIdx + 1} / ${zoomList.length}`
    : RESTORE_ICON;
  for (const b of dlg.querySelectorAll('[data-zstep]')) b.hidden = zoomList.length < 2;
  zoomHost = host;
  // el mapa de la colección, por ahora solo en versión detallada: se abre en ella y el interruptor queda bloqueado
  const only = 'onlyfull' in host.dataset, swb = $('#zoom [data-zfull]');
  if (only && zoomVer !== 2) { setZoomVer(2); zoomForced = true; }
  else if (!only && zoomForced) { setZoomVer(0); zoomForced = false; }
  swb.disabled = only; swb.classList.toggle('locked', only);
  // simplificada 2 o detallada: se trae su SVG (si no existe, se queda la simplificada 1) y se vuelve a abrir con él
  const file = host.querySelector('.dg')?.dataset.svg;
  if (zoomVer && markup == null && file) {
    loadSvg(verFile(file)).then(m => openZoom(host, true, m), () => openZoom(host, true, host.querySelector('.dg')?.innerHTML || ''));
    if (!dlg.open) dlg.showModal();
    return;
  }
  const vol = figLabel(host.dataset.code, host.dataset.type)?.vol || host.closest('[data-vol]')?.dataset.vol || document.body.dataset.vol;
  if (vol) dlg.dataset.vol = vol; else delete dlg.dataset.vol;
  st.innerHTML = `<div class="dg">${markup ?? host.querySelector('.dg')?.innerHTML ?? ''}</div>`;
  // pie: en «Mapas conceptuales», qué esquema es (volumen o número, artículo y título) antes de su descripción;
  // los primeros `zhi` tramos (volumen o número y nº de artículo) van en el color del volumen
  // título: qué figura es (por su código; si no, el que trae la página) y, en los esquemas de artículo, su autor
  const fl = figLabel(host.dataset.code, host.dataset.type);
  const zh = host.closest('[data-zlabel]'), zl = fl?.text || zh?.dataset.zlabel;
  // nombre de la figura («Esquema MX1.14») en negrita cursiva, como en el pie de la página, y su descripción
  // tras el código, (s1) o (s2) simplificada o (d) detallada: qué versión se está viendo
  const tag = host.dataset.tag ? `${host.dataset.tag} (${ZOOM_VERS[zoomVer].tag})` : '', rest = host.dataset.rest ?? host.dataset.caption ?? '';
  // la descripción (zc-desc) se pliega con la doble flecha; queda el título: qué esquema es y su nombre
  const capHtml = tag || rest ? `<span class="zc-desc">${tag ? `<b class="fig-tag">${esc(tag)}</b>.${rest ? ' ' : ''}` : ''}${esc(rest)}</span>` : '';
  const zseg = zl ? zl.split(' · ') : [], zhi = fl ? fl.hi : +(zh?.dataset.zhi || 0);
  const zlHtml = zseg.slice(0, zhi).map(t => `<span class="zl-hi">${esc(t)}</span>`).concat(zseg.length > zhi ? [esc(zseg.slice(zhi).join(' · '))] : []).join(' · ')
    + (fl?.author ? ` · <span class="zl-au">${esc(fl.author)}</span>` : '');
  const fold = capHtml ? `<button type="button" class="zoom-fold" data-zfold aria-label="${cap.classList.contains('folded') ? 'Mostrar la descripción' : 'Ocultar la descripción'}"><svg viewBox="0 0 24 24"><path d="M6 12l6-6 6 6M6 18l6-6 6 6"/></svg></button>` : '';
  cap.innerHTML = (zl ? `<b class="zoom-label">${zlHtml}</b>${capHtml ? ' ' + capHtml : ''}` : capHtml) + fold;
  if (!dlg.open) dlg.showModal();

  // El dibujo se dimensiona de verdad (ancho = W·s, posición left/top), no con transform: scale(), que
  // estiraría un mapa de bits y se vería borroso. Al ser SVG, cada tamaño se vuelve a dibujar nítido.
  const box = st.firstChild, svg = box.querySelector('svg');
  const W = svg?.viewBox?.baseVal?.width || 760;
  box.style.width = W + 'px';
  const H = box.offsetHeight || W * 0.6;
  let s = 1, x = 0, y = 0;
  // zona libre del visor: sin el pie (arriba) ni la barra flotante (abajo)
  const area = () => ({ w: st.clientWidth, h: st.clientHeight, top: cap.textContent ? cap.offsetHeight : 0, bottom: $('.zoom-bar').offsetHeight + 24 });
  const fitScale = () => { const a = area(), m = 10; return Math.max(0.05, Math.min((a.w - 2 * m) / W, (a.h - a.top - a.bottom - 2 * m) / H)); };
  const apply = () => {
    box.style.width = W * s + 'px'; box.style.left = x + 'px'; box.style.top = y + 'px';
    const k = s / fitScale();
    level.textContent = Math.round(k * 100) + ' %'; // 100 % = ajustado a la pantalla
    range.value = Math.round(zoomPos(k)); // también con el control abierto y enfocado
  };
  // Desplazamiento libre, sin el marco del dibujo: se puede llevar a cualquier parte. La única condición es que el
  // dibujo siga ocupando al menos 1/2 de la pantalla a lo ancho y a lo alto (que no quede vacía): al arrastrar más
  // allá, ofrece resistencia; al soltar, vuelve con un pequeño rebote hasta cumplirla.
  const bounds = () => {
    const a = area(), w = W * s, h = H * s, free = a.h - a.top - a.bottom;
    return { xlo: a.w / 2 - w, xhi: a.w / 2, ylo: a.top + free / 2 - h, yhi: a.top + free / 2 };
  };
  const rubber = (v, lo, hi) => v < lo ? lo - (lo - v) * 0.35 : v > hi ? hi + (v - hi) * 0.35 : v;
  const clamp = () => { const b = bounds(); x = Math.min(b.xhi, Math.max(b.xlo, x)); y = Math.min(b.yhi, Math.max(b.ylo, y)); };
  let settleT = 0;
  /** Si la pantalla ha quedado medio vacía, el dibujo vuelve (animado, con rebote) hasta ocupar 1/2 de ella. */
  const settle = () => {
    const ox = x, oy = y; clamp();
    if (ox === x && oy === y) return;
    box.classList.add('settle'); apply();
    clearTimeout(settleT); settleT = setTimeout(() => box.classList.remove('settle'), 480);
  };
  // ajustado: centrado en la zona libre (como siempre al abrirlo)
  const fit = () => {
    const a = area();
    s = fitScale();
    x = (a.w - W * s) / 2; y = a.top + (a.h - a.top - a.bottom - H * s) / 2;
    apply();
  };
  /** Cambia la escala manteniendo fijo el punto (cx, cy) del visor; de la mitad de ajustado (50 %) a ×10. */
  // (`free`: durante un pellizco o la rueda no se recoloca; se hace al terminar)
  const zoomTo = (ns, cx = st.clientWidth / 2, cy = st.clientHeight / 2, free = false) => {
    const f = fitScale();
    ns = Math.min(f * ZOOM_MAX, Math.max(f * ZOOM_MIN, ns));
    const k = ns / s;
    x = cx - (cx - x) * k; y = cy - (cy - y) * k; s = ns;
    apply();
    if (Math.abs(ns / f - 1) > 0.02) flashZoomRestore();
    if (!free) settle();
  };
  // restablecer (botón «n / N» o el de las cuatro flechas): vuelta rápida y animada al ajuste
  let restoreT = 0;
  const restore = () => {
    box.classList.remove('settle'); box.classList.add('restore'); fit();
    clearTimeout(restoreT); restoreT = setTimeout(() => box.classList.remove('restore'), 200);
  };
  zoomFit = fit; zoomBy = z => z === '0' ? restore() : zoomTo(s * (z === '+' ? 1.5 : 1 / 1.5));
  dlg.onclick = e => {
    if (e.target.closest('[data-zrot]')) return setZoomRot(!dlg.classList.contains('rot')); // se reajusta solo (ResizeObserver)
    const sb = e.target.closest('[data-zstep]');
    if (sb) return zoomStep(+sb.dataset.zstep);
    if (e.target.closest('[data-zmenu]')) return toggleZoomSlider();
    if (e.target.closest('[data-zfull]')) {
      // tocando una de las tres, esa; si no (teclado), la siguiente
      const zv = e.target.closest('[data-zv]'), v = zv ? +zv.dataset.zv : (zoomVer + 1) % ZOOM_VERS.length;
      if (v === zoomVer) return;
      setZoomVer(v); showZoomTip();
      // la otra versión se abre ajustada (100 %): mientras se trae, la vista vuelve deprisa a ese ajuste, para que el
      // cambio tenga continuidad (si ya estaba ajustada, se cambia sin esperar)
      const file = zoomHost.querySelector('.dg')?.dataset.svg;
      if (zoomVer && file) loadSvg(verFile(file)).catch(() => {});
      const [ox, oy, os] = [x, y, s];
      box.classList.remove('settle'); box.classList.add('restore'); fit();
      if (Math.abs(ox - x) + Math.abs(oy - y) < 1 && Math.abs(os / s - 1) < 0.005) return openZoom(zoomHost, true);
      const host = zoomHost;
      setTimeout(() => { if (dlg.open && zoomHost === host) openZoom(host, true); }, 120);
      return;
    }
    if (e.target.closest('[data-zfold]')) {
      const f = cap.classList.toggle('folded');
      e.target.closest('[data-zfold]').setAttribute('aria-label', f ? 'Mostrar la descripción' : 'Ocultar la descripción');
      settle(); return; // el pie cambia de alto: el esquema conserva su zoom (solo se recoloca si hace falta)
    }
    const b = e.target.closest('[data-z]');
    if (b) { const z = b.dataset.z; if (z === '0') restore(); else zoomTo(s * (z === '+' ? 1.5 : 1 / 1.5)); return; }
    if (!e.target.closest('#zoom-slider')) toggleZoomSlider(false); // tocar fuera cierra el control de zoom
  };
  // control de zoom vertical (como el del volumen): del 50 % (abajo) a ×10 (arriba), en escala logarítmica; el 100 %
  // (ajustado a la pantalla) queda algo por encima de la base
  range.oninput = () => zoomTo(fitScale() * zoomAt(+range.value), undefined, undefined, true);
  range.onchange = () => settle(); // al soltar la barra
  // punto del visor bajo el dedo o el cursor, en las coordenadas del dibujo (también con el visor girado)
  const rel = e => {
    const r = dlg.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    return dlg.classList.contains('rot') ? [sy, r.width - sx] : [sx, sy];
  };
  // rueda del ratón o trackpad: zoom en el punto del cursor
  let wheelT = 0;
  st.onwheel = e => {
    e.preventDefault(); box.classList.remove('settle', 'restore');
    zoomTo(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), ...rel(e), true);
    clearTimeout(wheelT); wheelT = setTimeout(settle, 180);
  };
  // doble clic o doble toque: ampliar ahí ×2,5; si ya está ampliado, volver a ajustar
  const dbl = (cx, cy) => zoomTo(s > fitScale() * 1.05 ? fitScale() : fitScale() * 2.5, cx, cy);
  let lastType = 'mouse';
  st.ondblclick = e => { if (lastType !== 'touch') dbl(...rel(e)); };
  // un dedo (o el ratón): arrastrar; dos dedos: pellizcar para ampliar o reducir, y desplazar a la vez
  const pts = new Map();
  let pinch = null, drag = null, lastTap = 0;
  st.onpointerdown = e => {
    if (e.button !== 0) return;
    lastType = e.pointerType;
    try { st.setPointerCapture(e.pointerId); } catch { /* puntero ya levantado */ }
    pts.set(e.pointerId, e);
    box.classList.remove('settle', 'restore'); clearTimeout(settleT);
    if (pts.size === 1) { const [px, py] = rel(e); drag = { x: px, y: py, bx: x, by: y, moved: false }; pinch = null; }
    else { drag = null; pinch = null; }
    st.classList.add('dragging');
  };
  st.onpointermove = e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const [cx, cy] = rel({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
      if (!pinch) pinch = { d, s, cx, cy };
      else { x += cx - pinch.cx; y += cy - pinch.cy; pinch.cx = cx; pinch.cy = cy; zoomTo(pinch.s * d / pinch.d, cx, cy, true); }
    } else if (drag) {
      const [px, py] = rel(e), dx = px - drag.x, dy = py - drag.y;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      const b = bounds();
      x = rubber(drag.bx + dx, b.xlo, b.xhi); y = rubber(drag.by + dy, b.ylo, b.yhi); apply();
    }
  };
  st.onpointerup = st.onpointercancel = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size) return;
    st.classList.remove('dragging');
    if (e.type === 'pointerup' && e.pointerType === 'touch' && drag && !drag.moved) { // doble toque
      const now = Date.now();
      if (now - lastTap < 320) { dbl(...rel(e)); lastTap = 0; } else lastTap = now;
    }
    drag = null;
    settle(); // al soltar: si la pantalla ha quedado casi vacía, el dibujo vuelve
  };
  fit();
  // al abrir el visor, la etiqueta de la versión sale sobre el interruptor, para indicar qué la cambia
  if (zoomOpening) { zoomOpening = false; showZoomTip(); }
}
// Girar a horizontal: el visor entero (dibujo, pie y barra) gira 90°, como si se girase el móvil hacia la
// izquierda, sin depender del giro automático ni del sensor. Solo dos posiciones; al cerrar el visor vuelve a
// vertical (no se recuerda): fuera del visor nada cambia.
function setZoomRot(on) {
  const dlg = $('#zoom'), b = dlg.querySelector('[data-zrot]');
  dlg.classList.toggle('rot', on);
  const label = on ? 'Volver a vertical' : 'Girar a horizontal';
  b.setAttribute('aria-label', label); b.title = label;
}
$('#zoom').addEventListener('close', () => { setZoomRot(false); toggleZoomSlider(false); setZoomVer(0); $('#zoom-caption').classList.remove('folded'); });
// al girar el móvil o cambiar el tamaño de la ventana, volver a ajustar a la pantalla
new ResizeObserver(() => { if ($('#zoom').open) zoomFit?.(); }).observe($('#zoom-stage'));
document.addEventListener('keydown', e => {
  const dlg = $('#zoom');
  if (!dlg.open) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); zoomStep(e.key === 'ArrowRight' ? 1 : -1); }
  else if (e.key === '+' || e.key === '-' || e.key === '0') { e.preventDefault(); zoomBy?.(e.key); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-zoom]');
  if (b && b.querySelector('.dg[data-state="ok"]')) openZoom(b);
});

/** Etiqueta del pie con su código («Esquema MX1.4», «Mapa conceptual NC2», «Trayectoria MX») y el resto del pie.
 *  Si el pie ya empieza diciendo lo que es («Esquema.», «Línea temporal.», «Mapa conceptual del volumen.»…), el
 *  código va tras esa palabra; si no, delante, con el tipo. */
function figTag(f) {
  const c = f.caption || '';
  if (!f.code) return ['', c];
  const m = c.match(/^(Esquema|Línea temporal|Mapa conceptual(?: del volumen| del número)?|Mapa transversal)\.\s*/);
  if (m) return [`${/^Mapa conceptual/.test(m[1]) ? 'Mapa conceptual' : m[1]} ${f.code}`, c.slice(m[0].length)];
  return [`${f.type || 'Esquema'} ${f.code}`, c];
}

export function figure(f) {
  if (!f) return '';
  // La proporción del viewBox reserva el hueco mientras llega el SVG (sin saltos de maquetación)
  const vb = (f.viewBox || '').split(/\s+/).map(Number);
  const ratio = vb.length === 4 && vb[2] > 0 && vb[3] > 0 ? `aspect-ratio:${vb[2]}/${vb[3]}` : 'min-height:200px';
  const label = f.aria_label || f.caption || 'Esquema';
  const [tag, rest] = figTag(f);
  const cap = tag ? `${tag}.${rest ? ' ' + rest : ''}` : f.caption || '';
  return `<figure class="diagram">
    <button type="button" data-zoom data-caption="${esc(cap)}" data-tag="${esc(tag)}" data-rest="${esc(tag ? rest : cap)}" data-code="${esc(f.code || '')}" data-type="${esc(f.type || '')}"${f.code === 'CC' ? ' data-onlyfull' : ''} aria-label="Ampliar esquema: ${esc(label)}">
      <div class="dg" data-svg="${esc(f.file)}" style="${ratio}" role="img" aria-label="${esc(label)}"></div>
    </button>
    ${cap ? `<figcaption>${tag ? `<b class="fig-tag">${esc(tag)}</b>.${rest ? ' ' + esc(rest) : ''}` : esc(cap)}</figcaption>` : ''}
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

/** Revista a la que pertenece la pantalla (volumen, número, artículo, portada o síntesis de la revista), o ''. */
function pubOfRoute(here) {
  const curVol = currentVolKey(here), path = here.split('?')[0];
  return curVol ? (curVol.startsWith('n') ? 'nuevo-ciclo' : 'marx-xxi')
    : (path.match(/^#\/(marx-xxi|nuevo-ciclo)\b/) || [])[1]
      || (/^#\/tesis(\/|$)/.test(path) ? (/^[a-z]/.test(path.split('/')[2] || '') ? path.split('/')[2] : 'marx-xxi') : '');
}

// La lupa de la barra lleva a la búsqueda con la revista de la pantalla actual ya marcada
document.addEventListener('click', e => {
  const a = e.target.closest('a[href="#/buscar"]:not(.m-link)');
  if (!a || lib().pubs.length < 2) return;
  const pub = pubOfRoute(location.hash || '#/');
  if (!pub) return;
  e.preventDefault();
  location.hash = `#/buscar?p=${pub}`;
});

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
  const curPub = pubOfRoute(here);
  const openIf = cond => cond ? ' open' : '';
  const inSection = routes => routes.some(r => path === r || path.startsWith(r + '/'));
  // separadores entre bloques del menú; entre las dos revistas no hay
  const pubs = L.pubs.map((p, i) => `<details class="m-pub${i === 0 ? ' m-sep' : ''}"${openIf(p.id === curPub)}>
    <summary class="m-group">${esc(p.name)}</summary>
    ${link(p.home, `${esc(p.name)}: La publicación`, ICON.shelf)}
    ${vols(p)}
    ${link(thesesHref(p), 'Síntesis de la publicación', ICON.hub)}
  </details>`).join('');
  return `
    <details class="m-pub"${openIf(path === '#/' || path === '' || inSection(['#/lista']))}><summary class="m-group">Biblioteca</summary>
    ${link('#/', 'Colección', ICON.home)}
    ${last ? link(`#/leer/${last.a.id}`, `Seguir leyendo<small>${esc(last.a.title)}</small>`, ICON.book) : ''}
    ${link('#/lista', 'Mi lista de lectura', ICON.list)}
    </details>
    ${pubs}
    <details class="m-pub m-sep"${openIf(inSection(['#/sintesis', '#/tesis', '#/glosario', '#/mapas', '#/autores', '#/buscar', '#/marcadores']))}><summary class="m-group">Estudio</summary>
    <details class="m-subgroup"${openIf(inSection(['#/sintesis', '#/tesis']))}><summary class="m-link">${ICON.hub}<span>Síntesis</span></summary>
    ${L.pubs.map(p => link(thesesHref(p), `${esc(p.name)}: Síntesis`)).join('')}
    ${L.synthesis ? link('#/sintesis', 'Síntesis de la colección') : ''}
    </details>
    ${link('#/mapas', 'Mapas conceptuales', ICON.map)}
    ${link('#/glosario', 'Glosario', ICON.az)}
    ${link('#/autores', 'Autores', ICON.people)}
    ${link('#/buscar', 'Búsqueda', ICON.search)}
    ${link('#/marcadores', 'Marcadores', ICON.mark)}
    </details>
    <details class="m-pub m-sep"${openIf(inSection(['#/acerca', '#/creditos']))}><summary class="m-group">Aplicación</summary>
    ${link('#/acerca', 'Acerca de', ICON.info)}
    ${link('#/creditos', 'Créditos', ICON.people)}
    <a class="m-link" href="${REPO_URL}" target="_blank" rel="noopener">${ICON.code}<span>GitHub</span></a>
    ${link('#/acerca/instalar', 'Instalar y usar sin conexión', ICON.download)}
    </details>`;
}

// Con una ventana abierta (menú, ventanas del lector, avisos, opciones de la leyenda), arrastrar o usar la rueda fuera
// de lo que se puede desplazar dentro de ella no mueve la página de detrás.
function blockBehind(e) {
  const layer = document.querySelector('.lg-pick-wrap') || [...document.querySelectorAll('dialog[open]')].pop();
  if (!layer || layer.classList.contains('zoom')) return; // el visor gestiona sus propios gestos
  // las barras deslizantes (tamaño, interlineado…): en Safari (iPad, iPhone) cancelar el touchmove las bloquea
  if (e.target.closest?.('input[type=range]')) return;
  for (let el = e.target; el && el !== layer.parentElement; el = el.parentElement) {
    if (el === layer) break;
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) return; // se desplaza dentro
  }
  if (e.cancelable) e.preventDefault();
}
addEventListener('wheel', blockBehind, { passive: false });
addEventListener('touchmove', blockBehind, { passive: false });

export function openMenu() {
  const d = $('#menu');
  $('#menu-body').innerHTML = menuHtml();
  d.showModal(); // siempre con los volúmenes plegados
  d.focus(); // el foco, en el menú y no en «Lector de Marx XXI» (en iPad se veía recuadrado)
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
/** Despliega o pliega un <details> animando su altura (Web Animations: funciona en Safari, iPad y iPhone, donde
 *  ::details-content no se anima). Si se toca otra vez a medias, sigue desde la altura en que estaba. */
function animateDetails(d, open) {
  const sum = d.querySelector(':scope > summary');
  const from = d.getBoundingClientRect().height; // con la animación en curso, la altura de ese momento
  d._anim?.cancel();
  d.open = true;
  const to = open ? d.offsetHeight : sum.offsetHeight + d.offsetHeight - d.clientHeight;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { d.style.overflow = ''; d.open = open; return; }
  d.style.overflow = 'hidden';
  const anim = d._anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 180, easing: 'ease' });
  const done = () => { if (d._anim !== anim) return; d._anim = null; anim.cancel(); d.style.overflow = ''; d.open = open; };
  anim.onfinish = done;
  setTimeout(done, 400); // por si la animación no avanza ni avisa (pestaña oculta)
}
// Desplegar y plegar animado; acordeón: al desplegar una rama se pliegan sus hermanas del mismo nivel (secciones,
// volúmenes…). Va después del manejador de los títulos de volumen (que, fuera de la flecha, navega y cancela el clic).
$('#menu').addEventListener('click', e => {
  const sum = e.target.closest('#menu summary');
  if (!sum || e.defaultPrevented) return;
  const d = sum.parentElement;
  if (!(d instanceof HTMLDetailsElement)) return;
  e.preventDefault();
  const open = d._anim ? !d._target : !d.open;
  d._target = open;
  animateDetails(d, open);
  if (open) for (const x of d.parentElement.children) {
    if (x !== d && x instanceof HTMLDetailsElement && (x._anim ? x._target : x.open)) { x._target = false; animateDetails(x, false); }
  }
});

const minutes = w => Math.max(1, Math.round(w / 230));
const pct = p => Math.round((p || 0) * 100);
const paras = list => list.map(p => `<p>${esc(p)}</p>`).join('');
/** Pestañas; `primary` marca la principal (Artículos en el volumen, Texto completo en el artículo). */
function tabs(base, names, current, primary = -1) {
  return `<nav class="tabs" aria-label="Secciones">${names.map((n, i) => n == null ? '' : // null: pestaña que no aplica
    `<a href="${base}/${i}"${i === primary ? ' class="primary"' : ''}${i === current ? ' aria-current="page"' : ''}>${n.html ?? esc(n)}</a>`).join('')}</nav>`;
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

/** Barra de progreso de lectura con el porcentaje a su lado. */
const progressBar = (p, cls = '') => `<div class="progress-row"><div class="progress${cls ? ' ' + cls : ''}"><i style="width:${pct(p)}%"></i></div><span class="pct">${pct(p)} %</span></div>`;

/** Tarjeta de volumen o número, con progreso de lectura. */
function volCard(v, read, pos) {
  const done = v.articles.filter(a => read.has(a.id)).length;
  const avg = v.articles.reduce((s, a) => s + store.reached(a.id), 0) / v.articles.length;
  const n = v.articles.length;
  const what = n === 1 ? 'artículo' : 'artículos';
  return `<a class="card vol-card" href="${v.href}" data-vol="${v.key}">
    ${coverHtml(v, done === n)}
    <div class="vc-body">
      <div class="eyebrow">${v.label ? `${esc(v.label)} · ${esc(monthName(v.month))}` : `Volumen ${v.number}${v.year ? ' · ' + v.year : ''}`}</div>
      <h3>${esc(v.label ? v.subtitle || v.title : v.title)}</h3>
      <div class="meta"><span>${n} ${what}</span>${done ? `<span class="check">✓ ${done} leídos</span>` : ''}</div>
      ${avg > 0 ? progressBar(avg) : ''}
    </div>
  </a>`;
}

/** Tarjeta «Seguir leyendo» del último texto abierto. */
function continueCard() {
  const lastId = store.last(), last = lastId && (lastId.startsWith('tomo-') ? null : article(lastId));
  if (!last) return '';
  const p = store.reached(last.a.id);
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
  const read = store.read(), pend = store.list().filter(x => !read.has(x.id) && article(x.id)).length; // Mi lista: pendientes
  // en móvil el aviso se puede plegar; se recuerda por página solo durante la sesión (sessionStorage)
  const abKey = 'mx.about.' + (p ? p.id : 'coleccion');
  let folded = false;
  try { folded = sessionStorage.getItem(abKey) === '0'; } catch { /* sin almacenamiento: desplegado */ }
  return `<h2 class="sec-title">Herramientas de estudio</h2>
    <div class="grid two">
      <div class="about-banner${folded ? ' folded' : ''}" data-ab-key="${abKey}">
        ${toolCard('#/acerca', 'info', 'Acerca de', 'Las revistas, la IA y la aplicación')}
        <p>El objetivo de esta aplicación es divulgativo: facilitar la lectura y el subrayado en dispositivos digitales del contenido publicado por Marx XXI.
        Siempre se recomienda el apoyo a su edición mediante la suscripción o la compra de los ejemplares físicos en
        <a href="https://marxxxi.com/" rel="noopener" target="_blank">Marx XXI</a>.<span class="p-gap"></span>
        Los resúmenes y esquemas que acompañan cada texto se han elaborado con Claude Fable 5.1, de Anthropic —uno de los modelos
        de IA más avanzados— como apoyo al estudio. No obstante, <strong>en ningún caso son sustitutos de la lectura de los textos completos</strong>,
        y han de analizarse críticamente a la luz de estos, pues podrían contener inexactitudes y errores.
        <button type="button" class="ab-toggle ab-less" data-ab-toggle>…menos</button></p>
        <button type="button" class="ab-toggle ab-more" data-ab-toggle>Mostrar más…</button>
      </div>
      ${toolCard(p ? `#/mapas/${L.pubs.indexOf(p) + 1}` : '#/mapas', 'map', 'Mapas conceptuales', 'Esquemas de artículos y publicaciones')}
      ${toolCard(p ? `#/glosario?p=${p.id}` : '#/glosario', 'az', 'Glosario', `${gl.length} conceptos`)}
      ${toolCard('#/autores', 'people', 'Autores', p ? `${au.length} firmas en ${esc(p.name)}` : `${au.length} firmas en ${L.pubs.length > 1 ? 'las dos revistas' : 'la revista'}`)}
      ${toolCard(p ? `#/buscar?p=${p.id}` : '#/buscar', 'search', 'Búsqueda', 'Guía y textos íntegros')}
      ${toolCard('#/marcadores', 'mark', 'Marcadores', 'Subrayados y notas propias')}
      ${toolCard('#/lista', 'list', 'Mi lista de lectura', pend ? `${pend} ${pend === 1 ? 'texto pendiente' : 'textos pendientes'}` : 'Pendientes y leídos')}
    </div>`;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-ab-toggle]');
  if (!t) return;
  const b = t.closest('.about-banner'), folded = b.classList.toggle('folded');
  try { sessionStorage.setItem(b.dataset.abKey, folded ? '0' : '1'); } catch { /* sin almacenamiento */ }
});

/** Pie de las portadas (colección y cada revista): solo los enlaces de referencia. */
const siteFoot = () => `<footer class="site-foot">
      <span>Edición original: <a href="https://marxxxi.com/" rel="noopener" target="_blank">Marx XXI</a> · <a href="#/acerca">Acerca de este lector</a> · <a href="#/creditos">Créditos</a></span>
    </footer>`;

// ---------------------------------------------------------------- vistas

/** Inicio: la biblioteca con sus publicaciones. */
function libraryView() {
  setBar('', { back: !!backHash() }); // flecha atrás si se llega desde otra pantalla (no al abrir la app)
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
      ${L.pubs.length > 1
        ? `<div class="lede sm col"><p>Dos revistas, un proyecto: Marx XXI fija el marco; Nuevo Ciclo lo pone a prueba cada trimestre.</p>
          <p>Lee, subraya y estudia en esta aplicación los textos íntegros facilitados por <a href="https://marxxxi.com/" rel="noopener" target="_blank">Marx XXI</a>. Apoya su edición suscribiéndote en la página oficial. <a class="btn lede-cta" href="https://marxxxi.com/pages/tipos-de-suscripciones" rel="noopener" target="_blank">Suscríbete →</a></p></div>`
        : `<p class="lede">${esc(L.pubs[0].cross_volume.lede || '')}</p>`}
    </section>
    ${continueCard()}
    <h2 class="sec-title">Publicaciones</h2>
    <div class="grid pubs">${L.pubs.map(pubCard).join('')}</div>
    ${studyTools()}
    ${S ? `<h2 class="sec-title">Síntesis de la colección</h2>
      <div class="prose synth-intro"><p>Marx XXI y Nuevo Ciclo son dos caras de un mismo proyecto: el primero fija el marco
        (qué es el marxismo, por qué no la socialdemocracia, el partido, el derecho a la revolución, la escala internacional)
        y el segundo lo pone a prueba en la coyuntura. La síntesis reúne las dos revistas en <b>${S.theses.length} tesis comunes</b>,
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
      <a class="eyebrow ph-pub" href="#/">Colección</a>
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
    ${siteFoot()}
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
    body = `<div class="eyebrow">Resumen de la presentación</div><div class="prose indent" style="margin-top:10px">${paras(v.presentation)}</div>
      ${v.presentation_text ? `<a class="btn ghost block" href="#/leer/tomo-${v.number}">${ICON.book}${v.number === 5 ? 'Leer la nota introductoria completa' : 'Leer la presentación completa'}</a>` : ''}`;
  } else if (tab === 1) {
    body = `<p class="muted small">Índice en el orden de la revista. Abre la guía de cada artículo o ve directamente al texto íntegro.</p>` +
      v.articles.map(a => {
        const p = store.reached(a.id);
        return `<div class="card art-card">
          <div class="art-main">
            <div class="row-actions"><span class="eyebrow vol">${artLabel(a)}</span><span class="muted" style="font-size:15px">≈ ${minutes(a.word_count)} min</span><span class="grow"></span>${read.has(a.id) ? '<span class="check">✓ leído</span>' : ''}</div>
            <h3><a href="#/articulo/${a.id}" style="color:inherit;text-decoration:none">${esc(a.title)}</a></h3>
            <div class="muted small">${esc(byline(a))}</div>
            <div class="art-sum">
              ${a.summary[0] ? `<p class="small">${esc(a.summary[0])}</p>` : ''}
              ${p > 0 ? progressBar(p) : ''}
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
    // mismo rótulo que «Resumen de la presentación» en la pestaña Presentación
    body = `<div class="eyebrow" style="margin-bottom:10px">Conclusiones del ${esc(p.unit.toLowerCase())}</div>` + v.conclusions.map((c, i) => `<details class="card thesis" id="conclusion-${i + 1}">
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
</div>
      ${v.cover ? `<div class="ph-cover">${coverHtml(v)}</div>` : ''}
      ${headNav(
        // antes del primero, la portada de la revista («Inicio»); después del último, sus conclusiones comunes
        prev ? { href: `${prev.href}/${tab}`, label: volShort(prev), tip: volHead(prev), vol: prev.key }
          : { href: p.home, label: 'Inicio', tip: `Portada de ${p.name}`, vol: v.key, neutral: true },
        next ? { href: `${next.href}/${tab}`, label: volShort(next), tip: volHead(next), vol: next.key }
          : { href: thesesHref(p), label: 'Concl.', tip: `${p.name}: Síntesis`, vol: v.key, neutral: true },
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
    ? `<a class="hn-${dir}${x.title ? '' : ' hn-short'}${x.neutral ? ' hn-neutral' : ''}" href="${x.href}" data-vol="${x.vol}" title="${esc(x.tip || x.title)}">
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
/** Última pestaña de la guía, solo en la página del artículo (no en la hoja «Guía» del lector): sus marcadores. */
const MARKS_TAB = ART_TABS.length;

/** Contenido de las pestañas de guía (también se usa en la hoja «Guía» del lector). */
/** Aviso breve de que la guía está elaborada con IA (Claude), con enlace a los créditos. */
export function aiNote() {
  const t = lib().about?.ai_short || 'Guía elaborada con Claude (IA).';
  // primera frase (qué se ha hecho con IA) y, en negrita, la advertencia; cada una en su línea
  const i = t.indexOf('. ') + 1, head = i ? t.slice(0, i) : t, warn = i ? t.slice(i + 1) : '';
  return `<p class="ai-note">${ICON.info}<span>${esc(head)}${warn ? `<br><strong>${esc(warn)}</strong>` : ''}<br><a href="#/acerca">Más información</a></span></p>`;
}

export function guideTab(a, tab) {
  return guideTabBody(a, tab) + (tab >= 0 && tab < ART_TABS.length && tab !== TAB.texto ? aiNote() : '');
}

function guideTabBody(a, tab) {
  switch (tab) {
    case TAB.resumen: return `<div class="prose indent">${paras(a.summary)}</div>
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

function articleView(id, tab = 0, params = null) {
  const hit = article(id);
  if (!hit) return notFound();
  const { v, a } = hit;
  setBar(`${volShort(v).replace(/^Vol\./, 'Volumen')} · ${artLabel(a)}`, { up: v.href });
  const p = store.reached(a.id), started = !!store.position(a.id);
  const { prev, next } = neighbours(a.id);
  let body;
  if (tab === TAB.texto) {
    body = `<div class="card">
      <div class="eyebrow">Texto íntegro del artículo</div>
      <p style="margin:8px 0 2px">${a.word_count.toLocaleString('es')} palabras · ${minutes(a.word_count)} min de lectura</p>
      <div class="muted small">${esc(volName(v))}${v.label ? '' : ' · ' + esc(v.title)}${a.pdf_pages ? ` — Páginas ${a.pdf_pages.from}–${a.pdf_pages.to}` : ''}</div>
      ${v.url ? `<div class="muted small"><a href="${esc(v.url)}" target="_blank" rel="noopener">PDF disponible en marxxxi.com</a></div>` : ''}
      ${a.printed_pages && v.label ? `<div class="muted small">En la revista impresa: páginas ${a.printed_pages.from}–${a.printed_pages.to}</div>` : ''}
      <div style="display:grid;gap:8px;margin-top:16px">
        <a class="btn block" href="#/leer/${a.id}">${ICON.book}${started ? `Seguir leyendo (${pct(p)} % leído)` : 'Abrir en modo lectura'}</a>
        ${started || store.read().has(a.id) ? `<button type="button" class="btn ghost block" data-restart="${a.id}">Empezar desde el principio</button>` : ''}
      </div>
      <p class="muted small" style="margin:14px 0 0">En el modo lectura puedes cambiar la fuente, el tamaño, el interlineado, los márgenes y el tema, guardar marcadores, buscar en el texto y consultar la guía sin perder la posición.</p>
    </div>`;
  } else if (tab === MARKS_TAB) {
    const all = store.highlights(a.id).sort((x, y) => x.b0 - y.b0 || x.o0 - y.o0);
    const c = params?.get('c') || '', items = c ? all.filter(h => h.color === c) : all;
    body = all.length ? `${hlFilterBar(all, c, id => `a href="#/articulo/${a.id}/${MARKS_TAB}${id ? '?c=' + id : ''}"`)}<div class="art-marks bm-panel">
        <p class="muted small" style="margin-top:0">${items.length} ${items.length === 1 ? 'pasaje subrayado' : 'pasajes subrayados'} en este texto, en su orden. Toca uno para ir a él en el modo lectura.</p>
        ${items.map(hlItem).join('')}</div>`
      : `<div class="empty">Aún no hay marcadores en este texto.<br>En el modo lectura, <b>selecciona un pasaje</b> y elige un color para subrayarlo; toca después el subrayado para escribir una nota propia.</div>`;
  } else body = guideTab(a, tab);
  return `<div class="wrap has-fab" data-vol="${v.key}">
    <header class="page-head with-aside vol-head art-band"><div class="ph-main">
      <a class="eyebrow ph-pub" href="${v.pub.home}">${esc(v.pub.name)}</a>
      <a class="eyebrow vol ph-vol" href="${v.href}">${esc(volHead(v).replace(v.pub.name + ' ', ''))}</a>
      <div class="eyebrow vol ph-art">${isInterview(a) ? 'Entrevista' : `Artículo ${a.number}`}</div>
      <h1>${esc(a.title)}</h1><div class="by">${esc(byline(a))}</div>
      ${a.interviewee ? `<div class="muted small">${esc(a.author)}</div>` : ''}
      ${listBtn(a.id)}</div>
      ${(() => {
        // paso dentro del volumen o número: antes del primero, el propio volumen; después del último, sus conclusiones
        const i = v.articles.indexOf(a), pa = v.articles[i - 1], na = v.articles[i + 1];
        const toVol = { href: v.href, label: volShort(v), tip: volHead(v), vol: v.key };
        const toConcl = { href: `${v.href}/2`, label: 'Concl.', tip: `Conclusiones · ${volHead(v)}`, vol: v.key };
        const toArt = x => ({ href: `#/articulo/${x.id}/${tab}`, label: artLabel(x), tip: x.title, vol: v.key });
        // en el móvil, «Añadir a Mi lista» va en la misma línea que el paso entre artículos (copia de la de .ph-main)
        return `<div class="ph-navrow">${listBtn(a.id)}${headNav(pa ? toArt(pa) : toVol, na ? toArt(na) : toConcl, 'Artículos contiguos')}</div>`;
      })()}</header>
    ${tabs(`#/articulo/${a.id}`, [...ART_TABS, { html: `<span class="tab-marks">${ICON.mark}<i>Marcadores</i></span>` }], tab, TAB.texto)}
    ${body}
    ${tab !== TAB.texto ? relatedPanel(a) : ''}
    <nav class="neighbours" aria-label="Artículos contiguos">
      ${prev ? neighbourLink(prev, 'prev', tab) : '<span></span>'}
      ${next && article(next.id)?.v === v ? neighbourLink(next, 'next', tab) : conclusionsLink(v)}
    </nav>
  </div>
  <a class="btn fab" href="#/leer/${a.id}" data-vol="${v.key}">${ICON.book}${started ? 'Seguir leyendo' : 'Leer texto completo'}</a>`;
}

/** Tras el último artículo no se pasa al volumen o número siguiente: se va a sus conclusiones. */
function conclusionsLink(v) {
  return `<a class="next" href="${v.href}/2" data-vol="${v.key}">
    <small>Siguiente →</small>
    <span class="nb-vol">${esc(volHead(v))}</span>
    <span class="nb-title">Conclusiones</span>
    <span class="nb-author">${v.conclusions.length} conclusiones</span>
  </a>`;
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

/** Botón «Añadir a Mi lista» de la cabecera de la guía; si el texto ya está en la lista, «En Mi lista» (y quita). */
function listBtn(id) {
  const on = store.inList(id);
  return `<button type="button" class="ph-list" data-list="${esc(id)}" aria-pressed="${on}" title="${on ? 'Quitar de Mi lista' : 'Añadir a Mi lista de lectura'}">${on ? ICON.listOn : ICON.list}<span>${on ? 'En Mi lista' : 'Añadir a Mi lista'}</span></button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-list]'); if (!b) return;
  const id = b.dataset.list;
  if (!store.inList(id)) {
    store.addToList(id);
    redrawList(id);
    toast(`Añadido a Mi lista: ${store.read().has(id) ? 'Leídos' : 'Pendientes'}`);
    return;
  }
  // quitar: con el mismo aviso que desde Mi lista
  confirmUnlist(id, () => redrawList(id));
});
/** Vuelve a pintar los botones de Mi lista de un texto (en la guía hay dos: escritorio y móvil). */
const redrawList = id => document.querySelectorAll(`[data-list="${CSS.escape(id)}"]`).forEach(x => { x.outerHTML = listBtn(id); });
/** Confirma y quita un texto de Mi lista; luego `after` (redibujar) y el aviso. */
function confirmUnlist(id, after) {
  const a = article(id)?.a;
  confirmDialog({
    title: 'Quitar de Mi lista', text: `${a ? `«${a.title}»` : 'El texto'} dejará de aparecer en tu lista de lectura.
El progreso, los subrayados y las notas se conservan.`,
    ok: 'Quitar', cancel: 'Cancelar', danger: true,
  }).then(yes => { if (yes) { store.removeFromList(id); after?.(); toast('Quitado de Mi lista'); } });
}

const LIST_TABS = ['Pendientes', 'Leídos'];
/** Mi lista de lectura (#/lista[/1]): los textos añadidos desde su guía. Pendientes, numerados en el orden elegido
 *  (los primeros añadidos arriba; se pueden reordenar); Leídos, del más reciente al más antiguo. */
function listView(tab = 0) {
  setBar('Mi lista de lectura');
  tab = tab === 1 ? 1 : 0;
  let reorder = false;
  const fmtDate = t => t ? new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const row = (x, i, n, done) => {
    const { v, a } = x.hit, p = store.reached(a.id);
    return `<li class="rl-item" data-vol="${v.key}" data-id="${a.id}">
      <span class="rl-num" aria-hidden="true">${i + 1}.º</span>
      <a class="rl-main" href="#/articulo/${a.id}">
        <div class="eyebrow vol">${esc(volName(v))} · ${esc(artLabel(a))}</div>
        <h3>${esc(a.title)}</h3><div class="muted small">${esc(byline(a))}</div>
        ${a.summary[0] ? `<p class="rl-sum small">${esc(a.summary[0])}</p>` : ''}
        ${done ? `<div class="rl-when">Leído el ${esc(fmtDate(x.at))}</div>` : p > 0 ? progressBar(p) : ''}
      </a>
      <div class="rl-actions">
        ${done ? '' : `<button type="button" class="icon-btn rl-move" data-move="-1" aria-label="Subir"${i === 0 ? ' disabled' : ''}>${ICON.up}</button>
        <button type="button" class="icon-btn rl-move" data-move="1" aria-label="Bajar"${i === n - 1 ? ' disabled' : ''}>${ICON.down}</button>`}
        <button type="button" class="icon-btn rl-del" data-unlist="${a.id}" aria-label="Quitar de la lista">${ICON.x}</button>
      </div>
    </li>`;
  };
  const body = () => {
    const read = store.read();
    const items = store.list().map(x => ({ ...x, hit: article(x.id) })).filter(x => x.hit);
    if (tab === 1) {
      const done = items.filter(x => read.has(x.id)).map(x => ({ ...x, at: store.readAt(x.id) })).sort((a, b) => b.at - a.at);
      return done.length ? `<div class="rl-bar"><span class="muted">${done.length} ${done.length === 1 ? 'texto leído' : 'textos leídos'}, el más reciente primero</span></div>
        <ol class="rl">${done.map((x, i) => row(x, i, done.length, true)).join('')}</ol>`
        : `<div class="empty">Todavía no has terminado ningún texto de tu lista.<br>Un texto pasa a «Leídos» al llegar al final en el modo lectura.</div>`;
    }
    const pending = items.filter(x => !read.has(x.id));
    return pending.length ? `<div class="rl-bar">
        <span class="muted">${pending.length} ${pending.length === 1 ? 'texto pendiente' : 'textos pendientes'}</span>
        ${pending.length > 1 ? `<button type="button" class="chip" data-reorder aria-pressed="${reorder}">${reorder ? 'Listo' : 'Reordenar'}</button>` : ''}
      </div>
      ${reorder ? '<p class="muted small rl-hint">Sube o baja cada texto con las flechas.</p>' : ''}
      <ol class="rl${reorder ? ' reorder' : ''}">${pending.map((x, i) => row(x, i, pending.length, false)).join('')}</ol>`
      : `<div class="empty">Aún no hay textos pendientes.<br>En la cabecera de la guía de cada artículo, toca <b>Añadir a Mi lista</b>: los textos se van añadiendo al final, en el orden en que los eliges.</div>`;
  };
  const html = `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Biblioteca</div><h1>Mi lista de lectura</h1>
      <div class="sub">Los textos que quieres leer, en el orden que elijas. Cuando termines uno, pasa a «Leídos».</div><p class="muted small data-tip">Tu lista se guarda solo en este navegador: <a href="#/acerca/datos">expórtala</a> para no perderlos o pasarla a otro dispositivo.</p></header>
    ${tabs('#/lista', LIST_TABS, tab)}
    <div id="rl-body">${body()}</div>
  </div>`;
  return [html, () => {
    const redraw = () => { $('#rl-body').innerHTML = body(); };
    const onClick = e => {
      const re = e.target.closest('[data-reorder]');
      if (re) { reorder = !reorder; redraw(); $('[data-reorder]')?.focus(); return; }
      const mv = e.target.closest('[data-move]');
      if (mv) {
        const id = mv.closest('[data-id]').dataset.id, by = +mv.dataset.move;
        const ids = [...view.querySelectorAll('.rl [data-id]')].map(li => li.dataset.id);
        const i = ids.indexOf(id), j = i + by;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        store.reorderList(ids);
        redraw();
        view.querySelector(`[data-id="${id}"] [data-move="${by}"]:not([disabled])`)?.focus();
        return;
      }
      const del = e.target.closest('[data-unlist]');
      if (del) {
        confirmUnlist(del.dataset.unlist, redraw);
      }
    };
    view.addEventListener('click', onClick);
    return () => view.removeEventListener('click', onClick); // si no, cada visita sumaría un manejador
  }];
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
        ${t.where ? (wl => wl.length
          // los botones ya dicen dónde aparece; la referencia en texto solo si no se ha podido enlazar
          ? `<div class="chips">${wl.map(([label, href]) => `<a class="chip" href="${href}">${esc(label)}</a>`).join('')}</div>`
          : `<p class="muted small" style="margin:10px 0 0;font-style:italic">${esc(t.where)}</p>`)(whereLinks(t.where, p)) : ''}</div>
      </details>`).join('')}
      ${lib().synthesis ? `<p class="small" style="margin-top:20px"><a href="#/sintesis/1">Cómo se alinean estas tesis con las de la otra revista: síntesis de la colección →</a></p>` : ''}`
    : `${cv.map ? figure(cv.map) + '<p class="muted small">Toca el mapa para ampliarlo.</p>' : '<p class="empty">Esta revista no tiene mapa común.</p>'}`;
  const html = `<div class="wrap">
    <header class="page-head with-aside"><div class="ph-main"><a class="eyebrow ph-pub" href="${p.home}">${esc(p.name)}</a><h1>${esc(p.name)}: Síntesis</h1>
    <div class="sub">${cv.theses.length} tesis comunes a los ${n} ${esc(p.unit_plural)} y su mapa conceptual.</div></div>
      ${(() => {
        // final del recorrido por volúmenes o números: antes, el último; después, «Inicio» (portada de la revista)
        const last = p.volumes[p.volumes.length - 1];
        return headNav(last ? { href: `${last.href}/1`, label: volShort(last), tip: volHead(last), vol: last.key } : null,
          { href: p.home, label: 'Inicio', tip: `Portada de ${p.name}`, vol: last?.key || '', neutral: true }, 'Recorrido de la revista');
      })()}</header>
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

// Pestañas como en Mapas conceptuales: #/glosario/0 Toda la colección, /1… cada revista, la última Puentes
// (también vale ?p=marx-xxi o ?p=puentes, de enlaces anteriores); dentro de una revista, un botón por volumen
// o número (?v=), en una línea fija debajo de la barra de pestañas. El buscador, encima de las pestañas (en la cabecera).
function glossaryView(params, tabArg) {
  setBar('Glosario');
  const L = lib();
  const multi = L.pubs.length > 1, bridgeTab = L.pubs.length + 1;
  const pp = params.get('p');
  let tab = !multi ? 1 : tabArg != null ? Math.max(0, Math.min(bridgeTab, +tabArg || 0))
    : pp === 'puentes' ? bridgeTab : L.byId[pp] ? L.pubs.indexOf(L.byId[pp]) + 1 : 0;
  const bridges = tab === bridgeTab, pubId = tab && !bridges ? L.pubs[tab - 1].id : '';
  const P = L.byId[pubId];
  let vol = P?.volumes.some(v => v.key === params.get('v')) ? params.get('v') : '';
  const cur = on => `aria-selected="${on}" aria-pressed="${on}"${on ? ' aria-current="page"' : ''}`;
  const volNav = () => P ? `<nav class="tabs chip-tabs maps-sub-nav${multi ? '' : ' solo'}" role="tablist" aria-label="${esc(P.name)}">
      <button class="chip" role="tab" data-v="" ${cur(!vol)}>Todos</button>
      ${P.volumes.map(x => `<button class="chip" role="tab" data-v="${x.key}" data-vol="${x.key}" ${cur(x.key === vol)}>${esc(volShort(x))}</button>`).join('')}
    </nav>` : '';
  const html = `<div class="wrap">
    <header class="page-head"><h1>Glosario</h1><div class="sub">${L.glossary.length} conceptos definidos en ${multi ? 'los artículos de las dos revistas' : 'los artículos'}. Toca uno para ir a su artículo.${multi ? ' Los <b>conceptos puente</b> aparecen en las dos.' : ''}</div>
      <label class="field g-search">${ICON.search}<input id="g-q" type="search" placeholder="Buscar concepto o definición" value="${esc(params.get('q') || '')}" autocomplete="off"></label></header>
    ${multi ? tabs('#/glosario', ['Toda la colección', ...L.pubs.map(p => p.name), 'Puentes'], tab) : ''}
    ${volNav()}
    <div id="g-list-box">
      <div class="muted small" id="g-count"></div>
      <div id="g-list"></div>
    </div>
  </div>`;
  return [html, () => {
    const input = $('#g-q'), list = $('#g-list');
    const qs = () => {
      const q = new URLSearchParams();
      if (input.value) q.set('q', input.value);
      if (vol) q.set('v', vol);
      return q.toString() ? '?' + q : '';
    };
    // la búsqueda escrita se conserva al cambiar de pestaña
    const syncTabs = () => {
      for (const t of view.querySelectorAll('.tabs:not(.chip-tabs) a')) t.href = t.getAttribute('href').split('?')[0] + (input.value ? '?q=' + encodeURIComponent(input.value) : '');
      history.replaceState(history.state, '', `#/glosario${multi ? '/' + tab : ''}` + qs());
    };
    const render = () => {
      const q = input.value.trim(), f = fold(q);
      const items = L.glossary.filter(e => (!pubId || e.pub.id === pubId) && (!vol || e.v.key === vol) && (!bridges || e.bridge)
        && (!f || fold(e.c.term).includes(f) || fold(e.c.definition).includes(f)));
      $('#g-count').textContent = `${items.length} conceptos`;
      list.innerHTML = items.slice(0, 400).map(e => `<a class="list-item" href="#/articulo/${e.a.id}/${TAB.conceptos}" data-vol="${e.v.key}">
        <h3 style="font-weight:700"><span style="color:var(--vol)">▪</span> ${highlight(e.c.term, q)}${multi && e.bridge ? ' <span class="tag olive">puente</span>' : ''}</h3><p>${highlight(e.c.definition, q)}</p>
        <div class="src">${multi && !e.v.label ? 'Marx XXI · ' : ''}${esc(volName(e.v))} · ${esc(byline(e.a))} · ${esc(e.a.title)}</div></a>`).join('') || '<p class="empty">Sin resultados.</p>';
    };
    input.addEventListener('input', () => { render(); syncTabs(); });
    const onClick = e => {
      const b = e.target.closest('.maps-sub-nav [data-v]'); if (!b) return;
      // si las barras estaban fijas arriba, siguen fijas: la lista nueva empieza justo debajo de ellas
      const ty = artTabsY(), stuck = ty != null && scrollY >= ty - 1;
      vol = b.dataset.v;
      for (const c of b.parentElement.querySelectorAll('[data-v]')) { const on = c === b; c.setAttribute('aria-pressed', on); c.setAttribute('aria-selected', on); on ? c.setAttribute('aria-current', 'page') : c.removeAttribute('aria-current'); }
      render(); syncTabs();
      if (stuck) window.scrollTo(0, ty);
    };
    view.addEventListener('click', onClick);
    render(); syncTabs();
    return () => view.removeEventListener('click', onClick);
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
  // fuentes de cada revista en las tesis comunes: plegadas bajo su explicación
  const sourcesFor = (where, p) => {
    const n = p && where ? whereLinks(where, p).length : 0;
    return n ? `<details class="synth-src"><summary>Fuentes en ${esc(p.name)} (${n})</summary>${chipsFor(where, p)}</details>` : '';
  };
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
      ${t.principle ? `<div class="synth-col"><div class="eyebrow vol">Principio · Marx XXI</div><p>${esc(t.principle)}</p>${sourcesFor(t.where_marx_xxi, mx)}</div>` : ''}
      ${t.application ? `<div class="synth-col" data-vol="n1"><div class="eyebrow vol">Aplicación · Nuevo Ciclo</div><p>${esc(t.application)}</p>${sourcesFor(t.where_nuevo_ciclo, nc)}</div>` : ''}
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
    <header class="page-head"><div class="eyebrow">Colección</div><h1>Síntesis de la colección</h1>
      <div class="ph-subtitle">Marx XXI <span class="amp">·</span> Nuevo Ciclo</div>
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
function mapsView(params, tabArg) {
  setBar('Mapas conceptuales');
  const L = lib(), S = L.synthesis;
  // zl: qué esquema es (revista, volumen o número, artículo y título), antepuesto a su descripción al ampliarlo
  const titled = (title, f, href, zl = '', zhi = 0) => f ? `<div class="dg-item"${zl ? ` data-zlabel="${esc(zl)}" data-zhi="${zhi}"` : ''}>
    ${href ? `<a class="dg-title" href="${href}">${title}</a>` : `<div class="dg-title">${title}</div>`}${figure(f)}</div>` : '';
  // los dos mapas comunes de una revista: su mapa conceptual y su trayectoria
  // (en «Colección», con el nombre de la revista en el título)
  const common = (p, inCollection) => {
    const cv = p.cross_volume, n = `Los ${numWord(p.volumes.length)} ${p.unit_plural}`;
    return titled(inCollection ? `${esc(p.name)} · ${esc(n)}` : `Mapa conceptual · ${esc(n)}`, cv.map, thesesHref(p, 1), `${p.name} · Mapa conceptual · ${n}`)
      + titled(inCollection ? `Trayectoria de la publicación · ${esc(p.name)}` : 'Trayectoria de la publicación', cv.arc, p.home, `${p.name} · Trayectoria de la publicación`);
  };
  // un volumen o número: su mapa y los esquemas de sus artículos
  const volMaps = v => {
    const vn = `${v.label ? 'Número ' + v.label : 'Volumen ' + v.number} · ${v.articles.length} artículos`;
    return titled(`<b>${esc(vn.split(' · ')[0])}</b> · ${v.articles.length} artículos`, v.concept_map, `${v.href}/3`, vn, 1)
      + v.articles.filter(a => a.diagrams.length).map(a => {
        const zl = `${volShort(v)} · ${artLabel(a)} · ${a.title}`;
        return titled(`<b>${esc(artLabel(a))}</b> · ${esc(a.title)}<small>${esc(byline(a))}</small>`,
          a.diagrams[0], `#/articulo/${a.id}/${TAB.esquema}`, zl, 2)
          + a.diagrams.slice(1).map(d => `<div class="dg-item" data-zlabel="${esc(zl)}" data-zhi="2">${figure(d)}</div>`).join('');
      }).join('');
  };
  // Pestañas: Colección (el mapa de la colección y los dos comunes de cada revista) y una por revista; dentro de
  // cada revista, «La publicación» (sus dos mapas comunes) y un botón por volumen o número.
  // pestaña: #/mapas/0 Colección, #/mapas/1… cada revista (también vale ?p=marx-xxi, de enlaces anteriores)
  const tab = tabArg != null ? Math.max(0, Math.min(L.pubs.length, +tabArg || 0))
    : L.byId[params.get('p')] ? L.pubs.indexOf(L.byId[params.get('p')]) + 1 : 0;
  const pubId = tab ? L.pubs[tab - 1].id : '';
  let volKey = params.get('v') || '';
  const panel = () => {
    if (!pubId) return `<div class="dg-gallery two maps-coll">${S?.map ? titled('Mapa conceptual · La colección', S.map, '#/sintesis', 'Colección · Mapa conceptual') : ''}${L.pubs.map(p => common(p, true)).join('')}</div>`;
    const p = L.byId[pubId], v = p.volumes.find(x => x.key === volKey);
    if (!v) volKey = '';
    // botones en una sola línea, desplazable y con flechas como la barra de pestañas (initTabs), fija debajo de ella
    const cur = on => `aria-selected="${on}" aria-pressed="${on}"${on ? ' aria-current="page"' : ''}`;
    return `<nav class="tabs chip-tabs maps-sub-nav" role="tablist" aria-label="${esc(p.name)}">
        <button class="chip" role="tab" data-v="" ${cur(!v)}>La publicación</button>
        ${p.volumes.map(x => `<button class="chip" role="tab" data-v="${x.key}" data-vol="${x.key}" ${cur(x === v)}>${esc(volShort(x))}</button>`).join('')}
      </nav>
      <div class="dg-gallery"${v ? ` data-vol="${v.key}"` : ''}>${v ? volMaps(v) : common(p)}</div>`;
  };
  const html = `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Colección</div><h1>Mapas conceptuales</h1>
      <div class="sub">Todos los mapas y esquemas, de lo general a lo particular: la colección, cada revista y cada volumen o número junto a los esquemas de sus artículos. Toca uno para ampliarlo y pasa al siguiente con las flechas; su título lleva a su página.</div></header>
    ${tabs('#/mapas', ['Colección', ...L.pubs.map(p => p.name)], tab)}
    <div id="maps-panel">${panel()}</div>
    ${aiNote()}
  </div>`;
  return [html, () => {
    const box = $('#maps-panel');
    // altura de la barra de pestañas: la de los botones se fija justo debajo
    const tabsEl = view.querySelector('.tabs');
    if (tabsEl) view.style.setProperty('--maps-tabs-h', tabsEl.offsetHeight + 'px');
    const redraw = () => {
      // si las barras estaban fijas arriba, siguen fijas: el nuevo contenido empieza justo debajo de ellas
      const ty = artTabsY(), stuck = ty != null && scrollY >= ty - 1;
      box.innerHTML = panel();
      if (stuck) window.scrollTo(0, ty);
      history.replaceState(history.state, '', `#/mapas/${tab}` + (pubId && volKey ? `?v=${volKey}` : ''));
    };
    const onClick = e => {
      const v = e.target.closest('.maps-sub-nav [data-v]');
      if (v) { volKey = v.dataset.v; redraw(); }
    };
    view.addEventListener('click', onClick);
    return () => view.removeEventListener('click', onClick);
  }];
}

/** Índice de autores de las dos revistas, con sus textos. */
function authorsView(params) {
  setBar('Autores');
  const L = lib();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Autores</h1><div class="sub">${L.authors.length} firmas${L.pubs.length > 1 ? ' en Marx XXI y Nuevo Ciclo; las que publican en las dos revistas aparecen marcadas' : ''}. Las entrevistas figuran también a nombre de la persona entrevistada.</div></header>
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
      history.replaceState(history.state, '', '#/autores' + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
    });
    render();
  }];
}

function searchView(params) {
  setBar('Buscar');
  const L = lib(), multi = L.pubs.length > 1;
  // segunda capa: en qué revista buscar (llega marcada según desde dónde se entra: ?p=)
  let pubId = L.byId[params.get('p')] ? params.get('p') : '';
  const html = `<div class="wrap">
    <div class="sticky-tools">
      <label class="field">${ICON.search}<input id="s-q" type="search" placeholder="Concepto, autor, tema…" value="${esc(params.get('q') || '')}" autocomplete="off" enterkeyhint="search"></label>
      <div class="chips">
        <button class="chip" id="s-guide" aria-pressed="${params.get('en') !== 'textos'}">Guía</button>
        <button class="chip" id="s-full" aria-pressed="${params.get('en') === 'textos'}">Textos íntegros</button>
      </div>
      ${multi ? `<div class="chips" id="s-pub">${[['', 'Toda la colección'], ...L.pubs.map(p => [p.id, p.name])].map(([k, label]) =>
        `<button class="chip" data-p="${k}" aria-pressed="${k === pubId}">${esc(label)}</button>`).join('')}</div>` : ''}
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
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (q && full) qs.set('en', 'textos');
      if (pubId) qs.set('p', pubId);
      history.replaceState(history.state, '', '#/buscar' + (qs.toString() ? '?' + qs : ''));
      $('#s-prog').hidden = true;
      if (q.length < 2) {
        const nArts = L.allArticles.filter(x => !pubId || x.v.pub.id === pubId).length;
        list.innerHTML = `<p class="empty">Busca en resúmenes, píldoras, conceptos, conclusiones y tesis comunes${pubId ? ` de ${esc(L.byId[pubId].name)}` : ''}. Cambia a «Textos íntegros» para buscar dentro de los ${nArts} artículos completos.</p>`;
        return;
      }
      if (!full) {
        const hits = searchGuide(q).filter(h => !pubId || h.pub?.id === pubId); // la síntesis común solo en «Toda la colección»
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
        signal: my.signal, pub: pubId,
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
    $('#s-pub')?.addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      pubId = b.dataset.p;
      for (const c of $('#s-pub').children) c.setAttribute('aria-pressed', c === b);
      run();
    });
    run();
    if (!input.value) input.focus();
    return () => ctrl?.abort();
  }];
}

/** Marcadores = subrayados del modo lectura (con su color y nota propia), agrupados por texto. */
/** Un subrayado (con su nota, si la tiene): lleva a su pasaje en el modo lectura; la cruz lo elimina. */
const hlItem = h => `<div class="hl-item" style="--hl:${hlHex(h.color)}" title="${esc(hlCat(h.color))}">
        <a class="hl-link" href="#/leer/${h.key}?b=${h.b0}">
          <p class="hl-text">${esc(h.text.length > 320 ? h.text.slice(0, 320) + '…' : h.text)}</p>
          ${h.note ? `<p class="hl-own">${esc(h.note).replace(/\n/g, '<br>')}</p>` : ''}
          <span class="src">${new Date(h.t).toLocaleDateString('es')}</span>
        </a>
        <button class="icon-btn" data-del="${esc(h.uid)}" aria-label="Eliminar subrayado">${ICON.x}</button>
      </div>`;
/** Filtros por categoría de unos marcadores (si hay más de una): una línea de botones desplazable y fija arriba, como
 *  las barras de pestañas. `open(id)` da la etiqueta de apertura de cada botón ('' = todos), p. ej. un enlace. */
export function hlFilterBar(list, active, open) {
  const used = new Set(list.map(h => h.color));
  if (used.size < 2) return '';
  const n = id => list.filter(h => !id || h.color === id).length;
  const chip = (id, label) => { const o = open(id), tag = o.split(' ')[0];
    return `<${o} class="chip"${id === active ? ' aria-pressed="true" aria-current="page"' : ''}>${label} <span class="m-count">${n(id)}</span></${tag}>`; };
  return `<nav class="tabs chip-tabs hl-filter" aria-label="Filtrar por categoría">${chip('', 'Todos')}${store.legend().filter(s => used.has(s.id)).map(s =>
    chip(s.id, `<i class="hl-dot" style="--hl:${hlHex(s.id)}"></i>${esc(hlCat(s.id))}`)).join('')}</nav>`;
}
/** Elimina un subrayado tras confirmarlo (página Marcadores y pestaña Marcadores de la guía) y vuelve a pintar la
 *  pantalla. En el modo lectura (guía dentro del lector) solo se pregunta si tiene nota. */
function deleteHighlight(uid) {
  const h = store.highlights().find(x => x.uid === uid);
  const del = () => { store.removeHighlight(uid); route(); };
  const note = !!h?.note.trim();
  if (!note && document.body.classList.contains('reading')) return del();
  confirmDialog({ title: 'Eliminar el subrayado', text: note ? 'Se quitará del texto y de tus marcadores, y también se borrará la nota que escribiste en él.' : 'Se quitará del texto y de tus marcadores.', ok: 'Eliminar', danger: true })
    .then(yes => yes && del());
}
// pestaña «Marcadores» de la guía de un artículo
document.addEventListener('click', e => { const b = e.target.closest('.art-marks [data-del]'); if (b) deleteHighlight(b.dataset.del); });

const BM_TABS = () => [{ html: `<span class="tab-ico">${ICON.mark}Marcadores</span>` }, { html: `<span class="tab-ico">${ICON.gear}Configurar leyenda</span>` }];
function bookmarksView(params, tabArg) {
  setBar('Marcadores');
  const tab = +tabArg === 1 ? 1 : 0;
  if (tab === 1) {
    const html = `<div class="wrap">
      <header class="page-head"><h1>Marcadores</h1>
        <div class="sub">Pasajes subrayados en el modo lectura y tus notas propias. En «Configurar leyenda», el color y la categoría de cada subrayado, y cuáles se usan al subrayar.</div><p class="muted small data-tip">Se guardan solo en este navegador: <a href="#/acerca/datos">expórtalos</a> para no perderlos o pasarlos a otro dispositivo.</p></header>
      ${tabs('#/marcadores', BM_TABS(), 1)}
      <div class="bm-panel" id="legend-box"></div>
    </div>`;
    return [html, () => {
      const box = $('#legend-box');
      mountLegend(box);
      leaveGuard = () => box._lg?.dirty() ? box._lg : null;
      const onUnload = e => { if (box._lg?.dirty()) { e.preventDefault(); e.returnValue = ''; } }; // cerrar o recargar
      addEventListener('beforeunload', onUnload);
      return () => { leaveGuard = null; removeEventListener('beforeunload', onUnload); };
    }];
  }
  const all = store.highlights();
  const color = params.get('c') || '';
  const shown = color ? all.filter(h => h.color === color) : all;
  const titleOf = key => {
    const hit = article(key);
    if (hit) return { v: hit.v, title: hit.a.title, author: byline(hit.a), order: lib().allArticles.indexOf(hit) };
    const n = +String(key).replace('tomo-', ''); // subrayado sin texto conocido: se descarta abajo (sin v)
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
      <div class="sub">Pasajes subrayados en el modo lectura y tus notas propias. En «Configurar leyenda», el color y la categoría de cada subrayado, y cuáles se usan al subrayar.</div><p class="muted small data-tip">Se guardan solo en este navegador: <a href="#/acerca/datos">expórtalos</a> para no perderlos o pasarlos a otro dispositivo.</p></header>
    ${tabs('#/marcadores', BM_TABS(), 0)}
    <div class="bm-panel">
    ${hlFilterBar(all, color, id => `a href="#/marcadores/0${id ? '?c=' + id : ''}"`)}
    ${groups.length ? groups.map(g => `<details class="hl-group" data-vol="${g.v.key}"${groups.length === 1 ? ' open' : ''}>
      <summary><div class="eyebrow vol">${esc(volHead(g.v))}</div>
      <h2 class="hl-group-title">${esc(g.title)} <span class="m-count">${g.items.length}</span></h2>
      ${g.author ? `<div class="muted small">${esc(g.author)}</div>` : ''}</summary>
      <a class="hl-open small" href="#/leer/${g.key}">Abrir el texto →</a>
      ${g.items.map(hlItem).join('')}
    </details>`).join('')
    : `<div class="empty">Aún no hay marcadores.<br>En el modo lectura, <b>selecciona un pasaje</b> y elige un color para subrayarlo; toca después el subrayado para escribir una nota propia.</div>`}
    </div>
  </div>`;
  return [html, () => {
    const onClick = e => { const b = e.target.closest('[data-del]'); if (b) deleteHighlight(b.dataset.del); };
    view.addEventListener('click', onClick);
    return () => view.removeEventListener('click', onClick);
  }];
}

/** Leyenda de los subrayados (para toda la aplicación): una línea por color, con su círculo (toca para elegir entre
 *  los 16 colores de la paleta), su categoría (se escribe o se elige de la lista con la flecha) y «Mostrar» (si se
 *  ofrece al subrayar). La última línea, vacía, crea un color nuevo al elegirle color. `onChange` tras cada cambio. */
export function openLegend(onChange) {
  openSheet('Leyenda', '', body => mountLegend(body, onChange, () => closeSheet()));
}
/** Pinta la leyenda en `root` y la deja editable (ver openLegend). */
function mountLegend(root, onChange, onDone) {
  // se edita una copia: nada cambia en la aplicación hasta «Guardar» (que pide confirmación); «Cancelar» la descarta
  let legend = store.legend().map(x => ({ ...x })), picking = null, listing = null, dirty = false;
  const save = () => { dirty = true; };
  const commit = () => { store.saveLegend(legend); dirty = false; onChange?.(legend); toast('Leyenda guardada'); };
  // para el aviso al salir de la página sin guardar
  root._lg = { dirty: () => dirty, save: commit };
  const row = (s, i) => {
    const hex = HL_PALETTE[s.color]?.[1];
    return `<div class="lg-row${s.color ? '' : ' empty'}" data-i="${i}">
      <button type="button" class="lg-dot" data-pick="${i}" style="${hex ? `--hl:${hex}` : ''}" aria-label="${hex ? `Color: ${HL_PALETTE[s.color][0]}. Cambiar` : 'Elegir color para una categoría nueva'}" aria-expanded="${picking === i}"></button>
      <span class="lg-cat${isDef(s) ? ' is-default' : ''}">${s.color ? '' : '<span class="lg-new" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M19 12H6M11 7l-5 5 5 5"/></svg>Nueva categoría</span>'}<input type="text" data-cat="${i}" value="${esc(isDef(s) ? colorName(s) : s.cat)}" placeholder="${s.color ? 'Categoría' : ''}" ${s.color ? '' : 'disabled'} aria-label="Categoría">
        <span class="lg-pen" aria-hidden="true" title="Escribe la categoría que quieras"><svg viewBox="0 0 24 24"><path d="M15 5l4 4L9 19H5v-4z"/><path d="M13 7l4 4"/></svg></span>
        <button type="button" class="lg-more" data-catlist="${i}" aria-label="Categorías habituales" aria-expanded="${listing === i}" ${s.color ? '' : 'disabled'}>▾</button></span>
      <label class="lg-show"><input type="checkbox" data-show="${i}" ${s.show && s.color ? 'checked' : ''} ${s.color ? '' : 'disabled'}><span>Usar</span></label>
    </div>
`;
  };
  // sin categoría propia (vacía o el nombre de su color): se muestra el nombre del color, con un lápiz al lado
  const colorName = s => HL_PALETTE[s.color]?.[0] || '';
  const isDef = s => !!s.color && (!s.cat?.trim() || s.cat === colorName(s));
  // categorías sugeridas que no usa ya otra línea
  const norm = t => (t || '').trim().toLocaleLowerCase('es');
  const freeCats = i => HL_CATEGORIES.filter(c => !legend.some((s, j) => j !== i && norm(s.cat) === norm(c)));
  // siempre una línea vacía al final para crear un color nuevo (tantas como colores tiene la paleta)
  const rows = () => [...legend, ...(legend.length < Object.keys(HL_PALETTE).length ? [{ id: '', color: '', cat: '', show: false }] : [])];
  // ventana de categorías (sobre la leyenda): «—» vuelve al nombre del color; «Personalizado» deja el campo vacío
  // para escribir; después, las sugeridas que no usa otra línea. La opción actual, en negrita.
  const picker = () => {
    const s = legend[listing]; if (!s) return '';
    const cur = isDef(s) ? '' : HL_CATEGORIES.includes(s.cat) ? s.cat : '*';
    const opt = (v, label, attr = `data-pickcat="${esc(v)}"`) => `<button type="button" role="option" ${attr} aria-selected="${cur === v}">${label}</button>`;
    return `<div class="lg-pick-wrap" data-pickclose><div class="lg-pick" role="listbox" aria-label="Categoría">
      <div class="lg-pick-head"><i style="--hl:${HL_PALETTE[s.color]?.[1] || 'transparent'}"></i>Categoría</div>
      ${opt('', '—')}${opt('*', '<i>Personalizado</i>', 'data-pickcustom')}
      ${freeCats(listing).map(c => opt(c, esc(c))).join('')}</div></div>`;
  };
  // ventana de colores (como la de categorías): la paleta y, debajo, «Eliminar categoría» (si la línea existe)
  const palette = () => {
    const s = legend[picking];
    return `<div class="lg-pick-wrap" data-pickclose><div class="lg-pick lg-pick-colors" role="group" aria-label="Color">
      <div class="lg-pick-head">${s ? `<i style="--hl:${HL_PALETTE[s.color]?.[1]}"></i>${esc(isDef(s) ? colorName(s) : s.cat)}` : 'Color de la categoría nueva'}</div>
      <div class="lg-palette">${HL_PALETTE_ORDER.map(k => { const [n, c] = HL_PALETTE[k];
        return `<button type="button" class="lg-pal" data-color="${k}" style="--hl:${c}" aria-pressed="${k === s?.color}"><i></i>${n}</button>`; }).join('')}</div>
      ${s ? `<button type="button" class="lg-del" data-lgdel><i></i>Eliminar categoría</button>` : ''}</div></div>`;
  };
  const html = () => `<p class="muted small" style="margin-top:0">Para toda la aplicación: cambiar el color o la categoría de una línea cambia todos los subrayados hechos con ella. «Usar» decide qué colores se ofrecen al subrayar.</p>
    <div class="legend">${rows().map(row).join('')}</div>
    <div class="lg-actions">${onDone ? '' : '<button type="button" class="btn ghost" data-lgreset>Restaurar leyenda</button>'}<button type="button" class="btn" data-lgsave>Guardar</button>${onDone ? '<button type="button" class="btn ghost" data-lgcancel>Cancelar</button>' : ''}</div>
    ${listing != null ? picker() : ''}${picking != null ? palette() : ''}`;
  {
    const body = root;
    const redraw = () => { const y = body.scrollTop; body.innerHTML = html(); body.scrollTop = y; };
    redraw();
    body.onclick = e => {
      if (e.target.closest('[data-lgcancel]')) {
        legend = store.legend().map(x => ({ ...x })); picking = listing = null; dirty = false;
        return onDone ? onDone(false) : redraw();
      }
      if (e.target.closest('[data-lgreset]')) {
        const ids = DEFAULT_LEGEND.map(x => x.id);
        const lost = store.highlights().filter(h => !ids.includes(h.color)).length;
        confirmDialog({ title: 'Restaurar la leyenda', text: 'Vuelven los cinco colores de partida (amarillo, verde, azul, rosa y naranja), con su nombre como categoría y todos en uso. Se pierden las categorías y los colores personalizados, y también los cambios sin guardar.'
          + (lost ? `\n${lost === 1 ? 'Un marcador de otras categorías quedará' : lost + ' marcadores de otras categorías quedarán'} en gris y sin categoría.` : ''), ok: 'Aceptar' })
          .then(yes => {
            if (!yes) return;
            legend = DEFAULT_LEGEND.map(x => ({ ...x })); picking = listing = null;
            commit(); redraw();
          });
        return;
      }
      if (e.target.closest('[data-lgsave]')) {
        const gone = store.legend().filter(x => !legend.some(y => y.id === x.id));
        const lost = store.highlights().filter(h => gone.some(g => g.id === h.color)).length;
        confirmDialog({ title: 'Guardar la leyenda', text: 'Los cambios de color y de categoría se aplicarán a todos los subrayados hechos con cada línea, en todos los textos.'
          + (lost ? `\n${lost === 1 ? 'Un marcador de las categorías eliminadas quedará' : lost + ' marcadores de las categorías eliminadas quedarán'} en gris y sin categoría.` : ''), ok: 'Guardar' })
          .then(yes => {
            if (!yes) return;
            commit();
            onDone ? onDone(true) : redraw();
          });
        return;
      }
      const p = e.target.closest('[data-pick]');
      if (p) { picking = picking === +p.dataset.pick ? null : +p.dataset.pick; listing = null; return redraw(); }
      const c = e.target.closest('[data-color]');
      if (c && picking != null) {
        const s = legend[picking];
        if (!s) { // línea nueva: se crea con ese color y su nombre como categoría
          let n = legend.length + 1; while (legend.some(x => x.id === 'c' + n)) n++;
          legend.push({ id: 'c' + n, color: c.dataset.color, cat: HL_PALETTE[c.dataset.color][0], show: true });
        } else {
          // si la categoría era el nombre del color anterior, pasa a ser el del nuevo
          if (!s.cat?.trim() || s.cat === HL_PALETTE[s.color]?.[0]) s.cat = HL_PALETTE[c.dataset.color][0];
          s.color = c.dataset.color;
        }
        picking = null; save(); return redraw();
      }
      const l = e.target.closest('[data-catlist]'); // (data-list es el botón de Mi lista)
      if (l) { listing = listing === +l.dataset.catlist ? null : +l.dataset.catlist; picking = null; return redraw(); }
      if (e.target.matches('[data-pickclose]')) { listing = picking = null; return redraw(); } // fuera de la ventana
      if (e.target.closest('[data-lgdel]') && legend[picking]) { // se quita al guardar; sus marcadores quedan sin categoría
        legend.splice(picking, 1); picking = null; save(); return redraw();
      }
      if (e.target.closest('[data-pickcustom]') && legend[listing]) { // «Personalizado»: campo vacío y el cursor en él
        const i = listing; legend[i].cat = ''; listing = null; save(); redraw();
        const inp = body.querySelector(`[data-cat="${i}"]`); inp.value = ''; inp.focus();
        return;
      }
      const pc = e.target.closest('[data-pickcat]');
      if (pc && listing != null && legend[listing]) { // «—»: vuelve al nombre del color
        legend[listing].cat = pc.dataset.pickcat || colorName(legend[listing]); listing = null; save(); return redraw();
      }
    };
    // si la categoría es aún el nombre de su color, al entrar en el campo se vacía para escribir la suya
    // (focusin no tiene propiedad on…: se sustituye el anterior si la ventana se reutiliza)
    if (body._lgFocus) body.removeEventListener('focusin', body._lgFocus);
    body._lgFocus = e => {
      const i = e.target.dataset.cat, s = i != null && legend[+i];
      if (s && isDef(s)) { e.target.value = ''; s.cat = ''; }
    };
    body.addEventListener('focusin', body._lgFocus);
    // si se sale sin escribir nada, vuelve al nombre del color
    if (body._lgBlur) body.removeEventListener('focusout', body._lgBlur);
    body._lgBlur = e => {
      const i = e.target.dataset.cat, s = i != null && legend[+i];
      if (!s || e.target.value.trim()) return;
      s.cat = colorName(s); e.target.value = s.cat;
      e.target.parentElement.classList.add('is-default');
    };
    body.addEventListener('focusout', body._lgBlur);
    body.oninput = e => {
      const i = e.target.dataset.cat;
      if (i != null && legend[+i]) {
        legend[+i].cat = e.target.value; save();
        e.target.parentElement.classList.toggle('is-default', isDef(legend[+i]));
      }
    };
    body.onchange = e => {
      const i = e.target.dataset.show;
      if (i != null && legend[+i]) { legend[+i].show = e.target.checked; save(); }
    };
  }
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

/** La app tiene siempre sus propios colores (los claros de marxxxi.com), sin seguir el modo oscuro del sistema.
 *  El tema de los ajustes de lectura (claro por defecto) solo se aplica mientras se lee (body.reading). */
export function applyTheme(s = store.settings()) {
  const root = document.documentElement;
  if (!document.body.classList.contains('reading')) root.dataset.theme = 'light';
  else root.dataset.theme = s.theme;
  const head = getComputedStyle(document.documentElement).getPropertyValue('--head').trim();
  document.querySelector('meta[name=theme-color]').content = head || '#2c332f';
}

/** Aplica los ajustes de lectura como variables CSS y clases sobre un contenedor .reader. */
export function styleReader(el, s) {
  el.dataset.theme = s.theme;
  el.style.setProperty('--r-size', s.size + 'px');
  el.style.setProperty('--r-lh', s.lineHeight);
  el.style.setProperty('--r-gap', s.paraGap + 'em');
  el.style.setProperty('--r-margin', s.margin + 'px');
  el.style.setProperty('--r-width', s.width + 'px');
  el.style.setProperty('--r-font', FONTS[s.font]?.[1] || FONTS.source[1]);
  el.classList.toggle('justify', s.justify);
  el.classList.toggle('hyphens', s.hyphens);
  el.classList.toggle('indent', s.indent);
}

function settingsView() {
  setBar('Ajustes de lectura');
  const s = store.settings();
  const html = `<div class="wrap">
    <header class="page-head"><h1>Ajustes de lectura</h1><div class="sub">Los ajustes se guardan en este navegador y se aplican a todos los textos.</div></header>
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

const REPO_URL = 'https://github.com/leer-dotcom/marx.xxi';

/** Secciones de «Acerca de» y «Créditos»: **…** en los textos de data/about.json se pinta en negrita. */
function aboutSec(title, paragraphs, cls = '', extra = '') {
  // «## …» es un título intermedio; **…**, negrita; [texto](https://…), enlace; `extra`, HTML al final (p. ej. un botón)
  return paragraphs?.length ? `<section class="card about ${cls}">${title ? `<h2>${esc(title)}</h2>` : ''}${paragraphs.map(t => t.startsWith('## ')
    ? `<h3>${esc(t.slice(3))}</h3>` : `<p>${esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener" target="_blank">$1</a>')}</p>`).join('')}${extra}</section>` : '';
}

/** «Sobre Marx XXI», «Sobre Nuevo Ciclo»: su texto y un enlace a la publicación en marxxxi.com (site_url). */
function magSec(id, name, mag) {
  return `<section class="card about" id="sobre-${id}">
      <h2>${esc(mag.title || 'Sobre ' + name)}</h2>
      ${paras(mag.paragraphs || [])}
      ${mag.site_url ? `<a class="btn ghost" href="${esc(mag.site_url)}" rel="noopener" target="_blank">Ver ${esc(name)} en marxxxi.com</a>` : ''}
    </section>`;
}

const ABOUT_TABS = ['Sobre la aplicación', 'Sobre la colección', 'Descarga'];

/** «Acerca de», en dos pestañas: el lector (aplicación, código, instalación) y la colección (apoyo y revistas). */
function aboutView(tab) {
  setBar('Acerca de');
  const L = lib(), ab = L.about || {};
  const mag = ab.magazine || {};
  // Textos propios de las demás publicaciones (p. ej. data/nuevo-ciclo/about.json)
  const others = L.pubs.filter(p => p.id !== 'marx-xxi' && p.about);
  // sin título: lo dan sus apartados («Objetivo de la aplicación», «Uso de la Inteligencia Artificial»)
  const reader = () => `${aboutSec('', [...(ab.ai?.paragraphs || []), ...others.flatMap(p => p.about.ai?.paragraphs || [])], 'ai')}

    <section class="card about" id="aplicacion">
      <h2>Código abierto</h2>
      <p>Esta aplicación es de código abierto: el código, los textos íntegros, las guías de estudio, los esquemas y los datos están publicados en un repositorio público de GitHub, junto con el historial completo de cambios. Así, cualquiera puede comprobar cómo está hecha y qué hace con sus datos.</p>
      <p>El repositorio se puede consultar, descargar o copiar libremente; los cambios en esta aplicación, no obstante, solo los publica quien la mantiene.</p>
      <a class="btn ghost" href="${REPO_URL}" rel="noopener" target="_blank">${ICON.code}Ver el repositorio en GitHub</a>
    </section>

    ${ab.security ? aboutSec(ab.security.title, ab.security.paragraphs) : ''}`;
  // Descarga: instalar y usar sin conexión, y exportar o importar los datos del lector
  const download = () => `
    <section class="card about" id="instalar">
      <h2>Instalar y usar sin conexión</h2>
      ${ab.privacy ? `<p>${esc(ab.privacy)}</p>` : ''}
      <div id="install-area" class="install-area">${installHtml()}</div>
    </section>

    <section class="card about" id="datos">
      <h2>Exportar e importar tus datos</h2>
      <p>Lo que personalizas en el lector se guarda solo en este navegador: el progreso y el punto de lectura de cada texto, los leídos, Mi lista, los subrayados con sus notas, la leyenda de colores y los ajustes de lectura. No se envía a ningún servidor, así que <b>si se borran los datos de navegación del navegador, se pierden</b>.</p>
      <p><b>Exportar</b> descarga un archivo con todo ello, para guardar una copia o pasarlo a otro dispositivo o navegador. <b>Importar</b> carga un archivo exportado y sustituye los datos de este navegador por los suyos (pide confirmación antes).</p>
      <div class="data-actions">
        <button type="button" class="btn" data-export>${ICON.upload}Exportar datos</button>
        <button type="button" class="btn ghost" data-import>${ICON.download}Importar datos</button>
        <input type="file" id="import-file" accept=".json,application/json" hidden>
      </div>
    </section>`;
  const collection = () => `${ab.support ? aboutSec(ab.support.title, ab.support.paragraphs, 'support', ab.support.url
      ? `<a class="btn ghost" href="${esc(ab.support.url)}" rel="noopener" target="_blank">Ir a la web oficial de Marx XXI</a>` : '') : ''}

    ${magSec('marx-xxi', 'Marx XXI', mag)}
    ${others.map(p => magSec(p.id, p.name, p.about.magazine || {})).join('')}`;
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Lector de Marx XXI</div><h1>Acerca de</h1>
      <div class="sub">Qué objetivos tiene este lector y cómo se han elaborado sus guías de estudio; qué son Marx XXI y Nuevo Ciclo, y cómo apoyar su edición; y cómo instalarlo, usarlo sin conexión y guardar una copia de tus datos.</div></header>
    ${tabs('#/acerca', ABOUT_TABS, tab)}
    ${tab === 2 ? download() : tab === 1 ? collection() : reader()}

    <p class="muted small" style="margin-top:20px;text-align:center"><a href="#/creditos">Créditos: textos y licencia, autores y diseño →</a></p>
  </div>`;
}

function creditsView() {
  setBar('Créditos');
  const L = lib(), ab = L.about || {};
  const others = L.pubs.filter(p => p.id !== 'marx-xxi' && p.about);
  const credits = p => p.volumes.map(v => `<div class="credit-vol" data-vol="${v.key}">
      <div class="eyebrow vol">${v.label ? `${esc(volName(v))} · ${esc(monthName(v.month))}` : `Volumen ${v.number}${v.year ? ' · ' + v.year : ''}`}</div>
      <h3>${esc(v.label ? v.subtitle : v.title)}</h3>
      ${v.editor ? `<p class="muted small">Edición: ${esc(v.editor)}${!v.label && v.number <= 3 ? ' · publicado con Contracultura' : ''}</p>` : ''}
      <ul>${v.articles.map(a => `<li><a href="#/articulo/${a.id}">${esc(byline(a))}</a>${isInterview(a) ? ' (entrevista)' : ''} — <span class="muted">${esc(a.title)}</span></li>`).join('')}</ul>
    </div>`).join('');
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Lector de Marx XXI</div><h1>Créditos</h1>
      <div class="sub">Licencia de los textos, autores y artículos de cada ${L.pubs.length > 1 ? 'volumen y número' : 'volumen'}, y diseño del lector.</div></header>

    ${aboutSec(ab.license?.title || 'Textos y licencia', [...(ab.license?.paragraphs || []), ...others.flatMap(p => p.about.license?.paragraphs || [])])}

    <section class="card about" id="autores-articulos">
      <h2>Autores y artículos</h2>
      ${L.pubs.map(p => `${L.pubs.length > 1 ? `<h3 class="credit-pub">${esc(p.name)}</h3>` : ''}
        <p class="muted small">Autores y ${p.volumes[0]?.label ? 'artículos de cada número' : 'artículos de cada volumen'}, en el orden de la revista.</p>
        ${credits(p)}`).join('')}
    </section>

    ${ab.design ? `<p class="muted small" style="margin-top:20px">${esc(ab.design)}</p>` : ''}
  </div>`;
}

function notFound() {
  setBar('No encontrado');
  return `<div class="wrap"><p class="empty">No existe esta página. <a href="#/">Volver al inicio</a></p></div>`;
}

// «Empezar desde el principio» (pestaña «Texto completo» de la guía): reinicia el progreso de lectura (punto,
// porcentaje y marca de leído; no los subrayados ni los marcadores) y abre el texto arriba del todo
document.addEventListener('click', e => {
  const b = e.target.closest('[data-restart]'); if (!b) return;
  const id = b.dataset.restart;
  confirmDialog({
    title: 'Empezar desde el principio',
    text: `Se reiniciará el progreso de lectura (${pct(store.reached(id))} % leído).\nLos subrayados y marcadores se conservan.`,
    ok: 'Empezar de nuevo', cancel: 'Cancelar',
  }).then(yes => {
    if (!yes) return;
    store.resetProgress(id);
    location.hash = `#/leer/${id}`;
  });
});

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
  document.body.classList.toggle('about-page', parts[0] === 'acerca'); // «Actualizar» ya está en Instalar: sin barra flotante
  let out;
  switch (parts[0]) {
    case undefined: out = libraryView(); break;
    case 'marx-xxi': case 'nuevo-ciclo': out = collectionView(pub(parts[0])); break;
    case 'volumen': case 'tomo': out = volumeView(pub('marx-xxi'), +parts[1], parts[2] != null ? +parts[2] : 1); break;
    case 'numero': out = volumeView(pub('nuevo-ciclo'), +parts[1], parts[2] != null ? +parts[2] : 1); break;
    case 'articulo': out = articleView(parts[1], +(parts[2] || TAB.pildoras), params); break;
    case 'leer': out = await readerView(parts[1], params); break;
    case 'tesis': {
      const other = parts[1] && !/^\d+$/.test(parts[1]); // #/tesis/nuevo-ciclo[/n] o #/tesis[/n]
      out = thesesView(pub(other ? parts[1] : 'marx-xxi'), +(other ? parts[2] : parts[1]) || 0, params);
      break;
    }
    case 'sintesis': out = synthesisView(+(parts[1] || 0), params); break;
    case 'autores': out = authorsView(params); break;
    case 'mapas': out = mapsView(params, parts[1]); break;
    case 'glosario': out = glossaryView(params, parts[1]); break;
    case 'buscar': out = searchView(params); break;
    case 'marcadores': out = bookmarksView(params, parts[1]); break;
    case 'lista': out = listView(+(parts[1] || 0)); break;
    case 'ajustes': out = settingsView(); break;
    // #/acerca/instalar y #/acerca/datos: pestaña Descarga, en su apartado
    case 'acerca': out = aboutView(parts[1] === '1' ? 1 : ['2', 'instalar', 'datos'].includes(parts[1]) ? 2 : 0); break;
    case 'creditos': out = creditsView(); break;
    default: out = notFound();
  }
  const [html, mount] = Array.isArray(out) ? out : [out, null];
  view.innerHTML = html;
  // Desplazamiento al entrar (el modo lectura lleva el suyo: el punto donde se dejó cada texto):
  // - volver a la pantalla inmediatamente anterior: donde estaba (solo esa; las de antes, desde el principio);
  // - otra pestaña de la misma guía de artículo con la barra de pestañas fija arriba: la barra sigue arriba;
  // - en cualquier otro caso, desde el principio.
  //   Con la barra fija arriba ni siquiera la memoria sube más allá de ella: como mucho la deja arriba. Si la
  //   pestaña nueva es demasiado corta para tanto desplazamiento (p. ej. «Texto completo»), se ve la cabecera.
  const nav = navInfo; navInfo = null;
  if (parts[0] !== 'leer') {
    const target = () => nav?.keepTabs ? Math.max(nav.restoreY ?? 0, artTabsY() ?? 0) : nav?.restoreY ?? 0;
    const y = target();
    window.scrollTo(0, y);
    // esquemas que aún cargaban: si la página no daba para tanto desplazamiento, otro intento al crecer
    if (y > 0) setTimeout(() => { if (scrollY < target() - 2 && !userScrolled) window.scrollTo(0, target()); }, 300);
  }
  cleanup = mount?.() || null;
  const mainTabs = view.querySelector('.tabs:not(.chip-tabs)');
  if (mainTabs) view.style.setProperty('--maps-tabs-h', mainTabs.offsetHeight + 'px');
  applyTheme(); // tema de lectura al entrar en el lector; el del sistema al salir
  if (parts[0] === 'acerca') {
    if (parts[1] === 'instalar' || parts[1] === 'datos') document.getElementById(parts[1])?.scrollIntoView();
    checkUpdate();
  }
}

// que el navegador tampoco restaure el scroll al volver atrás o recargar
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// Pantalla desde la que se llegó (sin contar los cambios dentro del propio lector): el «Volver» del lector
// regresa al volumen o número si se entró desde ahí
let fromHash = '';
export const cameFrom = () => fromHash;
// Recorrido de pantallas para el botón «atrás» de la barra: cada entrada es una pantalla con la altura a la que se
// dejó. Las pestañas de un artículo, de un volumen o número y de una síntesis son la misma pantalla (cambiarlas
// solo actualiza su entrada), así que «atrás» vuelve a la sección anterior, se hayan visto las pestañas que sean.
// pinned: pantalla con pestañas en la que la barra de pestañas estaba (o se quiso dejar) arriba; si una pestaña
// corta obligó a mostrar la cabecera y no se ha desplazado desde entonces, la siguiente vuelve a dejarla arriba.
let trail = [], navInfo = null, userScrolled = false, pinned = null;
// Índice de cada entrada del historial (en history.state): distingue volver atrás (botón del navegador o del
// sistema) de llegar de nuevo a una pantalla ya vista por un enlace. backBtn: se pulsó la flecha de la barra.
let histI = typeof history.state?.i === 'number' ? history.state.i : 0, backBtn = false;
if (typeof history.state?.i !== 'number') history.replaceState({ ...(history.state || {}), i: 0 }, '');
for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, () => { userScrolled = true; }, { passive: true });
// la portada es «#/» o, al abrir la app por primera vez, sin hash: las dos cuentan como la misma pantalla
const normHash = h => h && h !== '#' ? h : '#/';
/** Página a la que pertenece un hash: las pestañas de una misma guía comparten página. */
function pageOf(h) {
  const path = normHash(h).split('?')[0];
  let m;
  if ((m = path.match(/^#\/articulo\/([^/]+)/))) return 'articulo/' + m[1];
  if ((m = path.match(/^#\/(volumen|tomo|numero)\/(\d+)/))) return (m[1] === 'numero' ? 'numero/' : 'volumen/') + m[2];
  if ((m = path.match(/^#\/tesis(?:\/([a-z][a-z-]*))?/))) return 'tesis/' + (m[1] || 'marx-xxi');
  if (/^#\/sintesis(\/|$)/.test(path)) return 'sintesis';
  if (/^#\/mapas(\/|$)/.test(path)) return 'mapas';
  if (/^#\/glosario(\/|$)/.test(path)) return 'glosario';
  if (/^#\/marcadores(\/|$)/.test(path)) return 'marcadores';
  if (/^#\/acerca(\/|$)/.test(path)) return 'acerca';
  return path;
}
const tabbed = sc => /^(articulo|volumen|numero|tesis)\/|^(sintesis|mapas|glosario|acerca|marcadores)$/.test(sc);
/** Pantalla del recorrido de «atrás»: además de las pestañas, ir de un artículo a otro (o de un volumen o número
 *  a otro) sigue siendo la misma pantalla; «atrás» vuelve a donde se estaba antes de entrar en el primero. */
const screenOf = h => pageOf(h).replace(/^(articulo|volumen|numero)\/.*/, '$1');
/** Pantalla anterior del recorrido (su última pestaña), o null si se está en la primera. */
export const backHash = () => trail.length > 1 ? trail[trail.length - 2].hash : null;
/** En una pantalla con pestañas, desplazamiento a partir del cual la barra de pestañas queda fija arriba. */
function artTabsY() {
  const head = view.querySelector('.page-head'), tabs = view.querySelector('.tabs');
  if (!head || !tabs) return null;
  const cs = getComputedStyle(tabs);
  return Math.max(0, head.getBoundingClientRect().bottom + scrollY + parseFloat(cs.marginTop) - parseFloat(cs.top));
}
// Salir de una pantalla con cambios sin guardar (la leyenda): se vuelve a ella y se pregunta «¿Salir sin guardar?»;
// «Sí» sigue adonde se iba, «Guardar» guarda y sigue; cerrar el aviso se queda.
let leaveGuard = null, leaving = false;
window.addEventListener('hashchange', e => {
  const target = location.hash, g = !leaving && leaveGuard?.();
  if (!g) return;
  e.stopImmediatePropagation();
  history.replaceState(history.state, '', e.oldURL); // la dirección vuelve a la pantalla (no se re-dibuja)
  confirmDialog({ title: '¿Salir sin guardar?', text: 'Has cambiado la leyenda y aún no has guardado los cambios.', ok: 'Guardar', cancel: 'Sí' })
    .then(res => {
      if (res == null) return;
      if (res) g.save();
      leaving = true; leaveGuard = null; location.hash = target;
      setTimeout(() => { leaving = false; }, 0);
    });
});
window.addEventListener('hashchange', e => {
  const old = normHash(new URL(e.oldURL).hash), now = normHash(location.hash);
  if (!old.startsWith('#/leer/')) fromHash = old;
  const scOld = screenOf(old), scNow = screenOf(now), pgOld = pageOf(old), pgNow = pageOf(now);
  let goingBack = backBtn; backBtn = false;
  if (typeof history.state?.i === 'number') { goingBack ||= history.state.i < histI; histI = history.state.i; }
  else history.replaceState({ ...(history.state || {}), i: ++histI }, '');
  if (!trail.length || trail[trail.length - 1].sc !== scOld) trail.push({ hash: old, sc: scOld, y: 0 });
  const top = trail[trail.length - 1];
  top.hash = old; top.y = scrollY;
  let restoreY = null, keepTabs = false;
  if (scNow === scOld) {
    // otra pestaña de la misma página: si la barra de pestañas estaba arriba, sigue arriba
    // (otro artículo, volumen o número: misma pantalla para «atrás», pero se entra por arriba)
    const ty = pgNow === pgOld && tabbed(pgOld) ? artTabsY() : null;
    keepTabs = ty != null && (scrollY >= ty - 1 || (pinned === pgOld && !userScrolled));
    top.hash = now;
  } else if (goingBack && trail.length > 1 && trail[trail.length - 2].sc === scNow) {
    // de vuelta a la pantalla anterior: a la altura a la que se dejó
    trail.pop();
    const prev = trail[trail.length - 1];
    restoreY = prev.y; prev.hash = now;
  } else {
    trail.push({ hash: now, sc: scNow, y: 0 });
    if (trail.length > 60) trail.splice(0, trail.length - 60);
  }
  navInfo = { restoreY, keepTabs };
  pinned = keepTabs ? pgOld : null;
  userScrolled = false;
  if (lib()) route(); // si los datos aún cargan, la primera ruta ya leerá el hash actual
});

// ---------------------------------------------------------------- exportar e importar los datos del lector
// Los datos del lector están en localStorage con claves «mx.…». Se exportan todos menos los que describen este
// dispositivo (si está instalada o descargada) en un archivo JSON con una cabecera que lo identifica.
const DATA_APP = 'lector-marx-xxi', DATA_SKIP = ['mx.offline', 'mx.installed'];
const dataKeys = () => Object.keys(localStorage).filter(k => k.startsWith('mx.') && !DATA_SKIP.includes(k));
/** Resumen de unos datos para la confirmación: subrayados, textos empezados, en Mi lista, leídos. */
function dataSummary(d) {
  const n = k => { try { const v = JSON.parse(d[k] ?? 'null'); return Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0; } catch { return 0; } };
  return `${n('mx.hl')} marcadores, ${n('mx.pos')} textos empezados, ${n('mx.read')} leídos y ${n('mx.list')} en Mi lista${d['mx.legend'] ? ', con la leyenda personalizada' : ''}`;
}
function exportData() {
  const datos = Object.fromEntries(dataKeys().map(k => [k, localStorage.getItem(k)]));
  const file = { app: DATA_APP, formato: 1, exportado: new Date().toISOString(), version: lib()?.v || '', datos };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }));
  a.download = `lector-marx-xxi-datos-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Datos exportados: ${dataSummary(datos)}`);
}
async function importData(f) {
  let file;
  try { file = JSON.parse(await f.text()); } catch { file = null; }
  if (!file || file.app !== DATA_APP || !file.datos || typeof file.datos !== 'object') {
    confirmDialog({ title: 'No se puede importar', text: 'El archivo no es una exportación de datos de este lector.', ok: 'Entendido', cancel: null });
    return;
  }
  const datos = Object.fromEntries(Object.entries(file.datos).filter(([k, v]) => k.startsWith('mx.') && !DATA_SKIP.includes(k) && typeof v === 'string'));
  const when = file.exportado ? new Date(file.exportado).toLocaleString('es') : 'fecha desconocida';
  const yes = await confirmDialog({
    title: 'Importar datos',
    text: `El archivo (exportado el ${when}) tiene ${dataSummary(datos)}.
Sustituirá los datos de este navegador: ${dataSummary(Object.fromEntries(dataKeys().map(k => [k, localStorage.getItem(k)])))}.`,
    ok: 'Importar', danger: true,
  });
  if (!yes) return;
  try {
    dataKeys().forEach(k => localStorage.removeItem(k));
    for (const [k, v] of Object.entries(datos)) localStorage.setItem(k, v);
  } catch {
    confirmDialog({ title: 'No se pudo importar', text: 'El navegador no ha permitido guardar los datos (¿ventana privada o sin espacio?).', ok: 'Entendido', cancel: null });
    return;
  }
  try { sessionStorage.setItem('mx.imported', '1'); } catch { /* sin almacenamiento */ }
  location.reload(); // todo se vuelve a leer con los datos importados
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-export]')) exportData();
  else if (e.target.closest('[data-import]')) $('#import-file')?.click();
});
document.addEventListener('change', e => {
  if (e.target.id !== 'import-file' || !e.target.files?.[0]) return;
  importData(e.target.files[0]);
  e.target.value = ''; // poder volver a elegir el mismo archivo
});

// ---------------------------------------------------------------- instalar y usar sin conexión
// Android y Chrome/Edge de escritorio avisan de que la app se puede instalar (beforeinstallprompt): se guarda
// el aviso para lanzarlo desde el botón. En iPhone y iPad no existe: se explica cómo hacerlo en Safari.
// Instalar es también descargarla entera: al pulsar el botón y, en la app instalada, al abrirla tras cada
// versión nueva, se bajan en segundo plano los textos íntegros y las tipografías (lo demás ya lo precarga sw.js).
let installEvt = null;
// ¿Ya instalada en este dispositivo, aunque ahora se abra en el navegador? Lo recuerda el navegador donde se
// instaló (appinstalled) y, en Chrome y Edge, lo confirma getInstalledRelatedApps (related_applications del
// manifiesto). Si vuelve a ofrecerse la instalación (beforeinstallprompt), es que ya no lo está.
let installedHere = (() => { try { return localStorage.getItem('mx.installed') === '1'; } catch { return false; } })();
const setInstalled = on => { installedHere = on; try { on ? localStorage.setItem('mx.installed', '1') : localStorage.removeItem('mx.installed'); } catch { /* sin almacenamiento */ } };
navigator.getInstalledRelatedApps?.().then(apps => { if (apps.length && !installedHere) { setInstalled(true); renderInstall(); } }).catch(() => {});
// tras instalarla desde el navegador: la aplicación se usa desde su icono, y la primera vez termina de descargarse
const INSTALLED_TIP = 'Ábrela desde su icono (en la pantalla de inicio o en el escritorio) para usarla como aplicación. La primera vez que la abras, hazlo con conexión: termina de descargarse para poder usarla también sin conexión.';
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installHtml() {
  // versión nueva ya descargada y a la espera: solo el aviso y «Actualizar» (el aviso flotante remite aquí)
  const upd = waitingSw ? `<p class="install-new">${ICON.refresh}Hay una nueva versión de la aplicación para descargar.</p>
    <button type="button" class="btn" data-update>${ICON.refresh}Actualizar</button>` : '';
  if (upd) return upd;
  if (isStandalone()) return `<p class="install-ok"><span class="tick" aria-hidden="true">✓</span>La última versión ya está instalada en el dispositivo.</p>`;
  if (installEvt) return `<button type="button" class="btn" id="install-app">${ICON.download}Instalar la aplicación</button>
    <p class="muted small">Se añadirá su icono a la pantalla de inicio o al escritorio, se abrirá como una aplicación y quedará descargada entera para usarla sin conexión.</p>`;
  if (installedHere) return `<p class="install-ok"><span class="tick" aria-hidden="true">✓</span>La aplicación ya está instalada en este dispositivo.</p>
    <p class="muted small">${INSTALLED_TIP}</p>`;
  if (isIOS()) return '<p>Para instalarla en iPhone o iPad, desde Safari: pulsa <b>Compartir</b> (el cuadrado con la flecha) y elige <b>Añadir a pantalla de inicio</b>.</p><p class="muted small">Después, ábrela una primera vez desde su icono, con conexión, y déjala abierta un momento: en iPhone y iPad la aplicación instalada no comparte lo guardado en Safari, y es entonces cuando se descargan los textos para usarla sin conexión.</p>';
  // el navegador sabe ofrecer la instalación con un botón pero no la ofrece: o ya está instalada (y no se ha podido
  // saber) o aún no cumple las condiciones (p. ej. ventana privada)
  if ('BeforeInstallPromptEvent' in window) return '<p>Si ya la instalaste, ábrela desde su icono. Si no, desde el menú del navegador elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>; si no aparece la opción, se puede usar igual desde aquí.</p>';
  return '<p>Este navegador no permite instalarla con un botón. Búscalo en su menú (<b>Instalar</b>, <b>Añadir a pantalla de inicio</b> o <b>Añadir al Dock</b>); si no aparece la opción, se puede usar igual desde aquí.</p>';
}
const renderInstall = () => { const el = $('#install-area'); if (el) el.innerHTML = installHtml(); };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; setInstalled(false); renderInstall(); });
addEventListener('appinstalled', () => {
  installEvt = null; setInstalled(true); renderInstall();
  downloadAll(); // también si se instaló desde el menú del navegador (con el botón ya se está descargando)
  confirmDialog({ title: 'Aplicación instalada', text: INSTALLED_TIP, ok: 'Entendido', cancel: null });
});
document.addEventListener('click', async e => {
  if (!e.target.closest('#install-app') || !installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice.catch(() => null);
  installEvt = null;
  renderInstall();
  downloadAll(true); // la instale o no, queda descargada entera
});

/** Descarga entera para usarla sin conexión: todos los archivos de data/ (textos íntegros incluidos), iconos y
 *  tipografías de lectura, con las mismas rutas que usa la app (el service worker los guarda tal cual).
 *  Se recuerda por versión de los datos: tras publicar cambios, la app instalada vuelve a descargar. */
let downloading = false;
async function downloadAll(announce = false) {
  if (downloading || !navigator.serviceWorker?.controller) return;
  downloading = true;
  try {
    let failed = 0;
    const get = url => fetch(url).then(r => { if (!r.ok) failed++; }, () => { failed++; });
    const files = (await fetch(dataUrl('files.json')).then(r => r.json()).catch(() => []))
      .map(f => f.replace(/^data\//, '')).filter(f => f !== 'files.json');
    if (!files.length) return;
    for (let i = 0; i < files.length; i += 6) await Promise.all(files.slice(i, i + 6).map(f => get(dataUrl(f))));
    await Promise.all(['img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/favicon-32.png'].map(get));
    // tipografías: todos los archivos de css/fonts.css (fonts/, en el propio servidor)
    const fontCss = await fetch('css/fonts.css').then(r => r.text()).catch(() => '');
    await Promise.all([...new Set(fontCss.match(/fonts\/[\w.-]+\.woff2/g) || [])].map(get));
    try { await navigator.storage?.persist?.(); } catch { /* lo decide el navegador */ }
    if (!failed) try { localStorage.setItem('mx.offline', lib().v || '1'); } catch { /* sin almacenamiento */ }
    if (announce) toast(failed ? 'Descarga incompleta: se reintentará al abrir la aplicación' : 'Lista para usar sin conexión');
  } finally { downloading = false; }
}
/** App instalada: al abrirla tras una versión nueva (o la primera vez), descarga en segundo plano. */
function autoDownload() {
  if (!isStandalone()) return;
  let done = null;
  try { done = localStorage.getItem('mx.offline'); } catch { /* sin almacenamiento */ }
  if (done === (lib().v || '1')) return;
  navigator.serviceWorker?.ready.then(() => setTimeout(() => downloadAll(), 3000));
}

// ---------------------------------------------------------------- arranque

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
loadLibrary().then(() => {
  route(); autoDownload();
  try { if (sessionStorage.getItem('mx.updated')) { sessionStorage.removeItem('mx.updated'); toast('Aplicación actualizada'); } } catch { /* sin almacenamiento */ }
  try { if (sessionStorage.getItem('mx.imported')) { sessionStorage.removeItem('mx.imported'); toast('Datos importados'); } } catch { /* sin almacenamiento */ }
}).catch(err => {
  view.innerHTML = `<div class="wrap"><p class="empty">No se pudieron cargar los contenidos (${esc(err.message)}). Si has abierto el archivo directamente desde el disco, sírvelo con un servidor local: <code>python -m http.server</code>.</p></div>`;
});

// ---------------------------------------------------------------- actualización de la app
// El navegador comprueba sw.js al abrir la app (y aquí, además, cada vez que vuelve a primer plano y al entrar en
// «Acerca de»). Si ha cambiado, instala la versión nueva, que se queda a la espera sin tomar el control: así no se
// mezclan en la sesión abierta código nuevo y datos viejos. Mientras espera se ofrece «Actualizar» (barra flotante y
// «Acerca de › Instalar»); al pulsarlo la nueva toma el control y la app se recarga entera. Si no se pulsa, se activa
// sola al cerrar la app del todo. Tras la recarga, autoDownload() baja los textos de la versión nueva.
let swReg = null, waitingSw = null, askedUpdate = false, updateSeen = false; // updateSeen: «Aceptar» pulsado en el aviso
const renderUpdate = () => {
  const el = $('#update');
  if (el) {
    const show = !!waitingSw && !updateSeen;
    el.hidden = !show;
    // el aviso dura 5 segundos y se difumina durante 1 (hasta que desaparece se puede pulsar Aceptar o Actualizar)
    clearTimeout(renderUpdate._t); clearTimeout(renderUpdate._f);
    el.classList.remove('fading');
    if (show) {
      renderUpdate._f = setTimeout(() => el.classList.add('fading'), 5000);
      renderUpdate._t = setTimeout(() => { updateSeen = true; el.hidden = true; el.classList.remove('fading'); }, 6000);
    }
  }
  renderInstall();
};
document.addEventListener('click', e => { if (e.target.closest('[data-update-ok]')) { updateSeen = true; renderUpdate(); } });
const checkUpdate = () => swReg?.update().catch(() => {});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // primera visita: el service worker recién instalado toma el control sin que haya que recargar nada
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    swReg = reg;
    const ready = w => { if (w && navigator.serviceWorker.controller) { waitingSw = w; renderUpdate(); } };
    ready(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => { if (nw.state === 'installed') ready(reg.waiting); });
    });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!(hadController || askedUpdate) || reloading) return;
    reloading = true;
    try { sessionStorage.setItem('mx.updated', '1'); } catch { /* sin almacenamiento */ }
    location.reload();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
}
document.addEventListener('click', e => {
  if (!e.target.closest('[data-update]')) return;
  askedUpdate = true;
  if (waitingSw) waitingSw.postMessage('skipWaiting'); else location.reload();
});

export { route };
