// Rutinas paso a paso. Lógica pura. El avance se reinicia cada día.
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fresh = (r, day) => (r.day === day ? r : { ...r, day, done: {} });

export function toggleStep(r, stepId, day) {
  const f = fresh(r, day), done = { ...f.done };
  if (done[stepId]) delete done[stepId]; else done[stepId] = true;
  return { ...f, done };
}
export function progress(r, day) {
  const f = fresh(r, day), total = r.steps.length, done = r.steps.filter((s) => f.done[s.id]).length;
  return { done, total, complete: total > 0 && done === total };
}
export const isDone = (r, stepId, day) => !!fresh(r, day).done[stepId];

// Un paso por línea (máximo 30).
export const parseSteps = (text) => String(text ?? '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 30);
// Palabra para buscar el pictograma: la primera de 4 letras o más.
export function pictoWord(line) {
  const w = String(line ?? '').toLowerCase().match(/\p{L}+/gu) || [];
  return w.find((x) => x.length >= 4) || w[0] || '';
}

export const EXAMPLES = {
  'Rutina de la mañana': ['Despertarme', 'Lavarme los dientes', 'Vestirme', 'Desayunar', 'Preparar la mochila'],
  'Rutina de la noche': ['Cenar', 'Bañarme', 'Ponerme el pijama', 'Lavarme los dientes', 'Dormir'],
};
