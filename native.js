// Alarmas nativas de Android (Capacitor). En el navegador no hace nada.
import { planAlarms } from './logic.js';

const cap = window.Capacitor;
export const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 2000000000) + 1; };

// Reprograma todas las alarmas futuras en el sistema; suenan con la app cerrada.
export async function scheduleNative(events) {
  const ln = isNative && cap.Plugins && cap.Plugins.LocalNotifications;
  if (!ln) return;
  try {
    let p = await ln.checkPermissions();
    if (p.display !== 'granted') p = await ln.requestPermissions();
    if (p.display !== 'granted') return;
    const pend = await ln.getPending();
    if (pend.notifications.length) await ln.cancel({ notifications: pend.notifications });
    const plan = planAlarms(events, Date.now());
    if (plan.length) {
      await ln.schedule({ notifications: plan.map((a) => ({ id: hash(a.key), title: a.title, body: a.body, schedule: { at: new Date(a.at), allowWhileIdle: true } })) });
    }
  } catch { /* sin permiso o sin plugin: se sigue con las alarmas de la pantalla */ }
}

// Guarda un archivo y lo comparte. En la app usa el sistema de Android (los enlaces de descarga no funcionan en la app).
export async function saveFile(name, text, mime) {
  const P = isNative && cap.Plugins;
  if (P && P.Filesystem && P.Share) {
    try {
      const r = await P.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
      await P.Share.share({ title: name, url: r.uri });
      return;
    } catch (e) { if (/cancel/i.test(String(e && e.message))) return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name; a.click();
}

// Comparte texto (WhatsApp, SMS...). Sin app de compartir, lo copia.
export async function shareText(text, title = 'Asisazul') {
  const P = isNative && cap.Plugins;
  try {
    if (P && P.Share) return await P.Share.share({ title, text });
    if (navigator.share) return await navigator.share({ title, text });
  } catch (e) { return; }
  try { await navigator.clipboard.writeText(text); alert('Mensaje copiado. Pégalo en un chat.'); } catch { prompt('Copia este mensaje:', text); }
}
