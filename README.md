# Asisazul — Mi Agenda

Web para ayudar a personas autistas y con discapacidad a organizar su día. Esta primera versión es una **agenda de terapias y turnos médicos** con alarmas. La app de Android vendrá después, cuando la web esté terminada, y será igual a la web.

## Qué hace

- **Calendario mensual** con los eventos de cada día.
- **Recordatorios con alarmas** para terapias y turnos médicos. Cada evento puede avisar 1 día, 2 h, 1 h, 30 min o 10 min antes, o a la hora. La alarma muestra una pantalla grande con sonido suave y vibración, y se puede posponer 5 minutos.
- **Relleno automático de meses:** se carga un mes una vez y se toca «Usar este mes como modelo». Los meses siguientes se completan solos, repitiendo cada evento el mismo día de la semana (por ejemplo, «2.º martes»). Si no existe el 5.º día de la semana, se usa el último. Los eventos automáticos se pueden editar o borrar. «Volver a generar» no toca los que cargaste a mano.
- **Exportar a .ics:** crea un archivo con alarmas (VALARM) para el calendario del teléfono. Así suenan aunque la web esté cerrada.
- **Frase en pictogramas:** se escribe (o se dicta) una frase y cada palabra se muestra con su pictograma. Se puede cambiar la imagen de una palabra (↻), quitarla (✕), leer la frase en voz alta e imprimir o guardar en PDF.
- **Qué pasa hoy:** el día en orden, con letra grande, pictograma, hora, lugar y notas. Marca qué ya pasó y qué sigue.
- **Pictograma en cada evento:** al crear un evento puedes escribir una palabra (por ejemplo «psicólogo») y se le asigna su pictograma.
- **Cómo llegar:** cada evento con lugar tiene un botón que abre el mapa con la ruta. Si guardaste la ubicación exacta, usa esa; si no, usa el texto del lugar.
- **Ubicación del evento:** en el formulario, «Usar mi ubicación actual como lugar» guarda el punto exacto (por ejemplo, estando en el consultorio).
- **Ver cuánto falta:** en «Qué pasa hoy», un botón calcula la distancia en línea recta y un tiempo aproximado a pie.
- **Ubicación en vivo (propia):** compartir la ubicación en tiempo real con familiares vinculados por un código, con duración limitada y mapa dentro de la app. Usa Supabase; ver `supabase/README.md` para activarlo. Hasta que se configure, no envía nada.
- **Compartir mi ubicación con un familiar:** una guía paso a paso (WhatsApp, Google Maps, iPhone) para compartir en vivo con apps que ya existen. Asisazul no envía la ubicación a nadie.
- **¿Dónde estoy?:** muestra tu posición, con enlace al mapa para copiar o compartir cuando tú quieras.

## Diseño y privacidad

- Interfaz calmada, con colores suaves y sin movimiento brusco. Respeta la opción del sistema «reducir movimiento».
- Texto ajustable con el botón **Aa**.
- Revisada con axe-core (accesibilidad): sin errores de contraste ni de nombres de botones, en claro y oscuro.
- Modo oscuro: automático según el dispositivo, o elegido a mano con el botón **Tema** (automático, claro u oscuro).
- Botones grandes.
- **Pictogramas:** para buscar la imagen, cada palabra escrita se envía a la API pública de ARASAAC. El dictado por voz es opcional y avisa antes: según el navegador, el audio puede ir a un servidor externo.
- **Ubicación:** solo se pide al tocar un botón, con aviso antes. No se envía a ningún servidor. Solo se guarda la ubicación que elijas para un evento, y queda en tu navegador.
- **Los datos de salud son privados:** se guardan solo en tu navegador (`localStorage`). No se envían a ningún servidor.

## Cómo probarla

No necesita instalación. Desde la raíz del repositorio:

```
python3 -m http.server 8080
```

Abre http://localhost:8080. Para que suenen las alarmas, toca **🔔 Activar alarmas** y deja la pestaña abierta.

## App de Android (Capacitor)

La app es la misma web envuelta con [Capacitor](https://capacitorjs.com), sin rehacer el código. Las alarmas se programan en el sistema de Android (`native.js`), así que suenan con la app cerrada. Se reprograman cada vez que cambias un evento (hasta 60 días hacia adelante, máximo 400 alarmas).

```
npm run android:sync   # copia la web a www/ y actualiza el proyecto android/
npm run android:apk    # genera el APK de prueba (necesita Java 17+ y el SDK de Android)
```

También se puede generar sin instalar nada: en GitHub, pestaña **Actions → Generar APK → Run workflow**. Solo corre cuando lo pides a mano y deja el APK para descargar.

Notas:
- `android:allowBackup` está desactivado, para que los datos de salud no se copien a la nube de Google.
- Permisos: notificaciones, alarmas exactas, vibración y ubicación (solo al tocar los botones).
- En la app, «Avisarme en 5 min» (posponer) todavía no está; eso es de la pantalla de alarma de la web.
- Todavía no se probó en un teléfono real. Publicar en Play Store queda para cuando la app esté terminada.

## Pruebas

```
npm install
npm test
```

Las pruebas (vitest) cubren la lógica pura de `logic.js`: repetir el día de la semana, relleno automático, disparo de alarmas y exportación a .ics.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Página principal |
| `app.js` | Interfaz y alarmas |
| `logic.js` | Lógica pura, sin DOM |
| `geo.js` | Distancias y enlaces de mapa (lógica pura) |
| `pictos.js` | Lógica pura de pictogramas |
| `pictos-api.js` | Búsqueda en ARASAAC con caché local |
| `pictos-ui.js` | Pantalla de pictogramas |
| `live.js`, `share.js`, `config.js` | Ubicación en vivo (Supabase) |
| `supabase/` | Tablas, reglas de seguridad y guía de puesta en marcha |
| `vendor/` | Supabase y Leaflet (mapa), incluidos para que funcionen sin internet de CDN |
| `native.js` | Alarmas nativas de Android |
| `capacitor.config.json`, `android/` | Proyecto de la app de Android |
| `scripts/build-web.mjs` | Copia la web a `www/` |
| `style.css` | Estilos |
| `tests/agenda-tea.test.ts` | Pruebas |

## Pendiente

- Aviso de «es hora de salir» según la ruta y el tráfico, y seguimiento con la pantalla apagada (requiere la app de Android).
- Probar la ubicación en vivo con un proyecto real de Supabase y dos teléfonos; añadir límite de intentos de códigos antes de abrirla al público.
- Compartir la agenda con familiares o cuidadores.
- Probar el APK en un teléfono real; posponer 5 min en las alarmas nativas.
- Compartir la agenda con familiares o cuidadores.
- Registro de señales (sobrecarga sensorial, ánimo, crisis) y regulación emocional.

## Créditos

Pictogramas de [ARASAAC](https://arasaac.org) (Gobierno de Aragón), autor Sergio Palao, licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es). No se pueden usar con fines comerciales.
