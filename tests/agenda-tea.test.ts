import { describe, it, expect } from 'vitest';
import { planAlarms } from '../logic.js';
// @ts-ignore JS puro
import { mapDate, autoFill, dueAlarms, toICS } from '../logic.js';

describe('agenda-tea', () => {
  it('repite el n-ésimo día de la semana', () => {
    expect(mapDate('2026-03-10', 2026, 3)).toBe('2026-04-14'); // 2.º martes
  });
  it('si no existe el 5.º usa el último', () => {
    expect(mapDate('2026-03-31', 2026, 3)).toBe('2026-04-28'); // último martes
  });
  it('completa los meses siguientes una sola vez', () => {
    const s: any = { template: '2026-03', generated: [], events: [{ id: 'a', title: 'T', type: 'terapia', date: '2026-03-10', time: '10:00', remind: [10] }] };
    const n = autoFill(s, new Date(2026, 4, 5)).length; // mayo -> hasta junio
    expect(n).toBe(3);
    expect(autoFill(s, new Date(2026, 4, 5)).length).toBe(0);
    expect(s.events.filter((e: any) => e.auto).map((e: any) => e.date)).toEqual(['2026-04-14', '2026-05-12', '2026-06-09']);
  });
  it('dispara la alarma en su ventana y no se repite', () => {
    const ev = [{ id: 'a', date: '2026-03-10', time: '10:00', remind: [10] }];
    const at = new Date(2026, 2, 10, 9, 49).getTime();
    expect(dueAlarms(ev, at, {})).toHaveLength(0);
    const on = new Date(2026, 2, 10, 9, 51, 30).getTime();
    expect(dueAlarms(ev, on, {})).toHaveLength(1);
    expect(dueAlarms(ev, on, { 'a|10': true })).toHaveLength(0);
  });
  it('exporta VALARM', () => {
    expect(toICS([{ id: 'a', title: 'X', date: '2026-03-10', time: '10:00', remind: [30] }])).toContain('TRIGGER:-PT30M');
  });
});

import { tokenize, searchUrl, imageUrl, ids, nextAlt } from '../pictos.js';
describe('pictogramas', () => {
  it('separa la frase en palabras', () => {
    expect(tokenize('Yo camino al colegio.')).toEqual(['yo', 'camino', 'al', 'colegio']);
    expect(tokenize('  ')).toEqual([]);
  });
  it('arma las URLs de ARASAAC', () => {
    expect(searchUrl('niño')).toBe('https://api.arasaac.org/v1/pictograms/es/search/ni%C3%B1o');
    expect(imageUrl(6009)).toBe('https://static.arasaac.org/pictograms/6009/6009_500.png');
  });
  it('toma solo ids válidos de la respuesta', () => {
    expect(ids([{ _id: 5 }, { x: 1 }, { _id: 7 }])).toEqual([5, 7]);
    expect(ids(null)).toEqual([]);
  });
  it('rota entre alternativas', () => {
    expect(nextAlt({ alts: [1, 2], i: 1 }).i).toBe(0);
    expect(nextAlt({ alts: [], i: 0 }).i).toBe(0);
  });
});

import { distanceKm, describeDistance, directionsUrl, mapUrl, shareText } from '../geo.js';
describe('ubicación', () => {
  it('calcula la distancia en línea recta', () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })).toBe(0);
    expect(distanceKm({ lat: -34.6037, lon: -58.3816 }, { lat: -34.6137, lon: -58.3816 })).toBeCloseTo(1.11, 1);
  });
  it('describe la distancia con claridad', () => {
    expect(describeDistance(0.45)).toContain('450 m');
    expect(describeDistance(2.25)).toContain('2,3 km');
    expect(describeDistance(2.25)).toContain('a pie');
  });
  it('arma el enlace Cómo llegar', () => {
    expect(directionsUrl({ lat: -34.6, lon: -58.38 })).toContain('destination=-34.6%2C-58.38');
    expect(directionsUrl({ place: 'Av. Siempre Viva 742' })).toContain('destination=Av.%20Siempre%20Viva%20742');
    expect(directionsUrl({ place: '  ' })).toBeNull();
  });
  it('arma el enlace de mapa para compartir', () => {
    expect(mapUrl({ lat: 1, lon: 2 })).toContain('mlat=1&mlon=2');
    expect(shareText({ lat: 1, lon: 2 })).toMatch(/^Estoy aquí: https:/);
  });
});

describe('alarmas del sistema', () => {
  const ev = [{ id: 'a', title: 'Terapia', date: '2026-03-10', time: '10:00', place: 'Consultorio', remind: [1440, 10, 0] }];
  it('programa solo alarmas futuras, en orden', () => {
    const now = new Date(2026, 2, 10, 9, 0).getTime();
    const p = planAlarms(ev, now);
    expect(p.map((x) => x.key)).toEqual(['a|10', 'a|0']);
    expect(p[0].body).toBe('Faltan 10 min · 10:00 · Consultorio');
    expect(p[1].body).toContain('Es ahora');
  });
  it('respeta el límite de días y de cantidad', () => {
    const now = new Date(2026, 0, 1).getTime();
    expect(planAlarms(ev, now, 30)).toHaveLength(0);
    expect(planAlarms(ev, now, 90, 2)).toHaveLength(2);
  });
});

import { normalizeCode, validCode, expiresAt, ago, isStale, shouldSend } from '../share.js';
describe('ubicación en vivo', () => {
  it('valida el código de vinculación', () => {
    expect(normalizeCode(' ab-c23 x ')).toBe('ABC23X');
    expect(validCode('abc23x')).toBe(true);
    expect(validCode('ABC0O1')).toBe(false); // letras confusas no existen en los códigos
    expect(validCode('ABC23')).toBe(false);
  });
  it('calcula el vencimiento y la antigüedad', () => {
    const now = Date.UTC(2026, 0, 1, 10, 0, 0);
    expect(expiresAt(now, 60)).toBe('2026-01-01T11:00:00.000Z');
    expect(ago('2026-01-01T09:59:30.000Z', now)).toBe('Hace 30 s');
    expect(ago('2026-01-01T09:55:00.000Z', now)).toBe('Hace 5 min');
    expect(ago('2026-01-01T08:00:00.000Z', now)).toBe('Hace 2 h');
    expect(isStale('2026-01-01T09:40:00.000Z', now)).toBe(true);
    expect(isStale('2026-01-01T09:55:00.000Z', now)).toBe(false);
  });
  it('envía solo si se movió o pasó tiempo', () => {
    const a = { lat: -34.6, lon: -58.38, t: 0 };
    expect(shouldSend(null, a)).toBe(true);
    expect(shouldSend(a, { ...a, t: 5000 })).toBe(false);
    expect(shouldSend(a, { ...a, t: 31000 })).toBe(true);
    expect(shouldSend(a, { lat: -34.601, lon: -58.38, t: 5000 })).toBe(true); // ~111 m
  });
});

import { summarize, toCSV } from '../signals.js';
import { toggleStep, progress, parseSteps, pictoWord, dayKey } from '../routines.js';
import { breathPhase } from '../calm.js';
import { telUrl, fichaLines, helpText } from '../help.js';
describe('registro de señales', () => {
  const now = new Date(2026, 2, 10, 12).getTime();
  const e = [
    { ts: now - 3600000, mood: 2, overload: 3, crisis: true, triggers: ['ruido', 'luces'], note: 'x' },
    { ts: now - 86400000, mood: 4, overload: 0, crisis: false, triggers: ['ruido'] },
    { ts: now - 20 * 86400000, mood: 1, crisis: true, triggers: ['multitud'] },
  ];
  it('resume los últimos 7 días', () => {
    const s = summarize(e, now);
    expect(s).toMatchObject({ n: 2, crises: 1, avgMood: 3 });
    expect(s.top[0]).toEqual(['ruido', 2]);
  });
  it('exporta CSV seguro', () => {
    const c = toCSV([{ ts: now, mood: 3, crisis: false, triggers: ['ruido'], note: '=1+1, "hola"' }]);
    expect(c).toContain("\"'=1+1, \"\"hola\"\"\"");
    expect(c.split('\r\n')).toHaveLength(2);
  });
});
describe('rutinas', () => {
  const r = { id: 'r', steps: [{ id: 'a' }, { id: 'b' }], day: '2026-03-10', done: {} };
  it('marca pasos y cuenta el avance', () => {
    const r1 = toggleStep(r, 'a', '2026-03-10');
    expect(progress(r1, '2026-03-10')).toEqual({ done: 1, total: 2, complete: false });
    expect(progress(toggleStep(r1, 'b', '2026-03-10'), '2026-03-10').complete).toBe(true);
    expect(progress(toggleStep(r1, 'a', '2026-03-10'), '2026-03-10').done).toBe(0); // desmarcar
  });
  it('reinicia el avance cada día', () => {
    const r1 = toggleStep(r, 'a', '2026-03-10');
    expect(progress(r1, '2026-03-11').done).toBe(0);
    expect(dayKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
  it('lee pasos y elige la palabra del pictograma', () => {
    expect(parseSteps(' Vestirme \n\n Desayunar ')).toEqual(['Vestirme', 'Desayunar']);
    expect(pictoWord('Me lavo los dientes')).toBe('lavo');
    expect(pictoWord('Ir al')).toBe('ir');
  });
});
describe('calma y ayuda', () => {
  it('sigue las fases de la respiración', () => {
    expect(breathPhase(0)).toMatchObject({ name: 'Inhala', left: 4 });
    expect(breathPhase(4500)).toMatchObject({ name: 'Mantén', left: 2 });
    expect(breathPhase(7000)).toMatchObject({ name: 'Exhala', left: 5 });
    expect(breathPhase(12000)).toMatchObject({ name: 'Inhala', cycle: 1 });
  });
  it('arma enlaces de llamada', () => {
    expect(telUrl('+54 9 11 5555-1234')).toBe('tel:+5491155551234');
    expect(telUrl('911')).toBe('tel:911');
    expect(telUrl('12')).toBeNull();
    expect(telUrl('')).toBeNull();
  });
  it('arma el mensaje de ayuda', () => {
    const f = { name: 'Ana', about: 'Soy autista', allergies: '', howto: 'Hablar bajo' };
    expect(fichaLines(f)).toEqual(['Me llamo: Ana', 'Debes saber: Soy autista', 'Cómo ayudarme: Hablar bajo']);
    const m = helpText(f, { lat: 1, lon: 2 });
    expect(m.split('\n')[0]).toBe('Ana necesita ayuda.');
    expect(m).toContain('Ubicación: https://www.openstreetmap.org/?mlat=1&mlon=2');
    expect(helpText({}).split('\n')[0]).toBe('Una persona necesita ayuda.');
  });
});
