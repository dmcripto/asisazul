# Ubicación en vivo: puesta en marcha con Supabase

La app guarda la ubicación en tu propio proyecto de Supabase. Sin este paso, la tarjeta «Ubicación en vivo» dice que no está configurada y no envía nada.

## 1. Crear el proyecto (lo haces tú)
1. Entra en https://supabase.com y crea una cuenta.
2. **New project**. Elige un nombre (por ejemplo `asisazul`), una contraseña de base de datos (guárdala) y la región más cercana.

## 2. Activar el acceso sin correo
En el proyecto: **Authentication → Sign In / Providers → Anonymous Sign-Ins → activar**.
Así nadie tiene que crear usuario ni contraseña. Cada teléfono recibe una identidad anónima.

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
- La identidad es anónima y vive en el teléfono. Si se borran los datos de la app, hay que volver a vincular.
- Esto no se ha probado todavía con un proyecto real de Supabase ni con GPS en un teléfono. Antes de usarlo con personas de verdad, pruébalo tú con dos teléfonos y revisa las reglas en **Authentication → Policies**.
- Un código de 6 caracteres con vigencia de 10 minutos es razonable, pero no es una defensa fuerte contra alguien que pruebe códigos sin parar. Si piensas lanzar la app al público, hay que añadir límite de intentos.
- El mapa usa los mosaicos de OpenStreetMap. Para uso masivo hay que contratar un proveedor de mapas.
