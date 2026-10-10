// Carga de contenidos (data/), textos íntegros bajo demanda, búsqueda y almacenamiento local.
//
// La biblioteca reúne varias publicaciones (data/library.json): Marx XXI (volúmenes) y Nuevo Ciclo (números).
// Cada una tiene su content.json con el mismo esquema. Los ids de artículo no se repiten entre publicaciones
// (t1-a1 en Marx XXI, n1-a1 en Nuevo Ciclo), así que las rutas #/articulo/<id> y #/leer/<id> valen para todas.

let library = null;
const textCache = new Map();

// Manifiesto por defecto (si falta data/library.json, la web funciona solo con Marx XXI)
const DEFAULT_PUBS = [{ id: 'marx-xxi', name: 'Marx XXI', kind: 'Revista-libro temática', content: 'content.json',
  unit: 'Volumen', unit_plural: 'volúmenes', unit_short: 'Vol.', route: 'volumen', key: '', home: '#/marx-xxi', complete: true }];

export async function loadLibrary() {
  if (library) return library;
  const getJson = async (path, opts) => {
    const res = await fetch('data/' + path, opts);
    if (!res.ok) throw new Error('No se pudo cargar data/' + path);
    return res.json();
  };
  const manifest = await getJson('library.json', { cache: 'no-cache' }).catch(() => ({ publications: DEFAULT_PUBS }));
  // El content.json de Marx XXI lleva el sello de compilación (?v=…) que usan todas las rutas de datos
  const first = await getJson(manifest.publications[0].content, { cache: 'no-cache' });
  const v = first.build ? '?v=' + first.build : '';
  const pubs = await Promise.all(manifest.publications.map(async (m, i) => {
    const content = i === 0 ? first : await getJson(m.content + v).catch(() => null);
    if (!content) return null;
    const about = m.about ? await getJson(m.about + v).catch(() => null) : null;
    const pub = { ...m, ...content, about };
    for (const vol of pub.volumes) {
      vol.pub = pub;
      vol.key = (m.key || '') + vol.number;            // data-vol: «1»… en Marx XXI, «n1»… en Nuevo Ciclo
      vol.href = `#/${m.route}/${vol.number}`;
      vol.cover = m.cover ? m.cover.replace('{n}', vol.number) : null; // img/mxxi1.webp, img/nc1.webp…
    }
    return pub;
  }));
  library = { pubs: pubs.filter(Boolean), v, manifest };
  library.byId = Object.fromEntries(library.pubs.map(p => [p.id, p]));
  // Textos de «Acerca de» (créditos y aviso de IA); opcional
  library.about = await getJson('about.json' + v).catch(() => null);
  library.synthesis = manifest.synthesis ? await getJson(manifest.synthesis + v).catch(() => null) : null;
  library.allArticles = library.pubs.flatMap(p => p.volumes.flatMap(vol => vol.articles.map(a => ({ v: vol, a }))));
  library.byArticle = new Map(library.allArticles.map(x => [x.a.id, x]));
  library.refs = crossRefs();
  library.glossary = glossary();
  library.authors = authors();
  return library;
}

export const lib = () => library;
/** Ruta a un archivo de data/ con la versión de compilación (evita servir copias viejas de la caché). */
export const dataUrl = path => 'data/' + path + (library?.v || '');
/** Publicación por id ('marx-xxi', 'nuevo-ciclo'); sin id, la primera (Marx XXI). */
export const pub = id => (id ? library.byId[id] : library.pubs[0]) || null;
export const volume = (n, pubId) => pub(pubId)?.volumes.find(v => v.number === n) || null;
export const article = id => library.byArticle.get(id) || null;
/** Anterior y siguiente dentro de la misma publicación (cruza de volumen o número). */
export function neighbours(id) {
  const hit = article(id);
  const list = library.allArticles.filter(x => x.v.pub === hit?.v.pub);
  const i = list.findIndex(x => x.a.id === id);
  return { prev: list[i - 1]?.a || null, next: list[i + 1]?.a || null };
}

// ---------- etiquetas según la publicación ----------
// Marx XXI: «Volumen 3», «Vol. 3», «Art. 2». Nuevo Ciclo: «Nuevo Ciclo #003», «#003», «Art. 2» o «Entrevista».

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** "2025-09" → "septiembre de 2025" */
export const monthName = ym => { const [y, m] = (ym || '').split('-'); return m ? `${MONTHS[+m - 1]} de ${y}` : (y || ''); };
const isNumbered = v => !!v.label;
/** «Volumen 3» · «Nuevo Ciclo #003» */
export const volName = v => isNumbered(v) ? `${v.pub.name} ${v.label}` : `${v.pub.unit} ${v.number}`;
/** «Vol. 3» · «#003» */
/** Sigla de una publicación: «NC» para Nuevo Ciclo (iniciales del nombre), salvo que el manifiesto dé `short`. */
export const pubShort = p => p.short || p.name.split(/\s+/).map(w => w[0]).join('').toUpperCase();
/** «Vol. 3» · «NC#003» */
export const volShort = v => isNumbered(v) ? `${pubShort(v.pub)}${v.label}` : `${v.pub.unit_short || 'Vol.'} ${v.number}`;
/** Cabecera de volumen: «Volumen 3 · Independencia política» · «Nuevo Ciclo #003 · marzo de 2026» */
export const volHead = v => isNumbered(v) ? `${volName(v)} · ${monthName(v.month)}` : `${volName(v)} · ${v.title}`;
/** Fecha corta del volumen: «2024» · «marzo de 2026» */
export const volDate = v => v.month ? monthName(v.month) : (v.year ? String(v.year) : '');
export const isInterview = a => a.type === 'interview';
/** «Art. 2» · «Entrevista» */
export const artLabel = a => isInterview(a) ? 'Entrevista' : `Art. ${a.number}`;
/** Nombre destacado: el autor o, en las entrevistas, el entrevistado. */
export const byline = a => a.interviewee || a.author;

// ---------- referencias cruzadas (cross_refs de cada publicación) ----------
// { from, to: 'marx-xxi:t4-a7' | 'n2-a5', kind: 'cita'|'tema'|'autor', why }

function crossRefs() {
  const out = [];
  for (const p of library.pubs) {
    for (const r of p.cross_refs || []) {
      const to = r.to.includes(':') ? r.to.split(':')[1] : r.to;
      if (article(r.from) && article(to)) out.push({ ...r, to });
    }
  }
  return out;
}
/** Textos relacionados con un artículo: los que cita o trata (out) y los que lo citan (in). */
export function related(id) {
  return library.refs.flatMap(r => r.from === id ? [{ ...r, dir: 'out', other: article(r.to) }]
    : r.to === id ? [{ ...r, dir: 'in', other: article(r.from) }] : []);
}

// ---------- glosario y autores unificados ----------

function glossary() {
  // Conceptos puente: los que la síntesis de la biblioteca enlaza en las dos revistas, y los términos
  // que aparecen con el mismo nombre en publicaciones distintas.
  const bridge = new Set();
  for (const b of library.synthesis?.bridge_concepts || []) {
    for (const x of [...(b.marx_xxi || []), ...(b.nuevo_ciclo || [])]) bridge.add(x.article + '|' + fold(x.term));
  }
  const all = library.allArticles.flatMap(({ v, a }) => a.concepts.map(c => ({ c, a, v, pub: v.pub })));
  const pubsByTerm = new Map();
  for (const e of all) {
    const k = fold(e.c.term).trim();
    if (!pubsByTerm.has(k)) pubsByTerm.set(k, new Set());
    pubsByTerm.get(k).add(e.pub.id);
  }
  for (const e of all) e.bridge = bridge.has(e.a.id + '|' + fold(e.c.term)) || pubsByTerm.get(fold(e.c.term).trim()).size > 1;
  return all.sort((x, y) => fold(x.c.term).localeCompare(fold(y.c.term), 'es'));
}

// Variantes de firma de una misma persona (revisadas a mano). «Jorge Seijo» (Marx XXI) e «Ismael Seijo»
// (Nuevo Ciclo) se mantienen separados: no consta que sean la misma persona.
const AUTHOR_ALIASES = {
  'mario aguiriano beneitez': 'Mario Aguiriano', 'miasni': 'Gabriel Miasni', 'albert toscano': 'Alberto Toscano',
};
/** Firmas individuales de un texto («A y B», «A e B», «A, B»). */
export function authorNames(a) {
  const raw = a.interviewee || a.author;
  return raw.split(/\s*,\s*|\s+y\s+|\s+e\s+(?=[A-ZÁÉÍÓÚ])/).map(s => s.trim()).filter(Boolean)
    .map(n => AUTHOR_ALIASES[fold(n)] || n);
}
function authors() {
  const map = new Map();
  for (const x of library.allArticles) {
    for (const n of authorNames(x.a)) {
      const k = fold(n);
      if (!map.has(k)) map.set(k, { name: n, items: [] });
      map.get(k).items.push(x);
    }
  }
  return [...map.values()].sort((x, y) => fold(x.name).localeCompare(fold(y.name), 'es'));
}

// Marcas internas dentro del texto de cada bloque (un solo carácter de uso privado, para que
// los desplazamientos del resaltado y la búsqueda no se descuadren):
//   U+E000 cursiva (alterna) · U+E001 negrita (alterna)
//   U+F0000 + n  llamada a la nota n · U+F4000 + p  comienzo de la página impresa p
export const MK = { it: '\uE000', bd: '\uE001', note: 0xF0000, page: 0xF4000 };
const MARK_RE = /[\uE000\uE001]|[\u{F0000}-\u{F7FFF}]/gu;
/** Texto sin marcas (para buscar, medir y mostrar fragmentos). */
export const plain = t => t.replace(MARK_RE, '');

function encode(src) {
  return src
    .replace(/\[\^(\d+)\]/g, (_, n) => String.fromCodePoint(MK.note + +n))
    .replace(/\s?\[\[p\d+\]\]/g, '') // marcas de página impresa: no se muestran en el lector (siguen en los JSON)
    .replace(/\*\*/g, MK.bd)
    .replace(/(?<!\\)\*/g, MK.it)
    .replace(/\\\*/g, '*');
}

/**
 * Texto íntegro de un artículo (data/texto/<id>.json). Devuelve la lista de bloques
 * { k: 'h'|'p'|'q'|'li'|'e', t (con marcas), p (sin marcas), pg, lvl, mk, cite, cont }
 * con las propiedades `notes` (n → {text, pg}) y `orphans` (notas sin llamada en el texto).
 */
export async function text(path) {
  if (textCache.has(path)) return textCache.get(path);
  const res = await fetch(dataUrl(path));
  if (!res.ok) throw new Error('No se pudo cargar ' + path);
  const d = await res.json();
  const blocks = d.blocks.map(b => {
    if (b.t === 'tabla') { // tabla (Nuevo Ciclo): filas de celdas y pie; p = texto para buscar
      const rows = (b.rows || []).map(r => r.map(c => encode(c)));
      const caption = b.caption ? encode(b.caption) : '';
      return { k: 'tabla', t: '', rows, caption, pg: b.pg, p: plain([...rows.flat(), caption].join(' ')) };
    }
    // separador «* * *» (entrevistas): los asteriscos no son cursivas
    const t = b.t === 'sep' ? (b.text || '* * *') : encode(b.text);
    return {
      k: b.t === 'ep' ? 'e' : b.t, t, p: plain(t), pg: b.pg, lvl: b.level, mk: b.marker,
      cite: b.cite ? encode(b.cite) : '', cont: !!b.cont,
    };
  });
  blocks.notes = Object.fromEntries(Object.entries(d.notes).map(([n, v]) => [n, { ...v, text: encode(v.text) }]));
  blocks.titleNotes = d.title_notes || [];
  blocks.orphans = d.unanchored_notes || [];
  textCache.set(path, blocks);
  return blocks;
}

// ---------- normalización y resaltado ----------

/** Minúsculas sin tildes, carácter a carácter (conserva índices para resaltar). */
export function fold(s) {
  let out = '';
  for (const ch of s) {
    const f = ch.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
    out += f.length === ch.length ? f : ch; // si cambia de longitud, dejar el original
  }
  return out;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** HTML escapado con las coincidencias de q envueltas en <mark>. */
export function highlight(textStr, q) {
  const fq = fold(q || '').trim();
  if (fq.length < 2) return esc(textStr);
  const ft = fold(textStr);
  let out = '', i = 0, j;
  while ((j = ft.indexOf(fq, i)) >= 0) {
    out += esc(textStr.slice(i, j)) + '<mark>' + esc(textStr.slice(j, j + fq.length)) + '</mark>';
    i = j + fq.length;
  }
  return out + esc(textStr.slice(i));
}

export function snippet(textStr, q, radius = 90) {
  const fq = fold(q).trim();
  const i = fold(textStr).indexOf(fq);
  if (i < 0) return textStr.slice(0, radius * 2) + (textStr.length > radius * 2 ? '…' : '');
  const s = Math.max(0, i - radius), e = Math.min(textStr.length, i + fq.length + radius);
  return (s > 0 ? '…' : '') + textStr.slice(s, e).trim() + (e < textStr.length ? '…' : '');
}

// ---------- búsqueda ----------

export const KIND = {
  title: ['Título', 'soft'], summary: ['Resumen', 'soft'], argument: ['Píldoras', 'soft'],
  concept: ['Concepto', ''], conclusion: ['Conclusión', 'olive'], thesis: ['Tesis común', 'olive'],
  synthesis: ['Síntesis', 'olive'], fulltext: ['Texto íntegro', ''],
};

export function searchGuide(q) {
  const f = fold(q).trim();
  if (f.length < 2) return [];
  const has = s => fold(s || '').includes(f);
  const hits = [];
  for (const p of library.pubs) {
    for (const v of p.volumes) {
      for (const a of v.articles) {
        if (has(a.title) || has(a.author) || has(a.interviewee)) hits.push({ kind: 'title', pub: p, v, a, label: a.title, text: a.author });
        for (const c of a.concepts) if (has(c.term) || has(c.definition)) hits.push({ kind: 'concept', pub: p, v, a, label: c.term, text: snippet(c.definition, q) });
        const s = a.summary.find(has);
        if (s) hits.push({ kind: 'summary', pub: p, v, a, label: a.title, text: snippet(s, q) });
        const st = a.argument.find(x => has(x.title) || has(x.text));
        if (st) hits.push({ kind: 'argument', pub: p, v, a, label: st.title, text: snippet(st.text, q) });
      }
      for (const c of v.conclusions) if (has(c.title) || has(c.text)) hits.push({ kind: 'conclusion', pub: p, v, label: c.title, text: snippet(c.text, q) });
    }
    for (const t of p.cross_volume.theses) if (has(t.title) || has(t.text)) hits.push({ kind: 'thesis', pub: p, label: t.title, text: snippet(t.text, q) });
  }
  for (const t of library.synthesis?.theses || []) {
    const txt = [t.principle, t.application].find(has) || t.principle;
    if (has(t.title) || has(t.principle) || has(t.application)) hits.push({ kind: 'synthesis', label: t.title, text: snippet(txt, q), n: t.number });
  }
  const order = Object.keys(KIND);
  // estable: dentro de cada tipo, el orden de la biblioteca (Marx XXI y después Nuevo Ciclo)
  return hits.map((h, i) => [h, i]).sort(([x, i], [y, j]) => order.indexOf(x.kind) - order.indexOf(y.kind) || i - j).map(([h]) => h);
}

/** Recorre todos los textos; llama a onHit por cada coincidencia y onProgress(i, total). Cancelable con signal. */
export async function searchFullText(q, { onHit, onProgress, signal, perArticle = 5 }) {
  const f = fold(q).trim();
  if (f.length < 3) return;
  const all = library.allArticles;
  for (let i = 0; i < all.length; i++) {
    if (signal?.aborted) return;
    const { v, a } = all[i];
    const blocks = await text(a.text_file);
    let n = 0;
    for (let b = 0; b < blocks.length && n < perArticle; b++) {
      if (fold(blocks[b].p).includes(f)) {
        onHit({ kind: 'fulltext', pub: v.pub, v, a, label: a.title, text: snippet(blocks[b].p, q), block: b });
        n++;
      }
    }
    onProgress?.(i + 1, all.length);
  }
}

// ---------- almacenamiento local ----------

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado o lleno */ } },
};

export const DEFAULT_SETTINGS = {
  theme: 'system', font: 'alegreya', size: 20, lineHeight: 1.6, paraGap: 0.8, margin: 24, width: 680,
  justify: true, hyphens: true, indent: false, notes: true, wakeLock: false,
};

export const FONTS = {
  alegreya: ['Alegreya', 'Alegreya,Georgia,serif'],
  source: ['Source Serif', '"Source Serif 4",Georgia,serif'],
  literata: ['Literata', 'Literata,Georgia,serif'],
  atkinson: ['Atkinson', '"Atkinson Hyperlegible",system-ui,sans-serif'],
  sans: ['Alegreya Sans', '"Alegreya Sans",system-ui,sans-serif'],
  system: ['Sistema', 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],
  mono: ['Mono', '"IBM Plex Mono",ui-monospace,monospace'],
};

export const THEMES = {
  system: ['Sistema', null, null], light: ['Claro', '#efecec', '#252525'], sepia: ['Sepia', '#f8f1e3', '#3b2f22'],
  dark: ['Oscuro', '#2c332f', '#efecec'], black: ['Negro', '#000000', '#d6d3d3'],
};

export const store = {
  settings() { return { ...DEFAULT_SETTINGS, ...LS.get('mx.settings', {}) }; },
  saveSettings(s) { LS.set('mx.settings', s); },

  positions() { return LS.get('mx.pos', {}) || {}; }, // también si quedó guardado «null»
  position(id) { return this.positions()[id] || null; },
  // block y progress: dónde se dejó (el texto se abre ahí); max: el punto más avanzado al que se ha llegado,
  // que es el porcentaje de lectura que se muestra fuera del lector
  savePosition(id, block, progress) {
    const all = this.positions(), old = all[id];
    const max = Math.max(progress, old?.max ?? old?.progress ?? 0);
    all[id] = { block, progress, max, t: Date.now() };
    LS.set('mx.pos', all);
    LS.set('mx.last', id);
    if (max >= 0.98) this.setRead(id, true);
  },
  /** Porcentaje leído (0–1): el punto más avanzado, no donde se dejó. */
  reached(id) { const p = this.positions()[id]; return p ? p.max ?? p.progress ?? 0 : 0; },
  /** Reiniciar el progreso de un texto: sin posición, sin porcentaje y sin marca de leído. */
  resetProgress(id) {
    const all = this.positions();
    delete all[id];
    LS.set('mx.pos', all);
    this.setRead(id, false);
    if (this.last() === id) LS.set('mx.last', null);
  },
  last() { return LS.get('mx.last', null); },

  read() { return new Set(LS.get('mx.read', [])); },
  setRead(id, on) {
    const s = this.read();
    on ? s.add(id) : s.delete(id);
    LS.set('mx.read', [...s]);
  },

  bookmarks() { return LS.get('mx.bm', []).sort((a, b) => b.t - a.t); },
  hasBookmark(id, block) { return this.bookmarks().some(b => b.id === id && b.block === block); },
  toggleBookmark(id, block, excerpt) {
    let all = this.bookmarks();
    const had = all.some(b => b.id === id && b.block === block);
    all = had ? all.filter(b => !(b.id === id && b.block === block))
      : [...all, { id, block, excerpt: excerpt.slice(0, 180), t: Date.now() }];
    LS.set('mx.bm', all);
    return !had;
  },
  removeBookmark(id, block) { LS.set('mx.bm', this.bookmarks().filter(b => !(b.id === id && b.block === block))); },

  // Subrayados (son los «Marcadores» de la app): { uid, key, b0, o0, b1, o1, color, text, note, t }
  // b0/o0 … b1/o1 = bloque y carácter (sobre el texto sin marcas) de inicio y fin; o1 = -1 → fin del bloque.
  highlights(key) {
    let all = LS.get('mx.hl', null);
    if (!all) { // primera vez: los marcadores antiguos (un párrafo entero) pasan a subrayados amarillos
      all = LS.get('mx.bm', []).map(b => ({ uid: uid(), key: b.id, b0: b.block, o0: 0, b1: b.block, o1: -1, color: 'yellow', text: b.excerpt, note: '', t: b.t }));
      LS.set('mx.hl', all);
    }
    return (key ? all.filter(h => h.key === key) : all).sort((a, b) => b.t - a.t);
  },
  addHighlight(h) {
    const n = { uid: uid(), note: '', t: Date.now(), ...h };
    LS.set('mx.hl', [...this.highlights(), n]);
    LS.set('mx.hlColor', n.color);
    return n;
  },
  updateHighlight(id, patch) {
    LS.set('mx.hl', this.highlights().map(h => h.uid === id ? { ...h, ...patch } : h));
    if (patch.color) LS.set('mx.hlColor', patch.color);
  },
  removeHighlight(id) { LS.set('mx.hl', this.highlights().filter(h => h.uid !== id)); },
  lastColor() { return LS.get('mx.hlColor', 'yellow'); },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Colores de subrayado: clave → [nombre, color]. */
export const HL_COLORS = {
  yellow: ['Amarillo', '#f2cf4a'], green: ['Verde', '#7fd36f'], blue: ['Azul', '#6fb4ee'],
  pink: ['Rosa', '#f08ab5'], orange: ['Naranja', '#f5a04f'],
};
