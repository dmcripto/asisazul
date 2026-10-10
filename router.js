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
}

$('back').onclick = () => {
  if (cameFromHome) { cameFromHome = false; history.back(); }
  else { history.replaceState(null, '', location.pathname + location.search); show(); }
};
window.addEventListener('hashchange', show);
show();
