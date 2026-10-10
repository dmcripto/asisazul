// Lógica pura de pictogramas (sin DOM). Pictogramas: ARASAAC (https://arasaac.org), CC BY-NC-SA.
export const API = 'https://api.arasaac.org/v1/pictograms/es/search/';
export const IMG = 'https://static.arasaac.org/pictograms/';

// "Yo camino al colegio" -> ['yo', 'camino', 'al', 'colegio']
export const tokenize = (text) => String(text ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

export const searchUrl = (word) => API + encodeURIComponent(word);
export const imageUrl = (id, size = 500) => `${IMG}${Number(id)}/${Number(id)}_${size}.png`;

// De la respuesta de la API se guardan solo los ids (hasta `max` alternativas).
export const ids = (results, max = 8) =>
  (Array.isArray(results) ? results : []).map((r) => r && r._id).filter((n) => Number.isInteger(n)).slice(0, max);

// Cambia al pictograma alternativo siguiente (vuelve al primero al final).
export const nextAlt = (item) => (item.alts.length ? { ...item, i: (item.i + 1) % item.alts.length } : item);
