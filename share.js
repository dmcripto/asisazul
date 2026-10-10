// Lógica pura de "ubicación en vivo" (sin red ni DOM).
import { distanceKm } from './geo.js';

export const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
export const normalizeCode = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const validCode = (s) => CODE_RE.test(normalizeCode(s));

// Duraciones permitidas, en minutos. No hay "para siempre": siempre vence.
export const DURATIONS = [{ min: 15, label: '15 minutos' }, { min: 60, label: '1 hora' }, { min: 480, label: '8 horas' }];
export const expiresAt = (now, minutes) => new Date(now + minutes * 60000).toISOString();

// "Hace 30 s" / "Hace 5 min" / "Hace 2 h"
export function ago(iso, now) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `Hace ${s} s`;
  if (s < 3600) return `Hace ${Math.round(s / 60)} min`;
  return `Hace ${Math.round(s / 3600)} h`;
}
export const isStale = (iso, now, maxMin = 10) => now - new Date(iso).getTime() > maxMin * 60000;

// Evita enviar cada posición: solo si se movió >= minMeters o pasaron >= minMs.
export function shouldSend(prev, next, minMeters = 15, minMs = 30000) {
  if (!prev) return true;
  if (next.t - prev.t >= minMs) return true;
  return distanceKm(prev, next) * 1000 >= minMeters;
}
