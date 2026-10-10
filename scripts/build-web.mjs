// Copia los archivos de la web a www/ (carpeta que usa Capacitor para la app de Android).
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const files = ['index.html', 'app.js', 'logic.js', 'geo.js', 'pictos.js', 'pictos-api.js', 'pictos-ui.js', 'native.js', 'router.js', 'share.js', 'signals.js', 'routines.js', 'calm.js', 'help.js', 'backup.js', 'extras-ui.js', 'live.js', 'config.js', 'style.css', 'logo.svg', 'apple-touch-icon.png'];
const dirs = ['vendor'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of files) cpSync(f, `www/${f}`);
for (const d of dirs) cpSync(d, `www/${d}`, { recursive: true });
console.log(`www/ listo (${files.length} archivos)`);
