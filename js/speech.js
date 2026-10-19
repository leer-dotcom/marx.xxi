// Lectura en voz alta con las voces del propio dispositivo (Web Speech API): sin servidor ni audios guardados.
// Lee el texto sin marcas de cada bloque (b.p, el mismo que usan los subrayados) frase a frase, resalta la frase y
// la palabra que suenan (CSS Custom Highlight API) y sigue la lectura desplazando el texto. Las notas al pie no se
// leen. Voz, velocidad y tono se guardan en «mx.voz» (se exportan con el resto de datos del lector).
// Estudio de la alternativa con audios pregrabados (no implementada): docs/LECTURA-EN-VOZ-ALTA.md.
import { esc, store } from './data.js';
import { openSheet, toast } from './app.js';

export const speechSupported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

const S = () => window.speechSynthesis;
const $ = (s, el = document) => el.querySelector(s);
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13M16 5.5v13"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 5.5v13M18 5.5L9 12l9 6.5z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M18 5.5v13M6 5.5L15 12l-9 6.5z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  voice: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
};
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const fmtRate = r => (Math.round(r * 100) / 100).toString().replace('.', ',') + '×';

// ---------------------------------------------------------------- voces
/** Voces en español, las de más calidad primero (las «naturales» o en línea de Edge, Chrome, Safari). */
function spanishVoices() {
  const good = v => /natural|online|neural|google|premium|enhanced|mejorad/i.test(v.name);
  return S().getVoices()
    .filter(v => /^es\b|^es[-_]/i.test(v.lang))
    .sort((a, b) => good(b) - good(a) || (b.lang.toLowerCase() === 'es-es') - (a.lang.toLowerCase() === 'es-es') || a.name.localeCompare(b.name));
}
function pickVoice(pref) {
  const vs = spanishVoices();
  return vs.find(v => v.voiceURI === pref) || vs[0] || null;
}

// ---------------------------------------------------------------- texto
/** Trocea el texto de un bloque en frases (como mucho MAX caracteres): cada trozo es una locución.
 *  Así se puede resaltar la frase que suena, retomar en ella y evitar que Chrome corte las locuciones largas. */
const MAX = 260;
function chunk(t) {
  const out = [];
  const push = (a, b) => {
    while (b - a > MAX) {
      const win = t.slice(a, a + MAX);
      let cut = Math.max(win.lastIndexOf(', '), win.lastIndexOf('; '), win.lastIndexOf(': '), win.lastIndexOf(' —'));
      if (cut < MAX / 3) cut = win.lastIndexOf(' ');
      cut = cut <= 0 ? MAX : cut + 1;
      out.push([a, a + cut]); a += cut;
    }
    if (b > a) out.push([a, b]);
  };
  const ends = /[.!?…]+[»”"')\]]*\s+/g;
  let s = 0;
  for (let m; (m = ends.exec(t));) {
    const e = m.index + m[0].length;
    if (e - s >= 40) { push(s, e); s = e; } // frases muy cortas (o abreviaturas: «p. 13»), con la siguiente
  }
  push(s, t.length);
  return out.map(([a, b]) => ({ a, t: t.slice(a, b) })).filter(c => c.t.trim());
}

// Las posiciones de b.p se cuentan sobre el texto visible sin llamadas a nota, viñetas ni fuente de la cita
const SKIP = '.fn,.mk,.cite';
function textNodes(el) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const out = [];
  for (let n; (n = w.nextNode());) out.push(n);
  return out;
}
/** Range de los caracteres [from, to) del bloque. */
function rangeOf(el, from, to) {
  const r = document.createRange();
  let pos = 0, started = false, last = null;
  for (const n of textNodes(el)) {
    const a = pos, b = pos + n.length;
    pos = b; last = n;
    if (!started && from < b) { r.setStart(n, Math.max(0, from - a)); started = true; }
    if (started && to <= b) { r.setEnd(n, Math.max(0, to - a)); return r; }
  }
  if (!started) return null;
  r.setEnd(last, last.length);
  return r;
}
const hlApi = typeof Highlight === 'function' && !!globalThis.CSS?.highlights;
function setHighlight(name, range) {
  if (!hlApi) return;
  if (range) CSS.highlights.set(name, new Highlight(range)); else CSS.highlights.delete(name);
}

// ---------------------------------------------------------------- reproductor
/**
 * Reproductor del modo lectura. `els` son los bloques en pantalla ([data-b]); `startBlock()` da el bloque por el
 * que empezar (el que se está viendo); `intro`, el título y la autoría, que se leen si se empieza desde arriba;
 * `onToggle(abierto)` avisa al abrir o cerrar el reproductor.
 */
export function speechPlayer({ reader, blocks, els, startBlock, intro, topH, onToggle }) {
  let prefs = store.voice();
  let q = [], pos = { qi: 0, ci: 0, off: 0 }, word = 0, playing = false, open = false, uid = 0, userT = 0;
  let curEl = null;

  const bar = document.createElement('div');
  bar.className = 'tts-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Lectura en voz alta');
  bar.hidden = true;
  bar.innerHTML = `<div class="inner">
    <button class="icon-btn" data-tts="close" aria-label="Cerrar la lectura en voz alta" title="Cerrar">${ICON.x}</button>
    <button class="icon-btn" data-tts="prev" aria-label="Párrafo anterior" title="Párrafo anterior">${ICON.prev}</button>
    <button class="icon-btn tts-play" data-tts="play" aria-label="Reproducir">${ICON.play}</button>
    <button class="icon-btn" data-tts="next" aria-label="Párrafo siguiente" title="Párrafo siguiente">${ICON.next}</button>
    <button class="tts-rate" data-tts="rate" aria-label="Velocidad" title="Velocidad">${fmtRate(prefs.rate)}</button>
    <button class="icon-btn" data-tts="voice" aria-label="Voz y velocidad" title="Voz y velocidad">${ICON.voice}</button>
  </div>`;
  document.body.append(bar);

  /** Bloques que se leen, en orden: los visibles con texto (sin separadores, tablas ni notas). */
  function build() {
    q = els.filter(e => e.offsetParent !== null && !e.matches('.sep,.tbl,.note'))
      .map(e => ({ b: +e.dataset.b, el: e, text: blocks[+e.dataset.b]?.p || '' }))
      .filter(x => x.text.trim());
    if (intro) q.unshift({ b: -1, el: null, text: intro });
    for (const x of q) x.chunks = chunk(x.text);
  }
  const qiOf = b => { const i = q.findIndex(x => x.b >= b); return i < 0 ? q.length - 1 : i; };

  function ui() {
    const p = $('[data-tts="play"]', bar);
    p.innerHTML = playing ? ICON.pause : ICON.play;
    p.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir');
    $('[data-tts="rate"]', bar).textContent = fmtRate(prefs.rate);
    const rb = document.querySelector('.reader-bottom');
    bar.style.setProperty('--rb-h', (rb?.offsetHeight || 0) + 'px');
  }
  function mark(item, from, to, wFrom, wTo) {
    if (curEl !== item.el) { curEl?.classList.remove('tts-on'); curEl = item.el; curEl?.classList.add('tts-on'); }
    if (!item.el) { setHighlight('mx-tts-s', null); setHighlight('mx-tts-w', null); return; }
    setHighlight('mx-tts-s', rangeOf(item.el, from, to));
    setHighlight('mx-tts-w', wTo > wFrom ? rangeOf(item.el, wFrom, wTo) : null);
  }
  function clearMarks() {
    curEl?.classList.remove('tts-on'); curEl = null;
    setHighlight('mx-tts-s', null); setHighlight('mx-tts-w', null);
  }
  /** Mantiene a la vista lo que suena, salvo si el lector acaba de desplazar el texto por su cuenta. */
  function follow(range, el) {
    if (Date.now() - userT < 6000) return;
    const r = range?.getClientRects()[0] || el?.getBoundingClientRect();
    if (!r) return;
    const bottom = innerHeight - bar.offsetHeight - (document.body.classList.contains('chrome-hidden') ? 0 : (document.querySelector('.reader-bottom')?.offsetHeight || 0)) - 16;
    if (r.top >= topH() && r.bottom <= bottom) return;
    const dy = r.top - innerHeight * 0.3;
    // saltos largos (párrafo siguiente, tocar más abajo), de golpe; al seguir la lectura, suave
    window.scrollTo({ top: scrollY + dy, behavior: Math.abs(dy) > innerHeight * 1.5 ? 'auto' : 'smooth' });
  }

  function speakChunk() {
    const item = q[pos.qi];
    if (!item) { stop(); toast('Fin del texto'); return; }
    const c = item.chunks[pos.ci];
    if (!c) { pos = { qi: pos.qi + 1, ci: 0, off: 0 }; return speakChunk(); }
    const base = c.a + pos.off, text = c.t.slice(pos.off);
    word = pos.off;
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(prefs.voice);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-ES';
    u.rate = prefs.rate; u.pitch = prefs.pitch;
    const id = ++uid;
    u.onstart = () => {
      if (id !== uid) return;
      mark(item, c.a, c.a + c.t.length);
      follow(item.el && rangeOf(item.el, base, base + 1), item.el);
    };
    u.onboundary = e => {
      if (id !== uid || (e.name && e.name !== 'word')) return;
      const len = e.charLength || (text.slice(e.charIndex).match(/^[^\s]+/) || [''])[0].length;
      word = pos.off + e.charIndex;
      const w0 = base + e.charIndex;
      mark(item, c.a, c.a + c.t.length, w0, w0 + len);
      if (item.el) follow(rangeOf(item.el, w0, w0 + len));
    };
    u.onend = () => {
      if (id !== uid || !playing) return;
      pos = { qi: pos.qi, ci: pos.ci + 1, off: 0 };
      speakChunk();
    };
    u.onerror = e => {
      if (id !== uid || e.error === 'interrupted' || e.error === 'canceled') return;
      playing = false; ui();
      toast(e.error === 'not-allowed' ? 'Pulsa ▶ para empezar a escuchar' : 'No se pudo leer en voz alta');
    };
    if (S().paused) S().resume();
    S().speak(u);
  }
  /** Corta lo que suena (sin disparar el paso al siguiente trozo). */
  function hush() { uid++; S().cancel(); }

  function play() {
    if (!q.length) build();
    if (!q.length) return;
    playing = true; ui(); hush();
    speakChunk();
  }
  function pause() {
    if (!playing) return;
    playing = false; hush();
    pos.off = word; // al reanudar, desde la última palabra que sonó
    ui();
  }
  function goBlock(qi) {
    pos = { qi: Math.max(0, Math.min(q.length - 1, qi)), ci: 0, off: 0 };
    const item = q[pos.qi];
    mark(item, 0, 0);
    if (item.el) { userT = 0; follow(null, item.el); }
    if (playing) { hush(); speakChunk(); }
  }
  /** Aplica un cambio de voz, velocidad o tono a lo que está sonando: retoma en la última palabra. */
  function restart() {
    if (!playing) return;
    hush(); pos.off = word; speakChunk();
  }
  function stop() {
    playing = false; hush(); clearMarks(); ui();
  }
  function savePrefs() { store.saveVoice(prefs); }

  function openBar() {
    if (!S().getVoices().length && !spanishVoices().length) {
      // en algunos navegadores la lista de voces llega un instante después
      setTimeout(() => { if (!spanishVoices().length) toast('Este navegador no tiene voces en español instaladas'); }, 1200);
    }
    open = true;
    build();
    const sb = startBlock();
    pos = { qi: intro && sb === null ? 0 : qiOf(sb ?? 0), ci: 0, off: 0 };
    ui(); // ya a la altura de la barra inferior antes de mostrarse (sin deslizarse desde el borde)
    bar.hidden = false;
    document.body.classList.add('tts-open');
    onToggle?.(true);
    play();
  }
  function close() {
    stop();
    open = false;
    bar.hidden = true;
    document.body.classList.remove('tts-open');
    onToggle?.(false);
  }

  function openVoiceSheet() {
    const render = () => {
      const vs = spanishVoices(), cur = pickVoice(prefs.voice);
      return `
      <div class="set-group">Voz</div>
      ${vs.length ? `<select class="tts-voices" id="tts-voice" aria-label="Voz">${vs.map(v =>
        `<option value="${esc(v.voiceURI)}" ${v === cur ? 'selected' : ''}>${esc(v.name.replace(/^Microsoft |^Google /, ''))} · ${esc(v.lang)}${v.localService ? '' : ' · en línea'}</option>`).join('')}</select>
        <button type="button" class="link-btn" data-test>Probar la voz</button>`
      : '<p class="muted">Este navegador no ofrece voces en español. Puedes instalarlas en los ajustes de voz o de texto a voz del sistema.</p>'}
      <div class="set-group">Lectura</div>
      <div class="range-row"><label for="tts-rate">Velocidad</label><output id="tts-rate-o">${fmtRate(prefs.rate)}</output>
        <input type="range" id="tts-rate" min="0.5" max="2" step="0.05" value="${prefs.rate}"></div>
      <div class="range-row"><label for="tts-pitch">Tono</label><output id="tts-pitch-o">${(+prefs.pitch).toFixed(1).replace('.', ',')}</output>
        <input type="range" id="tts-pitch" min="0.5" max="1.5" step="0.1" value="${prefs.pitch}"></div>
      <p class="muted small" style="margin-top:14px">Se usan las voces de este dispositivo: cambian de un navegador a otro. Las más naturales suelen ser las «Natural» de Edge, las de Google en Chrome y Android, y las «mejoradas» de iPhone y Mac. Si no suena nada, revisa el volumen y las voces instaladas en el sistema.</p>`;
    };
    openSheet('Lectura en voz alta', render(), body => {
      let t = 0;
      const later = fn => { clearTimeout(t); t = setTimeout(fn, 250); };
      body.oninput = e => {
        if (e.target.id === 'tts-rate') { prefs.rate = +e.target.value; $('#tts-rate-o', body).textContent = fmtRate(prefs.rate); ui(); savePrefs(); later(restart); }
        if (e.target.id === 'tts-pitch') { prefs.pitch = +e.target.value; $('#tts-pitch-o', body).textContent = prefs.pitch.toFixed(1).replace('.', ','); savePrefs(); later(restart); }
      };
      body.onchange = e => {
        if (e.target.id === 'tts-voice') { prefs.voice = e.target.value; savePrefs(); restart(); }
      };
      body.onclick = e => {
        if (!e.target.closest('[data-test]')) return;
        const was = playing; pause();
        const u = new SpeechSynthesisUtterance('Así suena esta voz leyendo los textos de Marx XXI.');
        const v = pickVoice(prefs.voice); if (v) { u.voice = v; u.lang = v.lang; }
        u.rate = prefs.rate; u.pitch = prefs.pitch;
        if (was) u.onend = () => { if (open && !playing) play(); };
        S().speak(u);
      };
      // la lista de voces puede llegar después de abrir la ventana
      if (!spanishVoices().length) S().addEventListener('voiceschanged', () => { if ($('#sheet').open) body.innerHTML = render(); }, { once: true });
    });
  }

  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-tts]'); if (!b) return;
    const k = b.dataset.tts;
    if (k === 'play') playing ? pause() : play();
    else if (k === 'close') close();
    else if (k === 'next') goBlock(pos.qi + 1);
    else if (k === 'prev') goBlock(pos.ci > 0 || word > 10 ? pos.qi : pos.qi - 1); // al principio del párrafo; si ya está, al anterior
    else if (k === 'rate') {
      const i = RATES.findIndex(r => r > prefs.rate + 0.01);
      prefs.rate = RATES[i < 0 ? 0 : i]; savePrefs(); ui(); restart();
    }
    else if (k === 'voice') openVoiceSheet();
  });

  // con el reproductor abierto, tocar un párrafo lo lee desde ahí
  const onTap = e => {
    if (!open || e.target.closest('a,button,mark.hl,.fn') || String(getSelection()).length || reader.classList.contains('hl-mode')) return;
    const el = e.target.closest('[data-b]'); if (!el) return;
    const qi = q.findIndex(x => x.el === el); if (qi < 0) return;
    e.stopPropagation(); // no mostrar u ocultar las barras
    userT = 0;
    if (!playing) { pos = { qi, ci: 0, off: 0 }; play(); } else goBlock(qi);
  };
  reader.addEventListener('click', onTap, true);
  // el lector desplaza el texto: durante unos segundos no se le lleva a lo que suena
  const onUser = () => { userT = Date.now(); };
  for (const ev of ['wheel', 'touchmove', 'keydown']) addEventListener(ev, onUser, { passive: true });
  const onResize = () => open && ui();
  addEventListener('resize', onResize);
  // la lista de voces llega tarde en Chrome: si aún no había, reintentar con la elegida
  const onVoices = () => { if (playing && !pickVoice(prefs.voice)) restart(); };
  S().addEventListener?.('voiceschanged', onVoices);
  S().getVoices(); // pedirla ya

  return {
    toggle: () => (open ? close() : openBar()),
    isOpen: () => open,
    destroy() {
      close();
      reader.removeEventListener('click', onTap, true);
      for (const ev of ['wheel', 'touchmove', 'keydown']) removeEventListener(ev, onUser);
      removeEventListener('resize', onResize);
      S().removeEventListener?.('voiceschanged', onVoices);
      bar.remove();
    },
  };
}
