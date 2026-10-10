// Registro de señales (ánimo, sobrecarga sensorial, crisis). Lógica pura.
export const TRIGGERS = ['ruido', 'luces', 'multitud', 'cambio de rutina', 'hambre o sueño', 'olor o textura', 'otro'];
export const OVERLOAD = ['Nada', 'Poco', 'Mucha', 'Muchísima'];

// Resumen de los últimos `days` días: cantidad, crisis, ánimo promedio y disparadores más frecuentes.
export function summarize(entries, now, days = 7) {
  const from = now - days * 86400000;
  const e = entries.filter((x) => x.ts >= from && x.ts <= now);
  const moods = e.map((x) => x.mood).filter((m) => m >= 1 && m <= 5);
  const count = {};
  for (const x of e) for (const t of x.triggers || []) count[t] = (count[t] || 0) + 1;
  return {
    n: e.length,
    crises: e.filter((x) => x.crisis).length,
    avgMood: moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
    top: Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

// CSV para llevar a terapia. Evita que Excel ejecute fórmulas (= + - @).
const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
export function toCSV(entries) {
  const pad = (n) => String(n).padStart(2, '0');
  const rows = [['fecha', 'hora', 'ánimo (1-5)', 'sobrecarga (0-3)', 'crisis', 'disparadores', 'nota']];
  for (const x of [...entries].sort((a, b) => a.ts - b.ts)) {
    const d = new Date(x.ts);
    rows.push([`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, `${pad(d.getHours())}:${pad(d.getMinutes())}`, x.mood ?? '', x.overload ?? '', x.crisis ? 'sí' : 'no', (x.triggers || []).join('; '), x.note || '']);
  }
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
