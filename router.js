// Cada sección se abre en su propia pantalla (#rutinas, #senales...). Sin hash = portada.
const TITLES = { hoy: 'Qué pasa hoy', calendario: 'Calendario', rutinas: 'Rutinas', senales: 'Señales', calma: 'Calma', pictos: 'Pictogramas', live: 'Ubicación en vivo', ayuda: 'Mi ficha' };
const $ = (id) => document.getElementById(id);
let prev = 'home', cameFromHome = false;

const current = () => { const p = location.hash.replace('#', ''); return TITLES[p] ? p : 'home'; };

function show() {
  const page = current(), inner = page !== 'home';
  if (inner && prev === 'home') cameFromHome = true;
  document.body.dataset.page = page;
  document.querySelectorAll('[data-page]').forEach((e) => e.classList.toggle('pg-off', e.dataset.page !== page));
  document.querySelector('.hero').classList.toggle('inner', inner);
  $('back').classList.toggle('pg-off', !inner);
  if (inner) $('hello').textContent = TITLES[page];
  else window.dispatchEvent(new Event('ficha')); // vuelve el saludo
  window.scrollTo(0, 0);
  if (prev !== page) { $('hello').focus({ preventScroll: true }); }
  prev = page;
  // Marca la página actual en la barra.
  document.querySelectorAll('[data-nav]').forEach((a) => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.querySelectorAll('.dd').forEach((d) => d.querySelector('.dd-btn').classList.toggle('on', !!d.querySelector('[aria-current=page]')));
  closeMenus();
}

// ---- Menú: desplegables y botón ☰ en pantallas chicas ----
function closeMenus(except) {
  document.querySelectorAll('.dd.open').forEach((d) => { if (d !== except) { d.classList.remove('open'); d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); } });
}
document.querySelectorAll('.dd-btn').forEach((b) => b.addEventListener('click', () => {
  const d = b.parentElement, open = !d.classList.contains('open');
  closeMenus(d); d.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
}));
$('menuBtn').addEventListener('click', () => {
  const open = !$('menu').classList.contains('open');
  $('menu').classList.toggle('open', open); $('menuBtn').setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => { if (!e.target.closest('.dd')) closeMenus(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = document.querySelector('.dd.open');
  if (open) { closeMenus(); open.querySelector('.dd-btn').focus(); }
  else if ($('menu').classList.contains('open')) { $('menu').classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); $('menuBtn').focus(); }
});
$('menu').addEventListener('click', (e) => { if (e.target.closest('a')) { $('menu').classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); } });

$('back').onclick = () => {
  if (cameFromHome) { cameFromHome = false; history.back(); }
  else { history.replaceState(null, '', location.pathname + location.search); show(); }
};
window.addEventListener('hashchange', show);
show();
