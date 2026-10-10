// Copia de seguridad de los datos del teléfono. Lógica pura.
export const KEYS = { agenda: 'agenda-tea-v1', extras: 'asisazul-extras-v1' };
const MAX = 5 * 1024 * 1024;

export function makeBackup(agenda, extras, now = Date.now()) {
  return JSON.stringify({ app: 'asisazul', version: 1, savedAt: new Date(now).toISOString(), agenda: agenda || {}, extras: extras || {} }, null, 2);
}

// Valida el archivo antes de tocar nada. Lanza un error con un mensaje claro si algo no cuadra.
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX) throw new Error('El archivo es demasiado grande o está vacío.');
  let b; try { b = JSON.parse(text); } catch { throw new Error('El archivo no es una copia de Asisazul.'); }
  if (!b || b.app !== 'asisazul' || b.version !== 1) throw new Error('El archivo no es una copia de Asisazul.');
  const a = b.agenda || {}, x = b.extras || {};
  const isArr = (v) => v === undefined || Array.isArray(v);
  if (!isArr(a.events) || !isArr(a.generated) || !isArr(x.routines) || !isArr(x.signals) || !isArr(x.contacts)) throw new Error('La copia está dañada.');
  if (a.template != null && typeof a.template !== 'string') throw new Error('La copia está dañada.');
  if ((a.events || []).some((e) => !e || typeof e.date !== 'string' || typeof e.title !== 'string')) throw new Error('La copia está dañada.');
  return { agenda: a, extras: x, savedAt: b.savedAt };
}
