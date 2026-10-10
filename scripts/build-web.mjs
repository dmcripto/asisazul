// Copia los archivos de la web a www/ (carpeta que usa Capacitor para la app de Android).
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const files = ['index.html', 'app.js', 'logic.js', 'geo.js', 'pictos.js', 'pictos-api.js', 'pictos-ui.js', 'native.js', 'style.css'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of files) cpSync(f, `www/${f}`);
console.log(`www/ listo (${files.length} archivos)`);
