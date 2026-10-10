// Lógica pura de ubicación (sin DOM ni GPS). Nada se envía a ningún servidor.
const R = 6371; // km
const rad = (d) => (d * Math.PI) / 180;

// Distancia en línea recta entre dos puntos, en km.
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Texto claro y aproximado: "a 1,2 km en línea recta (unos 15 min a pie)".
export function describeDistance(km) {
  const dist = km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1).replace('.', ',')} km`;
  const min = Math.max(1, Math.round((km / 4.5) * 60));
  return `A ${dist} en línea recta (unos ${min} min a pie, aproximado)`;
}

const hasPoint = (e) => Number.isFinite(e?.lat) && Number.isFinite(e?.lon);

// Enlace "Cómo llegar": usa las coordenadas guardadas o, si no hay, el texto del lugar. Sin dato -> null.
export function directionsUrl(e) {
  const dest = hasPoint(e) ? `${e.lat},${e.lon}` : (e?.place || '').trim();
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}` : null;
}

export const mapUrl = (p) => `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`;
export const shareText = (p) => `Estoy aquí: ${mapUrl(p)}`;
