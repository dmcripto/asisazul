import { distanceKm, describeDistance, directionsUrl, mapUrl, shareText } from './geo.js';
import { isNative, scheduleNative } from './native.js';
import { lookup } from './pictos-api.js';
import { imageUrl } from './pictos.js';
import { pad, monthKey, daysIn, iso, parseISO, addMonth, autoFill, dueAlarms, toICS } from './logic.js';

const $ = (id) => document.getElementById(id);
const KEY = 'agenda-tea-v1';
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const state = load() || { events: [], template: null, generated: [], fired: {}, snooze: {}, fs: 17 };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} scheduleNative(state.events); };

const now0 = new Date();
let view = { y: now0.getFullYear(), m: now0.getMonth() };
let sel = iso(now0.getFullYear(), now0.getMonth(), now0.getDate());
let editing = null, formGeo = null;
const geoInfo = () => { $('fGeoInfo').textContent = formGeo ? '✔ Ubicación guardada' : ''; $('fGeo').textContent = formGeo ? '✕ Quitar ubicación guardada' : '📍 Usar mi ubicación actual como lugar'; };
const getPos = () => new Promise((ok, no) => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) }), no, { enableHighAccuracy: true, timeout: 15000 }) : no(new Error('sin GPS')));
const geoErr = () => alert('No pude obtener tu ubicación. Revisa que el permiso esté activado y que el GPS esté encendido.');

document.documentElement.style.setProperty('--fs', state.fs + 'px');
const THEMES = [['auto', 'automático'], ['light', 'claro'], ['dark', 'oscuro']];
function applyTheme() {
  const t = state.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  $('theme').textContent = '🌓 Tema: ' + THEMES.find((x) => x[0] === t)[1];
}
$('theme').onclick = () => { const i = THEMES.findIndex((x) => x[0] === (state.theme || 'auto')); state.theme = THEMES[(i + 1) % 3][0]; applyTheme(); save(); };
applyTheme();
$('dow').innerHTML = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d) => `<div class="dow">${d}</div>`).join('');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const evOn = (d) => state.events.filter((e) => e.date === d).sort((a, b) => a.time.localeCompare(b.time));

const pic = (e) => e.picto ? `<img class="eimg" src="${imageUrl(e.picto)}" alt="" loading="lazy">` : '';
const way = (e) => { const u = directionsUrl(e); return u ? `<a class="btnlink" href="${u}" target="_blank" rel="noopener">🧭 Cómo llegar</a>` : ''; };
const lead = (m) => m === 0 ? 'a la hora' : m >= 60 ? m / 60 + ' h antes' : m + ' min antes';

function renderToday() {
  const d = new Date(), t = iso(d.getFullYear(), d.getMonth(), d.getDate());
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const evs = evOn(t), nextI = evs.findIndex((e) => e.time >= hm);
  $('todayList').innerHTML = evs.map((e, i) => {
    const cls = e.time < hm ? 'past' : i === nextI ? 'now' : '';
    const tag = e.time < hm ? 'Ya pasó' : i === nextI ? 'Sigue' : 'Después';
    return `<div class="step ${cls}">${e.picto ? `<img src="${imageUrl(e.picto)}" alt="" loading="lazy">` : ''}<div><span class="tag">${tag}</span><div class="big">${e.time} · ${esc(e.title)}</div>${e.place ? `<div>📍 ${esc(e.place)}</div>` : ''}<div class="bar">${way(e)}${Number.isFinite(e.lat) ? `<button data-dist="${esc(e.id)}">📏 Ver cuánto falta</button>` : ''}</div><div class="distOut" id="dist-${esc(e.id)}"></div>${e.notes ? `<div>📝 ${esc(e.notes)}</div>` : ''}</div></div>`;
  }).join('') || '<p style="color:var(--mute)">Hoy no hay nada en la agenda. Día libre.</p>';
}

function render() {
  renderToday();
  $('title').textContent = `${MONTHS[view.m]} ${view.y}`;
  const first = new Date(view.y, view.m, 1).getDay(), total = daysIn(view.y, view.m);
  const todayS = iso(now0.getFullYear(), now0.getMonth(), now0.getDate());
  let html = '';
  for (let i = 0; i < 42; i++) {
    const t = new Date(view.y, view.m, 1 - first + i);
    const s = iso(t.getFullYear(), t.getMonth(), t.getDate());
    const evs = evOn(s);
    html += `<button class="day ${t.getMonth() !== view.m ? 'out' : ''} ${s === todayS ? 'today' : ''} ${s === sel ? 'sel' : ''}" data-d="${s}" aria-label="${t.getDate()} de ${MONTHS[t.getMonth()]}, ${evs.length} eventos"><b>${t.getDate()}</b>${evs.slice(0, 3).map((e) => `<span class="chip t-${e.type}">${e.time} ${esc(e.title)}</span>`).join('')}${evs.length > 3 ? `<span class="chip">+${evs.length - 3}</span>` : ''}</button>`;
  }
  $('grid').innerHTML = html;
  const p = parseISO(sel);
  $('dayTitle').textContent = `${p.d} de ${MONTHS[p.m]}`;
  $('list').innerHTML = evOn(sel).map((e) => `<div class="item"><div><span class="chip t-${e.type}" style="display:inline-block;font-size:.85rem">${e.time}</span> ${pic(e)}<b>${esc(e.title)}</b>${e.auto ? ' <small>(automático)</small>' : ''}<br><small>${esc(e.place)} ${esc(e.notes)}</small><br>${way(e)}<br><small>🔔 ${(e.remind || []).map(lead).join(', ') || 'sin alarma'}</small></div><div><button data-edit="${esc(e.id)}">Editar</button> <button data-del="${esc(e.id)}" aria-label="Borrar">🗑</button></div></div>`).join('') || '<p style="color:var(--mute)">Nada este día.</p>';
  const k = monthKey(view.y, view.m);
  $('tplName').textContent = `${MONTHS[view.m]} ${view.y}`;
  const t = state.template;
  $('tplInfo').textContent = t ? `Modelo actual: ${MONTHS[Number(t.slice(5)) - 1]} ${t.slice(0, 4)}. Meses ya generados: ${state.generated.length}.` : 'Todavía no elegiste un mes modelo.';
  $('tpl').textContent = t === k ? '✔ Este mes es el modelo' : 'Usar este mes como modelo';
  const notif = 'Notification' in window ? Notification.permission : 'denied';
  $('banner').innerHTML = notif === 'granted' ? '' : '<div class="banner">Para que suenen las alarmas tocá <b>🔔 Activar alarmas</b> y dejá esta pestaña abierta. Para alarmas con la app cerrada, usá <b>Exportar al teléfono</b>.</div>';
}

$('grid').onclick = (e) => { const b = e.target.closest('[data-d]'); if (!b) return; sel = b.dataset.d; const p = parseISO(sel); view = { y: p.y, m: p.m }; render(); };
$('prev').onclick = () => { view = addMonth(view.y, view.m, -1); render(); };
$('next').onclick = () => { view = addMonth(view.y, view.m, 1); render(); };
$('today').onclick = () => { view = { y: now0.getFullYear(), m: now0.getMonth() }; sel = iso(now0.getFullYear(), now0.getMonth(), now0.getDate()); render(); };
$('txt').onclick = () => { state.fs = state.fs >= 24 ? 15 : state.fs + 3; document.documentElement.style.setProperty('--fs', state.fs + 'px'); save(); };

function openForm(ev) {
  editing = ev || null;
  formGeo = Number.isFinite(ev?.lat) ? { lat: ev.lat, lon: ev.lon } : null; geoInfo();
  $('fTitle').textContent = ev ? 'Editar evento' : 'Nuevo evento';
  $('fName').value = ev?.title || ''; $('fType').value = ev?.type || 'terapia';
  $('fDate').value = ev?.date || sel; $('fTime').value = ev?.time || '10:00';
  $('fPicto').value = ev?.pictoWord || ''; $('fPlace').value = ev?.place || ''; $('fNotes').value = ev?.notes || '';
  const r = ev ? ev.remind : [60, 10];
  document.querySelectorAll('#fRemind input').forEach((c) => { c.checked = r.includes(Number(c.value)); });
  $('form').showModal();
}
$('fGeo').onclick = async () => {
  if (formGeo) { formGeo = null; geoInfo(); return; }
  if (!confirm('Se usará tu ubicación actual como lugar de este evento. Se guarda solo en este dispositivo. ¿Continuar?')) return;
  try { const p = await getPos(); formGeo = { lat: p.lat, lon: p.lon }; geoInfo(); } catch { geoErr(); }
};
$('add').onclick = () => openForm();
$('list').onclick = (e) => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  if (ed) openForm(state.events.find((x) => x.id === ed.dataset.edit));
  if (del && confirm('¿Borrar este evento?')) { state.events = state.events.filter((x) => x.id !== del.dataset.del); save(); render(); }
};
$('f').onsubmit = (e) => {
  if (e.submitter?.value !== 'ok') return;
  const data = {
    title: $('fName').value.trim(), type: $('fType').value, date: $('fDate').value, time: $('fTime').value,
    pictoWord: $('fPicto').value.trim().toLowerCase(), place: $('fPlace').value.trim(), notes: $('fNotes').value.trim(),
    lat: formGeo ? formGeo.lat : null, lon: formGeo ? formGeo.lon : null,
    remind: [...document.querySelectorAll('#fRemind input:checked')].map((c) => Number(c.value)).sort((a, b) => b - a),
  };
  let ev = editing;
  if (ev) { if (ev.pictoWord !== data.pictoWord) delete ev.picto; Object.assign(ev, data, { auto: false }); }
  else { ev = { id: 'e' + Date.now().toString(36), ...data }; state.events.push(ev); }
  if (data.pictoWord && !ev.picto) lookup(data.pictoWord).then((f) => { if (f && f[0]) { ev.picto = f[0]; save(); render(); } });
  Object.keys(state.fired).forEach((k) => { if (k.startsWith((editing?.id || '') + '|')) delete state.fired[k]; });
  sel = data.date; const p = parseISO(sel); view = { y: p.y, m: p.m };
  save(); render();
};

$('tpl').onclick = () => {
  const k = monthKey(view.y, view.m);
  if (!state.events.some((e) => e.date.startsWith(k))) return alert('Primero cargá al menos un evento en este mes.');
  state.template = k; state.generated = []; state.events = state.events.filter((e) => !e.auto);
  const n = autoFill(state, new Date()).length; save(); render();
  alert(`Listo. Se completaron ${n} eventos en los meses siguientes y de ahora en más cada mes se llenará solo.`);
};
$('regen').onclick = () => {
  if (!state.template) return alert('Elegí primero un mes modelo.');
  if (!confirm('Se borran los eventos automáticos y se vuelven a crear desde el modelo. Los que cargaste a mano no se tocan.')) return;
  state.events = state.events.filter((e) => !e.auto); state.generated = []; autoFill(state, new Date()); save(); render();
};
$('notpl').onclick = () => { state.template = null; save(); render(); };

$('ics').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toICS(state.events)], { type: 'text/calendar' }));
  a.download = 'agenda.ics'; a.click();
};

// ---- Alarmas ----
let audio, beepTimer, current = null;
function beep() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = 660; g.gain.value = 0.15; o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + 0.35);
  } catch {}
}
$('sound').onclick = async () => {
  beep();
  if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  $('sound').textContent = '🔔 Alarmas activas'; render();
};
function ring(a) {
  current = a;
  const e = a.event;
  const when = a.snoozed ? 'Recordatorio' : a.lead === 0 ? 'Es ahora' : a.lead >= 60 ? `Falta${a.lead >= 120 ? 'n' : ''} ${a.lead / 60} h` : `Faltan ${a.lead} min`;
  $('aTitle').textContent = `${e.title}`;
  $('aBody').textContent = `${when} · ${e.time}${e.place ? ' · ' + e.place : ''}${e.notes ? ' — ' + e.notes : ''}`;
  if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(e.title, { body: $('aBody').textContent, requireInteraction: true }); } catch {} }
  if (!$('alarm').open) $('alarm').showModal();
  clearInterval(beepTimer); beep(); beepTimer = setInterval(beep, 1500);
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
}
const stop = () => { clearInterval(beepTimer); $('alarm').close(); current = null; };
$('aOk').onclick = stop;
$('aSnooze').onclick = () => { state.snooze[current.key] = Date.now() + 5 * 60000; save(); stop(); };

function tick() {
  if (isNative) return; // en la app, las alarmas las programa el sistema (native.js)
  if ($('alarm').open) return;
  const t = Date.now();
  for (const [key, at] of Object.entries(state.snooze)) {
    if (t < at) continue;
    delete state.snooze[key]; save();
    const event = state.events.find((e) => e.id === key.split('|')[0]);
    if (event) return ring({ event, lead: 0, key, snoozed: true });
  }
  const a = dueAlarms(state.events, t, state.fired)[0];
  if (a) { state.fired[a.key] = true; save(); ring(a); }
}

// Al abrir y cada día: completa los meses que falten.
if (autoFill(state, new Date()).length) save();
scheduleNative(state.events); render(); tick(); setInterval(tick, 15000); setInterval(renderToday, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (autoFill(state, new Date()).length) { save(); render(); } tick(); } });

// ---- Ubicación (solo cuando se toca el botón) ----
let here = null;
$('where').onclick = async () => {
  if (!confirm('Se pedirá tu ubicación una sola vez, ahora. No se guarda ni se envía a ningún servidor. ¿Continuar?')) return;
  try {
    here = await getPos();
    $('whereInfo').innerHTML = `<p>Latitud ${here.lat.toFixed(5)}, longitud ${here.lon.toFixed(5)} (precisión ~${here.acc} m)</p><p><a href="${mapUrl(here)}" target="_blank" rel="noopener">Ver en el mapa</a></p>`;
    $('whereCard').hidden = false; $('whereCard').scrollIntoView({ block: 'nearest' });
  } catch { geoErr(); }
};
$('whereClose').onclick = () => { here = null; $('whereCard').hidden = true; };
$('whereCopy').onclick = async () => { try { await navigator.clipboard.writeText(shareText(here)); alert('Enlace copiado.'); } catch { prompt('Copia este enlace:', shareText(here)); } };
$('whereShare').onclick = () => { if (navigator.share) navigator.share({ text: shareText(here) }).catch(() => {}); else $('whereCopy').click(); };
$('todayList').onclick = async (e) => {
  const b = e.target.closest('[data-dist]'); if (!b) return;
  const ev = state.events.find((x) => x.id === b.dataset.dist);
  try { const p = await getPos(); $('dist-' + b.dataset.dist).textContent = describeDistance(distanceKm(p, ev)); } catch { geoErr(); }
};
