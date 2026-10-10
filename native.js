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
