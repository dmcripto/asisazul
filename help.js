// Ficha personal y mensaje de ayuda. Lógica pura.
export const FIELDS = ['name', 'about', 'allergies', 'meds', 'howto', 'emergency'];

// Número de teléfono -> enlace tel:, o null si no parece un número.
export function telUrl(n) {
  const d = String(n ?? '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return d.replace(/\D/g, '').length >= 3 ? 'tel:' + d : null;
}
// Líneas de la ficha que tienen contenido, para mostrar a otra persona.
export function fichaLines(f = {}) {
  const L = [['Me llamo', f.name], ['Debes saber', f.about], ['Alergias', f.allergies], ['Medicación', f.meds], ['Cómo ayudarme', f.howto]];
  return L.filter(([, v]) => v && String(v).trim()).map(([k, v]) => `${k}: ${String(v).trim()}`);
}
// Mensaje para enviar a un contacto: ficha + ubicación si hay.
export function helpText(f = {}, pos = null) {
  const who = f.name && f.name.trim() ? f.name.trim() : 'Una persona';
  const lines = [`${who} necesita ayuda.`, ...fichaLines({ ...f, name: '' })];
  if (pos) lines.push(`Ubicación: https://www.openstreetmap.org/?mlat=${pos.lat}&mlon=${pos.lon}#map=17/${pos.lat}/${pos.lon}`);
  return lines.join('\n');
}
