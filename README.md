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

## Diseño y privacidad

- Interfaz calmada, con colores suaves y sin movimiento brusco. Respeta la opción del sistema «reducir movimiento».
- Texto ajustable con el botón **Aa**.
- Modo oscuro: automático según el dispositivo, o elegido a mano con el botón **Tema** (automático, claro u oscuro).
- Botones grandes.
- **Pictogramas:** para buscar la imagen, cada palabra escrita se envía a la API pública de ARASAAC. El dictado por voz es opcional y avisa antes: según el navegador, el audio puede ir a un servidor externo.
- **Los datos de salud son privados:** se guardan solo en tu navegador (`localStorage`). No se envían a ningún servidor.

## Cómo probarla

No necesita instalación. Desde la raíz del repositorio:

```
python3 -m http.server 8080
```

Abre http://localhost:8080. Para que suenen las alarmas, toca **🔔 Activar alarmas** y deja la pestaña abierta.

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
| `pictos.js` | Lógica pura de pictogramas |
| `pictos-api.js` | Búsqueda en ARASAAC con caché local |
| `pictos-ui.js` | Pantalla de pictogramas |
| `style.css` | Estilos |
| `tests/agenda-tea.test.ts` | Pruebas |

## Pendiente

- Alarmas en segundo plano en Android.
- Compartir la agenda con familiares o cuidadores.
- Registro de señales (sobrecarga sensorial, ánimo, crisis) y regulación emocional.

## Créditos

Pictogramas de [ARASAAC](https://arasaac.org) (Gobierno de Aragón), autor Sergio Palao, licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es). No se pueden usar con fines comerciales.
