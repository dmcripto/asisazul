// Calma: respiración guiada y ejercicio 5-4-3-2-1. Lógica pura.
export const PATTERN = [{ name: 'Inhala', ms: 4000 }, { name: 'Mantén', ms: 2000 }, { name: 'Exhala', ms: 6000 }];

// En qué fase de la respiración se está tras `elapsed` ms.
export function breathPhase(elapsed, pattern = PATTERN) {
  const total = pattern.reduce((a, p) => a + p.ms, 0);
  let t = Math.max(0, elapsed) % total;
  for (const [idx, p] of pattern.entries()) {
    if (t < p.ms) return { name: p.name, idx, left: Math.ceil((p.ms - t) / 1000), cycle: Math.floor(Math.max(0, elapsed) / total) };
    t -= p.ms;
  }
}
export const GROUNDING = [
  'Mira alrededor y nombra 5 cosas que ves.',
  'Toca 4 cosas y siente cómo son.',
  'Escucha 3 sonidos.',
  'Busca 2 olores que reconozcas.',
  'Piensa en 1 cosa que te gusta.',
];
