// Rutinas, registro de señales, calma, ficha y botón de ayuda. Todo queda en el teléfono.
import { TRIGGERS, OVERLOAD, summarize, toCSV } from './signals.js';
import { dayKey, toggleStep, progress, isDone, parseSteps, pictoWord, EXAMPLES } from './routines.js';
import { breathPhase, GROUNDING } from './calm.js';
import { telUrl, fichaLines, helpText } from './help.js';
import { saveFile, shareText } from './native.js';
import { lookup } from './pictos-api.js';
import { KEYS, makeBackup, parseBackup } from './backup.js';
import { imageUrl } from './pictos.js';

const $ = (id) => document.getElementById(id);
const K = 'asisazul-extras-v1';
const data = (() => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } })();
data.ficha ||= {}; data.contacts ||= [{}, {}, {}]; data.routines ||= []; data.signals ||= [];
const save = () => { try { localStorage.setItem(K, JSON.stringify(data)); } catch {} };
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Rutinas ----------
function drawRoutines() {
  const day = dayKey();
  queueMicrotask(() => { if (typeof drawHome === 'function') drawHome(); });
  $('rList').replaceChildren(...data.routines.map((r) => {
    const p = progress(r, day);
    const box = el('div', { className: 'rbox' }, el('b', { textContent: r.title }),
      el('div', { textContent: p.complete ? '✅ ¡Rutina completa! Muy bien.' : `${p.done} de ${p.total} pasos`, ariaLive: 'polite' }));
    for (const s of r.steps) {
      const b = el('button', { className: 'rstep' });
      b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', String(isDone(r, s.id, day)));
      if (s.picto) b.append(el('img', { src: imageUrl(s.picto, 300), alt: '', loading: 'lazy' }));
      b.append(el('span', { textContent: s.text }));
      b.onclick = () => { data.routines[data.routines.indexOf(r)] = toggleStep(r, s.id, day); save(); drawRoutines(); };
      box.append(b);
    }
    box.append(el('div', { className: 'bar' }, el('button', { textContent: 'Borrar rutina', onclick: () => { if (confirm(`¿Borrar «${r.title}»?`)) { data.routines = data.routines.filter((x) => x !== r); save(); drawRoutines(); } } })));
    return box;
  }));
  if (!data.routines.length) $('rList').innerHTML = '<div class="empty"><svg class="art" viewBox="0 0 160 110" aria-hidden="true"><use href="#art-brote"/></svg><p>Todavía no tienes rutinas. Empieza con un ejemplo.</p></div>';
}
async function addRoutine(title, lines) {
  const steps = lines.map((text) => ({ id: uid(), text }));
  const r = { id: uid(), title, steps, day: dayKey(), done: {} };
  data.routines.push(r); save(); drawRoutines();
  // Los pictogramas llegan después, sin trabar la pantalla.
  for (const s of steps) { const w = pictoWord(s.text); if (!w) continue; const f = await lookup(w); if (f && f[0]) { s.picto = f[0]; save(); drawRoutines(); } }
}
$('rAdd').onclick = () => {
  const title = $('rTitle').value.trim(), lines = parseSteps($('rSteps').value);
  if (!title || !lines.length) return alert('Escribe un nombre y al menos un paso.');
  $('rTitle').value = ''; $('rSteps').value = ''; addRoutine(title, lines);
};
$('rExamples').replaceChildren(...Object.entries(EXAMPLES).map(([t, l]) => el('button', { textContent: t, onclick: () => addRoutine(t, l) })));

// ---------- Registro de señales ----------
let mood = null;
const FACES = ['😞', '😕', '😐', '🙂', '😄'], FACE_NAMES = ['muy mal', 'mal', 'normal', 'bien', 'muy bien'];
$('sMood').replaceChildren(...FACES.map((f, i) => { const b = el('button', { className: 'mood', textContent: f, type: 'button' }); b.setAttribute('aria-label', FACE_NAMES[i]); b.setAttribute('aria-pressed', 'false'); b.onclick = () => { mood = i + 1; [...$('sMood').children].forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); }; return b; }));
$('sOver').replaceChildren(...OVERLOAD.map((t, i) => el('option', { value: i, textContent: t })));
$('sTrig').replaceChildren(...TRIGGERS.map((t) => el('label', {}, el('input', { type: 'checkbox', value: t }), t)));
function drawSignals() {
  const now = Date.now(), s = summarize(data.signals, now);
  $('sSum').textContent = s.n ? `${s.n} registros · ${s.crises} crisis · ánimo promedio ${s.avgMood ?? '—'} de 5${s.top.length ? ' · lo más frecuente: ' + s.top.map(([t, c]) => `${t} (${c})`).join(', ') : ''}` : 'Todavía no hay registros esta semana.';
  $('sList').replaceChildren(...[...data.signals].sort((a, b) => b.ts - a.ts).slice(0, 8).map((x) => el('div', { className: 'item' },
    el('span', { textContent: `${new Date(x.ts).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })} · ${x.mood ? FACES[x.mood - 1] : '—'} · sobrecarga: ${OVERLOAD[x.overload ?? 0]}${x.crisis ? ' · CRISIS' : ''}${x.triggers.length ? ' · ' + x.triggers.join(', ') : ''}${x.note ? ' · ' + x.note : ''}` }),
    el('button', { textContent: '🗑', ariaLabel: 'Borrar registro', onclick: () => { data.signals = data.signals.filter((y) => y !== x); save(); drawSignals(); } }))));
}
$('sSave').onclick = () => {
  if (!mood && !$('sCrisis').checked) return alert('Elige cómo te sientes, o marca que tuviste una crisis.');
  data.signals.push({ id: uid(), ts: Date.now(), mood, overload: Number($('sOver').value), crisis: $('sCrisis').checked,
    triggers: [...$('sTrig').querySelectorAll('input:checked')].map((c) => c.value), note: $('sNote').value.trim() });
  mood = null; [...$('sMood').children].forEach((x) => x.setAttribute('aria-pressed', 'false'));
  $('sCrisis').checked = false; $('sNote').value = ''; $('sOver').value = 0; $('sTrig').querySelectorAll('input').forEach((c) => { c.checked = false; });
  save(); drawSignals();
};
$('sCsv').onclick = () => data.signals.length ? saveFile('registro-senales.csv', toCSV(data.signals), 'text/csv') : alert('No hay registros para exportar.');
$('sClear').onclick = () => { if (data.signals.length && confirm('Se borrarán todos tus registros. No se puede deshacer. ¿Seguir?')) { data.signals = []; save(); drawSignals(); } };

// ---------- Calma ----------
$('gList').replaceChildren(...GROUNDING.map((t) => el('li', { textContent: t })));
let breathTimer = null;
const still = matchMedia('(prefers-reduced-motion: reduce)');
$('bGo').onclick = () => {
  if (breathTimer) { clearInterval(breathTimer); breathTimer = null; $('bGo').textContent = '▶ Empezar a respirar'; $('bText').textContent = 'Muy bien. Listo cuando quieras.'; $('bCircle').style.transform = ''; return; }
  const t0 = Date.now(); $('bGo').textContent = '⏹ Parar';
  const tick = () => {
    const p = breathPhase(Date.now() - t0);
    $('bText').textContent = `${p.name}… ${p.left}`;
    if (!still.matches) $('bCircle').style.transform = p.idx === 0 ? 'scale(1)' : p.idx === 1 ? 'scale(1)' : 'scale(.6)';
  };
  tick(); breathTimer = setInterval(tick, 250);
};

// ---------- Ficha y contactos ----------
const fmap = { fiName: 'name', fiAbout: 'about', fiAll: 'allergies', fiMeds: 'meds', fiHow: 'howto', fiEmer: 'emergency' };
for (const [id, k] of Object.entries(fmap)) { $(id).value = data.ficha[k] || ''; $(id).oninput = () => { data.ficha[k] = $(id).value; save(); if (k === 'name') window.dispatchEvent(new Event('ficha')); }; }
$('fiContacts').replaceChildren(...data.contacts.map((c, i) => el('div', { className: 'bar' },
  Object.assign(el('input', { placeholder: 'Nombre', value: c.name || '', maxlength: 40 }), { oninput(e) { data.contacts[i].name = e.target.value; save(); } }),
  Object.assign(el('input', { placeholder: 'Teléfono', value: c.phone || '', inputMode: 'tel', maxlength: 20 }), { oninput(e) { data.contacts[i].phone = e.target.value; save(); } }))));
$('fiContacts').querySelectorAll('input').forEach((x, i) => x.setAttribute('aria-label', `${i % 2 ? 'Teléfono' : 'Nombre'} del contacto ${Math.floor(i / 2) + 1}`));

// ---------- Botón de ayuda ----------
$('sosOpen').onclick = () => {
  const lines = fichaLines(data.ficha);
  $('sosFicha').replaceChildren(...(lines.length ? lines : ['Completa «Mi ficha» para que aquí aparezca tu información.']).map((t) => el('div', { textContent: t })));
  const calls = [];
  const em = telUrl(data.ficha.emergency);
  if (em) calls.push(el('a', { className: 'btnlink', href: em, textContent: `📞 Emergencias ${data.ficha.emergency.trim()}` }));
  for (const c of data.contacts) { const u = telUrl(c.phone); if (u) calls.push(el('a', { className: 'btnlink', href: u, textContent: `📞 ${c.name || c.phone}` })); }
  if (!calls.length) calls.push(el('span', { textContent: 'Agrega un número de emergencias y contactos en «Mi ficha».' }));
  $('sosCalls').replaceChildren(...calls);
  $('sos').showModal();
};
$('sosClose').onclick = () => $('sos').close();
$('sosSend').onclick = async () => {
  let pos = null;
  try { pos = await new Promise((ok, no) => navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }), no, { timeout: 8000 })); } catch {}
  await shareText(helpText(data.ficha, pos), 'Necesito ayuda');
};

// ---------- Portada: «Tu día» ----------
$('hMoodBtns').replaceChildren(...FACES.map((f, i) => { const b = el('button', { className: 'mood', textContent: f, type: 'button' }); b.setAttribute('aria-label', FACE_NAMES[i]);
  b.onclick = () => { data.signals.push({ id: uid(), ts: Date.now(), mood: i + 1, overload: 0, crisis: false, triggers: [], note: '' }); save(); drawSignals(); $('hMoodMsg').textContent = `Anotado: te sientes ${FACE_NAMES[i]}. Gracias por contarlo.`; };
  return b; }));
function drawHome() {
  const day = dayKey(), d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  let evs = []; try { evs = (JSON.parse(localStorage.getItem(KEYS.agenda)).events || []).filter((e) => e.date === day).sort((a, b) => a.time.localeCompare(b.time)); } catch {}
  const next = evs.find((e) => e.time >= hm);
  if (next) $('hNextBody').replaceChildren(el('div', { className: 'nextev' }, ...(next.picto ? [el('img', { src: imageUrl(next.picto, 300), alt: '' })] : []), el('div', {}, el('div', { className: 'big', textContent: `${next.time} · ${next.title}` }), el('div', { textContent: next.place ? '📍 ' + next.place : evs.length > 1 ? `Hoy tienes ${evs.length} cosas` : '' }))));
  else $('hNextBody').innerHTML = `<div class="empty"><svg class="art" viewBox="0 0 160 110" aria-hidden="true"><use href="#art-sol"/></svg><p>${evs.length ? 'Ya hiciste todo lo de hoy. ¡Bien!' : 'Hoy no hay nada pendiente.'}</p></div>`;
  if (!data.routines.length) $('hRoutinesBody').innerHTML = '<div class="empty"><svg class="art" viewBox="0 0 160 110" aria-hidden="true"><use href="#art-brote"/></svg><p>Crea una rutina y sigue tus pasos aquí.</p></div>';
  else $('hRoutinesBody').replaceChildren(...data.routines.map((r) => { const p = progress(r, day);
    return el('div', {}, el('b', { textContent: r.title }), el('div', { textContent: p.complete ? '✅ Completa' : `${p.done} de ${p.total} pasos` }),
      el('div', { className: 'pbar-bg', ariaHidden: 'true' }, Object.assign(el('div', { className: 'pbar-fg' }), { style: `width:${p.total ? Math.round(100 * p.done / p.total) : 0}%` }))); }));
}
window.addEventListener('ficha', drawHome);
setInterval(drawHome, 60000);

// ---------- Copia de seguridad ----------
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
$('bkSave').onclick = () => saveFile(`asisazul-copia-${dayKey()}.json`, makeBackup(rd(KEYS.agenda), data), 'application/json');
$('bkLoad').onclick = () => $('bkFile').click();
$('bkFile').onchange = async (ev) => {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  try {
    const b = parseBackup(await f.text());
    if (!confirm(`Se reemplazarán TODOS tus datos actuales por los de la copia${b.savedAt ? ' del ' + new Date(b.savedAt).toLocaleDateString('es') : ''}. ¿Seguir?`)) return;
    localStorage.setItem(KEYS.agenda, JSON.stringify({ events: [], template: null, generated: [], fired: {}, snooze: {}, fs: 17, ...b.agenda }));
    localStorage.setItem(KEYS.extras, JSON.stringify(b.extras));
    location.reload();
  } catch (e) { alert(e.message); }
};

drawRoutines(); drawSignals(); drawHome();
