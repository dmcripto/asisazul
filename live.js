// Ubicación en vivo con Supabase. Solo se conecta cuando la persona toca un botón.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { DURATIONS, expiresAt, validCode, normalizeCode, ago, isStale, shouldSend } from './share.js';

const $ = (id) => document.getElementById(id);
const cap = window.Capacitor;
const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
const configured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const K = 'asisazul-live-v1';
const mem = (() => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } })();
const keep = () => { try { localStorage.setItem(K, JSON.stringify(mem)); } catch {} };
mem.alias ||= {}; // owner uuid -> nombre que le puse a esa persona

if (!configured) {
  $('liveSetup').hidden = false; $('liveMain').hidden = true;
} else {
  $('liveSetup').hidden = true; $('liveMain').hidden = false;
}
if (configured) init();

function init() {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  const fail = (e) => alert('No se pudo completar: ' + (e && e.message ? e.message : e));
  const me = async () => {
    const { data } = await sb.auth.getSession();
    if (data.session) return data.session.user;
    const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; return r.data.user;
  };

  // ---------- Compartir mi ubicación ----------
  $('liveDur').innerHTML = DURATIONS.map((d) => `<option value="${d.min}">${d.label}</option>`).join('');
  let stopTrack = null, autoStop = null, last = null, uid = null;

  async function startTracking(onPos) {
    if (native) {
      const BG = cap.registerPlugin('BackgroundGeolocation');
      const id = await BG.addWatcher({ backgroundTitle: 'Asisazul', backgroundMessage: 'Compartiendo tu ubicación con tus familiares', requestPermissions: true, stale: false, distanceFilter: 10 },
        (l, err) => { if (!err && l) onPos({ lat: l.latitude, lon: l.longitude, acc: l.accuracy }); });
      return () => BG.removeWatcher({ id });
    }
    const id = navigator.geolocation.watchPosition((p) => onPos({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }), () => {}, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }

  function paintSharing() {
    const on = !!stopTrack, until = mem.until && new Date(mem.until);
    $('liveStart').hidden = on; $('liveDur').hidden = on; $('liveDurL').hidden = on; $('liveStop').hidden = !on;
    $('liveState').textContent = on ? `🟢 Compartiendo hasta las ${until.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : '⚪ No estás compartiendo tu ubicación.';
  }

  async function begin(untilIso) {
    uid = (await me()).id;
    stopTrack = await startTracking(async (p) => {
      const now = Date.now();
      if (now > new Date(untilIso).getTime()) return end();
      const next = { ...p, t: now };
      if (!shouldSend(last, next)) return;
      last = next;
      const { error } = await sb.from('locations').upsert({ owner: uid, lat: p.lat, lon: p.lon, acc: p.acc, updated_at: new Date(now).toISOString(), expires_at: untilIso });
      if (error) console.warn(error.message);
    });
    clearTimeout(autoStop);
    autoStop = setTimeout(end, Math.max(0, new Date(untilIso).getTime() - Date.now()));
    mem.until = untilIso; keep(); paintSharing();
    try { await refreshLinks(); } catch {}
  }
  async function end() {
    clearTimeout(autoStop); last = null;
    if (stopTrack) { try { await stopTrack(); } catch {} stopTrack = null; }
    delete mem.until; keep(); paintSharing();
    try { if (uid) await sb.from('locations').delete().eq('owner', uid); } catch {}
  }

  $('liveStart').onclick = async () => {
    const min = Number($('liveDur').value);
    if (!confirm(`Tus familiares vinculados verán dónde estás durante ${DURATIONS.find((d) => d.min === min).label}. Puedes parar cuando quieras. ¿Empezar?`)) return;
    try { await begin(expiresAt(Date.now(), min)); } catch (e) { fail(e); }
  };
  $('liveStop').onclick = end;

  // ---------- Vincular familiares ----------
  $('liveCode').onclick = async () => {
    try {
      await me();
      const { data, error } = await sb.rpc('create_code'); if (error) throw error;
      $('liveCodeOut').textContent = data;
      $('liveCodeNote').textContent = 'Dile este código a tu familiar. Vale 10 minutos y se usa una sola vez.';
    } catch (e) { fail(e); }
  };

  async function refreshLinks() {
    const u = await me();
    const { data, error } = await sb.from('links').select('owner,follower,created_at'); if (error) throw error;
    const mine = data.filter((l) => l.owner === u.id), watching = data.filter((l) => l.follower === u.id);
    const li = (text, btnText, fn) => { const d = document.createElement('div'); d.className = 'item'; const s = document.createElement('span'); s.textContent = text; const b = document.createElement('button'); b.textContent = btnText; b.onclick = fn; d.append(s, b); return d; };
    $('liveFollowers').replaceChildren(...mine.map((l) => li(`Familiar vinculado el ${new Date(l.created_at).toLocaleDateString('es')}`, 'Quitar', async () => {
      if (!confirm('¿Quitar a este familiar? Ya no podrá ver tu ubicación.')) return;
      const r = await sb.from('links').delete().eq('owner', l.owner).eq('follower', l.follower); if (r.error) return fail(r.error); refreshLinks();
    })));
    if (!mine.length) $('liveFollowers').textContent = 'Nadie vinculado todavía.';
    $('liveWatching').replaceChildren(...watching.map((l) => li(mem.alias[l.owner] || 'Persona vinculada', 'Dejar de ver', async () => {
      const r = await sb.from('links').delete().eq('owner', l.owner).eq('follower', u.id); if (r.error) return fail(r.error); delete places[l.owner]; refreshLinks(); drawMap();
    })));
    if (!watching.length) $('liveWatching').textContent = 'No ves a nadie todavía.';
    if (watching.length) await loadPlaces(watching.map((l) => l.owner));
  }
  $('liveRedeem').onclick = async () => {
    const code = normalizeCode($('liveCodeIn').value);
    if (!validCode(code)) return alert('El código tiene 6 letras o números. Revísalo.');
    try {
      await me();
      const { data, error } = await sb.rpc('redeem_code', { p_code: code }); if (error) throw error;
      const name = prompt('¿Cómo quieres llamar a esta persona? (solo se guarda en tu teléfono)', 'Mi familiar');
      mem.alias[data] = (name || '').trim() || 'Persona vinculada'; keep();
      $('liveCodeIn').value = ''; await refreshLinks(); watchRealtime();
    } catch (e) { fail(e); }
  };

  // ---------- Ver a un familiar ----------
  let map, layer; const places = {}; // owner -> {lat,lon,acc,updated_at}
  function drawMap() {
    const rows = Object.entries(places);
    $('liveMapBox').hidden = !rows.length;
    $('livePlaces').replaceChildren(...rows.map(([o, p]) => {
      const d = document.createElement('div'); d.className = 'item';
      const stale = isStale(p.updated_at, Date.now());
      d.textContent = `${mem.alias[o] || 'Persona vinculada'} · ${ago(p.updated_at, Date.now())}${stale ? ' (puede no estar al día)' : ''}`;
      return d;
    }));
    if (!rows.length || !window.L) return;
    if (!map) { map = L.map('liveMap'); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map); layer = L.layerGroup().addTo(map); }
    layer.clearLayers();
    const pts = rows.map(([o, p]) => { L.circleMarker([p.lat, p.lon], { radius: 10, color: '#2f6f6c', fillOpacity: .8 }).bindTooltip(mem.alias[o] || 'Persona vinculada', { permanent: true, direction: 'top' }).addTo(layer); return [p.lat, p.lon]; });
    map.invalidateSize(); map.fitBounds(pts, { maxZoom: 16, padding: [40, 40] });
  }
  async function loadPlaces(owners) {
    const { data, error } = await sb.from('locations').select('owner,lat,lon,acc,updated_at').in('owner', owners); if (error) return;
    for (const o of owners) delete places[o];
    for (const r of data) places[r.owner] = r;
    drawMap();
  }
  let rt = null;
  function watchRealtime() {
    if (rt) return;
    rt = sb.channel('asisazul-locs').on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, (m) => {
      if (m.eventType === 'DELETE') delete places[m.old.owner]; else if (m.new && m.new.owner !== uid) places[m.new.owner] = m.new;
      drawMap();
    }).subscribe();
  }
  $('liveRefresh').onclick = async () => { try { await refreshLinks(); watchRealtime(); } catch (e) { fail(e); } };
  setInterval(() => { if (Object.keys(places).length) drawMap(); }, 30000);

  // Si la app se cerró compartiendo y todavía no venció, se retoma y se ve en pantalla.
  paintSharing();
  if (mem.until && new Date(mem.until).getTime() > Date.now()) begin(mem.until).catch(() => { delete mem.until; keep(); paintSharing(); });
  else if (mem.until) { delete mem.until; keep(); }
}
