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
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 19h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/></svg>',
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
        <button type="button" class="btn ghost" data-answer="0">${esc(cancel)}</button>
        <button type="button" class="btn${danger ? ' danger' : ''}" data-answer="1" autofocus>${esc(ok)}</button>
      </div>`;
    let done = false;
    const finish = yes => { if (done) return; done = true; if (d.open) d.close(); d.remove(); resolve(yes); };
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-answer]');
      if (b) finish(b.dataset.answer === '1');
      else if (e.target === d) finish(false); // fuera de la ventana
    });
    d.addEventListener('cancel', e => { e.preventDefault(); finish(false); }); // Esc
    d.addEventListener('close', () => finish(false));
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
  // en «Mapas conceptuales», qué esquema es (volumen o número, artículo y título) antes de su descripción
  const zh = host.closest('[data-zlabel]'), zl = zh?.dataset.zlabel, cap = host.dataset.caption || '';
  // los primeros `zhi` tramos (volumen o número y nº de artículo) van en el color del volumen
  const zseg = zl ? zl.split(' · ') : [], zhi = +(zh?.dataset.zhi || 0);
  const zlHtml = zseg.slice(0, zhi).map(t => `<span class="zl-hi">${esc(t)}</span>`).concat(zseg.length > zhi ? [esc(zseg.slice(zhi).join(' · '))] : []).join(' · ');
  $('#zoom-caption').innerHTML = zl ? `<b class="zoom-label">${zlHtml}</b>${cap ? ' ' + esc(cap) : ''}` : esc(cap);
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
    <button type="button" data-zoom data-caption="${esc(cap)}" aria-label="Ampliar esquema: ${esc(label)}">
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
    <details class="m-pub"${openIf(path === '#/' || path === '')}><summary class="m-group">Biblioteca</summary>
    ${link('#/', 'Colección', ICON.home)}
    ${last ? link(`#/leer/${last.a.id}`, `Seguir leyendo<small>${esc(last.a.title)}</small>`, ICON.book) : ''}
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
  // en móvil el aviso se puede plegar; se recuerda por página solo durante la sesión (sessionStorage)
  const abKey = 'mx.about.' + (p ? p.id : 'coleccion');
  let folded = false;
  try { folded = sessionStorage.getItem(abKey) === '0'; } catch { /* sin almacenamiento: desplegado */ }
  return `<h2 class="sec-title">Herramientas de estudio</h2>
    <div class="grid two">
      <div class="about-banner${folded ? ' folded' : ''}" data-ab-key="${abKey}">
        ${toolCard('#/acerca', 'info', 'Acerca de', 'Las revistas, la IA y la aplicación')}
        <p>El objetivo de esta aplicación es divulgativo, facilitando la lectura y el subrayado del contenido en dispositivos digitales.<span class="p-gap"></span>
        Los resúmenes y esquemas que acompañan cada texto se han elaborado con Claude Fable 5.1, de Anthropic —uno de los modelos
        de IA más avanzados— como apoyo al estudio. No obstante, <strong>en ningún caso son sustitutos de la lectura de los textos completos</strong>,
        y han de analizarse críticamente a la luz de estos, pues podrían contener inexactitudes y errores.
        <button type="button" class="ab-toggle ab-less" data-ab-toggle>…menos</button></p>
        <button type="button" class="ab-toggle ab-more" data-ab-toggle>Mostrar más…</button>
      </div>
      ${toolCard(p ? `#/mapas?p=${p.id}` : '#/mapas', 'map', 'Mapas conceptuales', 'Esquemas de artículos y publicaciones')}
      ${toolCard(p ? `#/glosario?p=${p.id}` : '#/glosario', 'az', 'Glosario', `${gl.length} conceptos`)}
      ${toolCard('#/autores', 'people', 'Autores', p ? `${au.length} firmas en ${esc(p.name)}` : `${au.length} firmas en ${L.pubs.length > 1 ? 'las dos revistas' : 'la revista'}`)}
      ${toolCard(p ? `#/buscar?p=${p.id}` : '#/buscar', 'search', 'Búsqueda', 'Guía y textos íntegros')}
      ${toolCard('#/marcadores', 'mark', 'Marcadores', 'Subrayados y notas propias')}
      ${toolCard('#/ajustes', 'aa', 'Modo lectura', 'Configura cómo ves los textos')}
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
      <span>Basado en: <a href="https://marxxxi.com/" rel="noopener" target="_blank">marxxxi.com</a> · <a href="#/acerca">Acerca de este lector</a> · <a href="#/creditos">Créditos</a></span>
    </footer>`;

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
        ? 'Dos revistas del mismo proyecto socialista. Marx XXI es la de fondo: cada volumen fija a conciencia una pieza de la estrategia. Nuevo Ciclo es la de coyuntura: cada trimestre pone ese marco a prueba frente a lo que está ocurriendo. Textos íntegros, guías de estudio y los enlaces entre ambas. Esta aplicación facilita su lectura, subrayado y estudio en dispositivos digitales.'
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

function articleView(id, tab = 0) {
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
  } else body = guideTab(a, tab);
  return `<div class="wrap has-fab" data-vol="${v.key}">
    <header class="page-head with-aside vol-head art-band"><div class="ph-main">
      <a class="eyebrow ph-pub" href="${v.pub.home}">${esc(v.pub.name)}</a>
      <a class="eyebrow vol ph-vol" href="${v.href}">${esc(volHead(v).replace(v.pub.name + ' ', ''))}</a>
      <div class="eyebrow vol ph-art">${isInterview(a) ? 'Entrevista' : `Artículo ${a.number}`}</div>
      <h1>${esc(a.title)}</h1><div class="by">${esc(byline(a))}</div>
      ${a.interviewee ? `<div class="muted small">${esc(a.author)}</div>` : ''}</div>
      ${(() => {
        // paso dentro del volumen o número: antes del primero, el propio volumen; después del último, sus conclusiones
        const i = v.articles.indexOf(a), pa = v.articles[i - 1], na = v.articles[i + 1];
        const toVol = { href: v.href, label: volShort(v), tip: volHead(v), vol: v.key };
        const toConcl = { href: `${v.href}/2`, label: 'Concl.', tip: `Conclusiones · ${volHead(v)}`, vol: v.key };
        const toArt = x => ({ href: `#/articulo/${x.id}/${tab}`, label: artLabel(x), tip: x.title, vol: v.key });
        return headNav(pa ? toArt(pa) : toVol, na ? toArt(na) : toConcl, 'Artículos contiguos');
      })()}</header>
    ${tabs(`#/articulo/${a.id}`, ART_TABS, tab, TAB.texto)}
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
      ${multi ? `<div class="chips" id="g-pub">${[['', 'Toda la colección'], ...L.pubs.map(p => [p.id, p.name]), ['puentes', 'Puentes']].map(([k, label]) =>
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
function mapsView(params) {
  setBar('Mapas conceptuales');
  const L = lib(), S = L.synthesis;
  // zl: qué esquema es (revista, volumen o número, artículo y título), antepuesto a su descripción al ampliarlo
  const titled = (title, f, href, zl = '', zhi = 0) => f ? `<div class="dg-item"${zl ? ` data-zlabel="${esc(zl)}" data-zhi="${zhi}"` : ''}>
    ${href ? `<a class="dg-title" href="${href}">${title}</a>` : `<div class="dg-title">${title}</div>`}${figure(f)}</div>` : '';
  const pubSection = p => {
    const cv = p.cross_volume, mx = p.id === 'marx-xxi';
    const tesis = thesesHref(p, 1); // pestaña Mapa conceptual
    return `<details class="maps-sec" id="mapas-${p.id}">
      <summary><h2 class="sec-title">${esc(p.name)}</h2></summary>
      <details class="maps-sub">
        <summary>Mapas comunes de la revista</summary>
        <div class="dg-gallery">
          ${titled(`Mapa conceptual · Los ${numWord(p.volumes.length)} ${esc(p.unit_plural)}`, cv.map, tesis,
            `${p.name} · Mapa conceptual · Los ${numWord(p.volumes.length)} ${p.unit_plural}`)}
          ${titled('Trayectoria de la publicación', cv.arc, p.home, `${p.name} · Trayectoria de la publicación`)}
          ${p.volumes.map(v => `<div data-vol="${v.key}">${titled(
            `<b>${esc(volShort(v))}</b> · ${esc(v.label ? monthName(v.month) : v.title)}`, v.concept_map, `${v.href}/3`,
            `${v.label ? 'Número ' + v.label : 'Volumen ' + v.number} · ${v.articles.length} artículos`, 1)}</div>`).join('')}
        </div>
      </details>
      ${p.volumes.map(v => {
        const n = v.articles.reduce((s, a) => s + a.diagrams.length, 0) + (v.concept_map ? 1 : 0);
        return `<details class="maps-sub" data-vol="${v.key}">
        <summary><i class="m-dot"></i><span>${esc(volHead(v))}</span><span class="m-count">${n}</span></summary>
        <div class="dg-gallery">
          ${titled(`<b>${v.label ? 'Número ' + esc(v.label) : 'Volumen ' + v.number}</b> · ${v.articles.length} artículos`, v.concept_map, `${v.href}/3`,
            `${v.label ? 'Número ' + v.label : 'Volumen ' + v.number} · ${v.articles.length} artículos`, 1)}
          ${v.articles.filter(a => a.diagrams.length).map(a => {
            const zl = `${volShort(v)} · ${artLabel(a)} · ${a.title}`;
            return titled(`<b>${esc(artLabel(a))}</b> · ${esc(a.title)}<small>${esc(byline(a))}</small>`,
              a.diagrams[0], `#/articulo/${a.id}/${TAB.esquema}`, zl, 2)
              + a.diagrams.slice(1).map(d => `<div class="dg-item" data-zlabel="${esc(zl)}" data-zhi="2">${figure(d)}</div>`).join('');
          }).join('')}
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
      history.replaceState(null, '', '#/autores' + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
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
      history.replaceState(null, '', '#/buscar' + (qs.toString() ? '?' + qs : ''));
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
function bookmarksView(params) {
  setBar('Marcadores');
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
      const del = () => { store.removeHighlight(b.dataset.del); route(); };
      if (!h?.note.trim()) return del();
      confirmDialog({ title: 'Eliminar el subrayado', text: 'También se borrará la nota que escribiste en él.', ok: 'Eliminar', danger: true })
        .then(yes => yes && del());
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

/** La app tiene siempre sus propios colores (los claros de marxxxi.com), sin seguir el modo oscuro del sistema.
 *  El tema de los ajustes de lectura solo se aplica mientras se lee (body.reading); ahí «Sistema» sí sigue al
 *  dispositivo. */
export function applyTheme(s = store.settings()) {
  const root = document.documentElement;
  if (!document.body.classList.contains('reading')) root.dataset.theme = 'light';
  else if (s.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  const head = getComputedStyle(document.documentElement).getPropertyValue('--head').trim();
  document.querySelector('meta[name=theme-color]').content = head || '#2c332f';
}

/** Aplica los ajustes de lectura como variables CSS y clases sobre un contenedor .reader. */
export function styleReader(el, s) {
  if (s.theme === 'system') delete el.dataset.theme; else el.dataset.theme = s.theme;
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
function aboutSec(title, paragraphs, cls = '') {
  // «## …» es un título intermedio; **…**, negrita
  return paragraphs?.length ? `<section class="card about ${cls}"><h2>${esc(title)}</h2>${paragraphs.map(t => t.startsWith('## ')
    ? `<h3>${esc(t.slice(3))}</h3>` : `<p>${esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}</section>` : '';
}

/** «Sobre Marx XXI», «Sobre Nuevo Ciclo»: su texto y un enlace a la publicación en marxxxi.com (site_url). */
function magSec(id, name, mag) {
  return `<section class="card about" id="sobre-${id}">
      <h2>${esc(mag.title || 'Sobre ' + name)}</h2>
      ${paras(mag.paragraphs || [])}
      ${mag.site_url ? `<a class="btn ghost" href="${esc(mag.site_url)}" rel="noopener" target="_blank">Ver ${esc(name)} en marxxxi.com</a>` : ''}
    </section>`;
}

function aboutView() {
  setBar('Acerca de');
  const L = lib(), ab = L.about || {};
  const mag = ab.magazine || {};
  // Textos propios de las demás publicaciones (p. ej. data/nuevo-ciclo/about.json)
  const others = L.pubs.filter(p => p.id !== 'marx-xxi' && p.about);
  return `<div class="wrap">
    <header class="page-head"><div class="eyebrow">Lector de Marx XXI</div><h1>Acerca de</h1>
      <div class="sub">Qué objetivos tiene este lector, cómo se han elaborado sus guías de estudio, qué son Marx XXI y Nuevo Ciclo, y cómo instalarlo y usarlo sin conexión.</div></header>

    ${aboutSec(ab.ai?.title || 'Objetivo y uso de la IA', [...(ab.ai?.paragraphs || []), ...others.flatMap(p => p.about.ai?.paragraphs || [])], 'ai')}

    ${magSec('marx-xxi', 'Marx XXI', mag)}
    ${others.map(p => magSec(p.id, p.name, p.about.magazine || {})).join('')}

    <section class="card about" id="aplicacion">
      <h2>Código abierto</h2>
      <p>Como ejercicio de transparencia, esta aplicación es abierta: el código, los textos íntegros, las guías de estudio, los esquemas y los datos están publicados en un repositorio público de GitHub, con el historial completo de cambios.</p>
      <p>Cualquiera puede consultarlo, descargarlo o hacer su propia copia; los cambios en esta aplicación, no obstante, solo los publica quien la mantiene.</p>
      <a class="btn ghost" href="${REPO_URL}" rel="noopener" target="_blank">${ICON.code}Ver el repositorio en GitHub</a>
    </section>

    <section class="card about" id="instalar">
      <h2>Instalar y usar sin conexión</h2>
      ${ab.privacy ? `<p>${esc(ab.privacy)}</p>` : ''}
      <div id="install-area" class="install-area">${installHtml()}</div>
    </section>

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
  applyTheme(); // tema de lectura al entrar en el lector; el del sistema al salir
  if (parts[0] === 'acerca') {
    if (parts[1] === 'instalar') document.getElementById('instalar')?.scrollIntoView();
    checkUpdate();
  }
}

// que el navegador tampoco restaure el scroll al volver atrás o recargar
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// Pantalla desde la que se llegó (sin contar los cambios dentro del propio lector): el «Volver» del lector
// regresa al volumen o número si se entró desde ahí
let fromHash = '';
export const cameFrom = () => fromHash;
// Memoria de desplazamiento de una sola pantalla: la inmediatamente anterior y dónde se dejó
// pinned: guía de artículo en la que la barra de pestañas estaba (o se quiso dejar) arriba; si una pestaña corta
// obligó a mostrar la cabecera y no se ha desplazado desde entonces, la siguiente pestaña vuelve a dejarla arriba
let prevScreen = null, navInfo = null, userScrolled = false, pinned = null;
for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, () => { userScrolled = true; }, { passive: true });
const artId = h => (h.match(/^#\/articulo\/([^/?]+)/) || [])[1];
/** En la guía de un artículo, desplazamiento a partir del cual la barra de pestañas queda fija arriba. */
function artTabsY() {
  const head = view.querySelector('.page-head'), tabs = view.querySelector('.tabs');
  if (!head || !tabs) return null;
  const cs = getComputedStyle(tabs);
  return Math.max(0, head.getBoundingClientRect().bottom + scrollY + parseFloat(cs.marginTop) - parseFloat(cs.top));
}
window.addEventListener('hashchange', e => {
  // la portada es «#/» o, al abrir la app por primera vez, sin hash: las dos cuentan como la misma pantalla
  const norm = h => h && h !== '#' ? h : '#/';
  const old = norm(new URL(e.oldURL).hash), now = norm(location.hash);
  if (!old.startsWith('#/leer/')) fromHash = old;
  const id = artId(old), ty = id ? artTabsY() : null;
  const stuck = ty != null && scrollY >= ty - 1, wanted = pinned === id && !userScrolled;
  navInfo = {
    restoreY: prevScreen && prevScreen.hash === now ? prevScreen.y : null,
    keepTabs: !!id && id === artId(now) && (stuck || wanted),
  };
  pinned = navInfo.keepTabs ? id : null;
  prevScreen = { hash: old, y: scrollY };
  userScrolled = false;
  if (lib()) route(); // si los datos aún cargan, la primera ruta ya leerá el hash actual
});

// ---------------------------------------------------------------- instalar y usar sin conexión
// Android y Chrome/Edge de escritorio avisan de que la app se puede instalar (beforeinstallprompt): se guarda
// el aviso para lanzarlo desde el botón. En iPhone y iPad no existe: se explica cómo hacerlo en Safari.
// Instalar es también descargarla entera: al pulsar el botón y, en la app instalada, al abrirla tras cada
// versión nueva, se bajan en segundo plano los textos íntegros y las tipografías (lo demás ya lo precarga sw.js).
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/** Fecha del sello de los datos cargados («11/10/2026 00:57»), que renueva cada publicación. */
function dataDate() {
  const m = (lib()?.v || '').match(/(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : '';
}
function installHtml() {
  // versión nueva ya instalada y a la espera: «Actualizar» antes que nada (también en la barra flotante)
  const upd = waitingSw ? `<p class="install-new"><span class="tick" aria-hidden="true">↑</span>Hay una versión nueva del lector.</p>
    <button type="button" class="btn" data-update>${ICON.refresh}Actualizar</button>` : '';
  const d = dataDate();
  if (isStandalone()) return upd + `<p class="install-ok"><span class="tick" aria-hidden="true">✓</span>La aplicación ya está instalada en este dispositivo${!waitingSw && d ? ` y está al día (versión del ${d})` : ''}. Las versiones nuevas se detectan al abrirla y se ofrecen aquí y en un aviso flotante.</p>`;
  if (upd) return upd;
  if (installEvt) return `<button type="button" class="btn" id="install-app">${ICON.download}Instalar la aplicación</button>
    <p class="muted small">Se añadirá su icono a la pantalla de inicio o al escritorio, se abrirá como una aplicación y quedará descargada entera para usarla sin conexión.</p>`;
  if (isIOS()) return '<p>Para instalarla en iPhone o iPad, desde Safari: pulsa <b>Compartir</b> (el cuadrado con la flecha) y elige <b>Añadir a pantalla de inicio</b>. Al abrirla desde su icono se descargará entera para usarla sin conexión.</p>';
  return '<p>Para instalarla, desde el menú del navegador elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>. Si no aparece la opción, tu navegador no permite instalarla; se puede usar igual desde aquí.</p>';
}
const renderInstall = () => { const el = $('#install-area'); if (el) el.innerHTML = installHtml(); };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
addEventListener('appinstalled', () => { installEvt = null; renderInstall(); toast('Aplicación instalada'); });
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
    const fams = [...new Set(['"Alegreya SC"', ...Object.values(FONTS).map(([, css]) => css.split(',')[0])])].filter(f => !/system/.test(f));
    await Promise.all(fams.flatMap(f => ['400', 'italic 400', '700', 'italic 700'].map(w => document.fonts.load(`${w} 1em ${f}`).catch(() => null))));
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
}).catch(err => {
  view.innerHTML = `<div class="wrap"><p class="empty">No se pudieron cargar los contenidos (${esc(err.message)}). Si has abierto el archivo directamente desde el disco, sírvelo con un servidor local: <code>python -m http.server</code>.</p></div>`;
});

// ---------------------------------------------------------------- actualización de la app
// El navegador comprueba sw.js al abrir la app (y aquí, además, cada vez que vuelve a primer plano y al entrar en
// «Acerca de»). Si ha cambiado, instala la versión nueva, que se queda a la espera sin tomar el control: así no se
// mezclan en la sesión abierta código nuevo y datos viejos. Mientras espera se ofrece «Actualizar» (barra flotante y
// «Acerca de › Instalar»); al pulsarlo la nueva toma el control y la app se recarga entera. Si no se pulsa, se activa
// sola al cerrar la app del todo. Tras la recarga, autoDownload() baja los textos de la versión nueva.
let swReg = null, waitingSw = null, askedUpdate = false;
const renderUpdate = () => { const el = $('#update'); if (el) el.hidden = !waitingSw; renderInstall(); };
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
