import { tokenize, searchUrl, imageUrl, ids, nextAlt } from './pictos.js';

const $ = (id) => document.getElementById(id);
const CK = 'asisazul-pictos-v1';
let cache = {};
try { cache = JSON.parse(localStorage.getItem(CK)) || {}; } catch {}
const saveCache = () => { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch {} };

let items = []; // [{ word, alts:[ids], i }]

async function lookup(word) {
  if (cache[word]) return cache[word];
  try {
    const r = await fetch(searchUrl(word));
    if (!r.ok) throw new Error(r.status);
    const found = ids(await r.json());
    cache[word] = found; saveCache();
    return found;
  } catch { return null; } // sin conexión o error: no se guarda, se puede reintentar
}

function draw() {
  const box = $('pList'); box.textContent = '';
  for (const [n, it] of items.entries()) {
    const card = document.createElement('div'); card.className = 'pcard';
    if (it.alts.length) {
      const img = document.createElement('img');
      img.src = imageUrl(it.alts[it.i]); img.alt = it.word; img.loading = 'lazy';
      card.append(img);
    } else {
      const no = document.createElement('div'); no.className = 'pnone';
      no.textContent = it.alts === null ? 'Sin conexión' : 'Sin imagen';
      card.append(no);
    }
    const w = document.createElement('b'); w.textContent = it.word; card.append(w);
    const bar = document.createElement('div'); bar.className = 'pbar';
    const mk = (label, aria, fn) => { const b = document.createElement('button'); b.textContent = label; b.setAttribute('aria-label', `${aria} ${it.word}`); b.onclick = fn; bar.append(b); };
    if (it.alts.length > 1) mk('↻', 'Otra imagen para', () => { items[n] = nextAlt(it); draw(); });
    mk('✕', 'Quitar', () => { items.splice(n, 1); draw(); });
    card.append(bar); box.append(card);
  }
  $('pEmpty').hidden = items.length > 0;
}

async function build() {
  const words = tokenize($('pText').value);
  items = words.map((word) => ({ word, alts: [], i: 0 }));
  draw();
  const found = await Promise.all(words.map(lookup));
  items = words.map((word, n) => ({ word, alts: found[n] ?? null, i: 0 }));
  draw();
}

$('pGo').onclick = build;
$('pText').onkeydown = (e) => { if (e.key === 'Enter') build(); };
$('pPrint').onclick = () => window.print();
$('pSpeak').onclick = () => {
  if (!('speechSynthesis' in window)) return alert('Tu navegador no puede leer en voz alta.');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(items.map((i) => i.word).join(' ') || $('pText').value);
  u.lang = 'es-AR'; u.rate = 0.9; speechSynthesis.speak(u);
};

// Dictado: opcional, porque el navegador puede enviar el audio a un servidor externo.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) $('pMic').hidden = true;
$('pMic').onclick = () => {
  if (!confirm('Atención: al dictar, tu navegador puede enviar el audio a un servidor externo (por ejemplo, Google en Chrome). Si hablas de temas de salud, mejor escribe. ¿Quieres dictar igual?')) return;
  const r = new SR(); r.lang = 'es-AR'; r.interimResults = false;
  $('pMic').textContent = '🎙 Escuchando…';
  r.onresult = (e) => { $('pText').value = e.results[0][0].transcript; build(); };
  r.onend = () => { $('pMic').textContent = '🎙 Dictar'; };
  r.onerror = () => { $('pMic').textContent = '🎙 Dictar'; };
  r.start();
};
draw();
