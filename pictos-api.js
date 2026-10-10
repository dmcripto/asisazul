import { searchUrl, ids } from './pictos.js';

const CK = 'asisazul-pictos-v1';
let cache = {};
try { cache = JSON.parse(localStorage.getItem(CK)) || {}; } catch {}
const saveCache = () => { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch {} };

// Devuelve ids de pictogramas para una palabra; null si falla la red (no se guarda, se puede reintentar).
export async function lookup(word) {
  if (cache[word]) return cache[word];
  try {
    const r = await fetch(searchUrl(word));
    if (!r.ok) throw new Error(r.status);
    const found = ids(await r.json());
    cache[word] = found; saveCache();
    return found;
  } catch { return null; }
}
