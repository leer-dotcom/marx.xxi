// Carga de contenidos (data/), textos íntegros bajo demanda, búsqueda y almacenamiento local.

let library = null;
const textCache = new Map();

export async function loadLibrary() {
  if (library) return library;
  const res = await fetch('data/content.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('No se pudo cargar data/content.json');
  library = await res.json();
  library.v = library.build ? '?v=' + library.build : '';
  // Textos de «Acerca de» (créditos y aviso de IA); opcional
  library.about = await fetch('data/about.json' + library.v).then(r => r.ok ? r.json() : null).catch(() => null);
  library.allArticles = library.volumes.flatMap(v => v.articles.map(a => ({ v, a })));
  library.glossary = library.allArticles
    .flatMap(({ v, a }) => a.concepts.map(c => ({ c, a, v })))
    .sort((x, y) => fold(x.c.term).localeCompare(fold(y.c.term), 'es'));
  return library;
}

export const lib = () => library;
/** Ruta a un archivo de data/ con la versión de compilación (evita servir copias viejas de la caché). */
export const dataUrl = path => 'data/' + path + (library?.v || '');
export const volume = n => library.volumes.find(v => v.number === n);
export function article(id) {
  const hit = library.allArticles.find(x => x.a.id === id);
  return hit || null;
}
export function neighbours(id) {
  const i = library.allArticles.findIndex(x => x.a.id === id);
  return { prev: library.allArticles[i - 1]?.a || null, next: library.allArticles[i + 1]?.a || null };
}

/** Bloques del texto limpio: "# " sección, "§ " nota, "> " epígrafe, resto párrafo. */
export async function text(path) {
  if (textCache.has(path)) return textCache.get(path);
  const res = await fetch(dataUrl(path));
  if (!res.ok) throw new Error('No se pudo cargar ' + path);
  const raw = await res.text();
  const blocks = raw.split('\n\n').map(s => s.trim()).filter(Boolean).map(s => {
    if (s.startsWith('# ')) return { k: 'h', t: s.slice(2) };
    if (s.startsWith('§ ')) return { k: 'n', t: s.slice(2) };
    if (s.startsWith('> ')) return { k: 'e', t: s.slice(2) };
    return { k: 'p', t: s };
  });
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
  title: ['Título', 'soft'], summary: ['Resumen', 'soft'], argument: ['Argumento', 'soft'],
  concept: ['Concepto', ''], conclusion: ['Conclusión', 'olive'], thesis: ['Tesis común', 'olive'],
  fulltext: ['Texto íntegro', ''],
};

export function searchGuide(q) {
  const f = fold(q).trim();
  if (f.length < 2) return [];
  const has = s => fold(s || '').includes(f);
  const hits = [];
  for (const v of library.volumes) {
    for (const a of v.articles) {
      if (has(a.title) || has(a.author)) hits.push({ kind: 'title', v, a, label: a.title, text: a.author });
      for (const c of a.concepts) if (has(c.term) || has(c.definition)) hits.push({ kind: 'concept', v, a, label: c.term, text: snippet(c.definition, q) });
      const s = a.summary.find(has);
      if (s) hits.push({ kind: 'summary', v, a, label: a.title, text: snippet(s, q) });
      const st = a.argument.find(x => has(x.title) || has(x.text));
      if (st) hits.push({ kind: 'argument', v, a, label: st.title, text: snippet(st.text, q) });
    }
    for (const c of v.conclusions) if (has(c.title) || has(c.text)) hits.push({ kind: 'conclusion', v, label: c.title, text: snippet(c.text, q) });
  }
  for (const t of library.cross_volume.theses) if (has(t.title) || has(t.text)) hits.push({ kind: 'thesis', label: t.title, text: snippet(t.text, q) });
  const order = Object.keys(KIND);
  return hits.sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind));
}

/** Recorre los 48 textos; llama a onHit por cada coincidencia y onProgress(i, total). Cancelable con signal. */
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
      if (fold(blocks[b].t).includes(f)) {
        onHit({ kind: 'fulltext', v, a, label: a.title, text: snippet(blocks[b].t, q), block: b });
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

  positions() { return LS.get('mx.pos', {}); },
  position(id) { return this.positions()[id] || null; },
  savePosition(id, block, progress) {
    const all = this.positions();
    all[id] = { block, progress, t: Date.now() };
    LS.set('mx.pos', all);
    LS.set('mx.last', id);
    if (progress >= 0.98) this.setRead(id, true);
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
};
