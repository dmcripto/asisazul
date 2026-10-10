# Ubicación en vivo: puesta en marcha con Supabase

La app guarda la ubicación en tu propio proyecto de Supabase. Sin este paso, la tarjeta «Ubicación en vivo» dice que no está configurada y no envía nada.

## 1. Crear el proyecto (lo haces tú)
1. Entra en https://supabase.com y crea una cuenta.
2. **New project**. Elige un nombre (por ejemplo `asisazul`), una contraseña de base de datos (guárdala) y la región más cercana.

## 2. Configurar las cuentas (correo y contraseña)
En el proyecto:
1. **Authentication → Sign In / Providers → Email**: déjalo activado y deja **Confirm email** activado.
2. En esa misma pantalla, sube **Minimum password length** a **8**.
3. **Authentication → Email Templates**: en **Confirm signup** y en **Reset Password**, cambia el cuerpo del mensaje para que muestre el código en vez del enlace. Por ejemplo: `Tu código de Asisazul es: {{ .Token }}`. La app pide ese código; no usa enlaces. Tienes los textos listos en `plantilla-confirmar-cuenta.html` y `plantilla-restablecer-clave.html`: abre el archivo, copia todo y pégalo en el cuadro del cuerpo (*Message body*). Asunto sugerido: «Tu código de Asisazul».
4. **Anonymous Sign-Ins** debe quedar **desactivado**.
5. El correo que trae Supabase por defecto solo permite unos pocos mensajes por hora. Para usarlo en serio, configura tu propio servidor de correo en **Project Settings → Authentication → SMTP Settings**.

## 3. Crear las tablas y las reglas de seguridad
**SQL Editor → New query**, pega todo `supabase/schema.sql` y pulsa **Run**. Puedes repetirlo sin problema.

## 4. Conectar la app
En **Project Settings → API** copia:
- **Project URL**
- **anon public key**

Pégalos en `config.js`. **No uses la `service_role key`.** La anon key puede ir en la app porque las reglas del paso 3 limitan qué puede leer cada persona.

Luego `npm run android:apk`, o vuelve a ejecutar el flujo «Generar APK» en GitHub.

## Cómo funciona
- Quien comparte pulsa **Empezar a compartir** y elige 15 min, 1 h u 8 h. No hay «para siempre».
- **Crear código** da 6 caracteres que valen 10 minutos y una sola vez. El familiar los escribe en **Vincular**.
- Solo se guarda la última posición (sin historial). Se borra al parar o al vencer el tiempo.
- Los familiares la ven en un mapa que se actualiza solo.
- Cualquiera de los dos puede cortar el vínculo cuando quiera.
- En Android, mientras se comparte aparece una notificación fija «Compartiendo tu ubicación», y el GPS sigue con la pantalla apagada.

## Límites que conviene conocer
- Cada persona tiene su cuenta con correo y contraseña, así que puede entrar desde otro teléfono. Las reglas de la base de datos hacen que cada una vea solo sus datos y los de las personas vinculadas con ella. Puede borrar su cuenta y todos sus datos desde **Mi cuenta**.
- La agenda (eventos, alarmas) sigue guardándose solo en el teléfono. La cuenta no la sube a ningún lado.
- Esto no se ha probado todavía con un proyecto real de Supabase ni con GPS en un teléfono. Antes de usarlo con personas de verdad, pruébalo tú con dos teléfonos y revisa las reglas en **Authentication → Policies**.
- Un código de 6 caracteres con vigencia de 10 minutos es razonable, pero no es una defensa fuerte contra alguien que pruebe códigos sin parar. Si piensas lanzar la app al público, hay que añadir límite de intentos.
- El mapa usa los mosaicos de OpenStreetMap. Para uso masivo hay que contratar un proveedor de mapas.
