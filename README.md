# Plataforma IA-abilities

Plataforma de la capacitación IA-abilities (Daniel Restrepo y Juan Gonzalo Tamayo) para dos equipos cliente (mercadeo y talento humano). Usa la misma arquitectura del Foro de Ideación (`~/code/foro-ideacion`).

| Pantalla | Quién | Qué hace |
|---|---|---|
| `index.html?s=<sesión>` | Participante (celular) | Tablero de recursos por nivel: escalera, 3 capas, actividades con prompts para copiar o mandarse por WhatsApp, datasets, notas. Publica en el muro y responde encuestas. Solo ve lo que el facilitador abrió. |
| `muro.html?s=<sesión>` | Todos · `&proyectar=1` para la pantalla de la sala (con QR de ingreso) | Publicaciones del grupo por actividad, con «Me sirve». |
| `admin.html?s=<sesión>` | Facilitador (clave) | Abre actividades y marca «Ahora en la sala», lanza encuestas y ve resultados en agregado (promedio, dispersión, sugerencia de ritmo), modera y destaca el muro, QR y enlace, reinicio tras ensayos. |

- La sesión define el cliente por su prefijo: `mp-…` (verde, equipo de mercadeo) o `pco-…` (morado, equipo de talento humano).
- El contenido vive en `js/contenido.js` (fuente única con variantes `{mp, pco}`).
- Datasets ficticios en `datasets/mp` y `datasets/pco`.

## Modos
- **Práctica (`MODE: 'local'` o `?demo=1`)**: todo vive en el navegador y se sincroniza entre pestañas del mismo equipo. Clave del panel: `admin`.
- **Producción (`MODE: 'supabase'`, activo desde el 18-oct en el proyecto gratuito del foro, tablas `iaab_`)**: correr `supabase/schema.sql` en el SQL Editor, crear cada sesión con el bloque del final del archivo (clave propia, no escribirla en documentos) y pegar URL y llave anon en `js/config.js`.

## Modo foco (tablero del asistente)
- **Ahora**: cuando la sesión tiene «Ahora en la sala» (`iaab_sesiones.actual`), el celular muestra solo eso. Si `actual` es una tarjeta (`N1-10`), la tarjeta abierta; si es un capítulo (`n1-c3`), sus capas 1 y 2 y las tarjetas abiertas. Lo anterior queda plegado en «Lo que ya vimos»; lo que no se ha abierto no aparece.
- **Todo**: la biblioteca por niveles (solo los niveles con tarjetas abiertas, el mapa y el muro). Sin `actual` (antes y después de la sesión) siempre es la biblioteca.
- La presentación manda el foco con la marca `foco:N1-10` o `foco:n1-c2` (sin abrir todo el capítulo); el panel, con «Foco ›» por tarjeta. El orden «ya vimos / viene» sale del orden de `contenido.js`: numere las tarjetas en el orden en que se usan.

## Seguridad (checklist de blindaje)
- El navegador solo tiene la llave anon. Las tablas no se leen ni escriben directo: las escrituras pasan por funciones RPC que validan sesión, participante, actividad abierta y largo del texto.
- Los ids de participante no se exponen en el muro (cada dispositivo conoce solo el suyo).
- La clave del facilitador se valida en el servidor (`iaab_admin_op`) y nunca se lee desde el navegador.
- Todo texto de usuario se escapa al pintarlo.
- Reglas de contenido: solo nombre de pila; cada publicación exige confirmar que no tiene datos que identifiquen a una persona; el facilitador puede ocultar. En PCO, por contrato, solo contenido ficticio o anonimizado.

## Pruebas locales
`python3 -m http.server 8765` y abrir `http://localhost:8765/admin.html?s=mp-demo` y `index.html?s=mp-demo` en pestañas del mismo navegador.

## Autorización de grabación (Ley 1581 de 2012)

Al registrarse, cada participante elige si autoriza o no la grabación del audio (responder es obligatorio; autorizar no). El texto está en `U.GRABACION` (`js/common.js`). Si cambia el texto, suba `ver`: cada decisión queda guardada con la versión que la persona leyó.

- **Participante:** una barra bajo el encabezado muestra su decisión y deja cambiarla («Cambiar»). Retirar la autorización es un derecho.
- **Panel:** en cualquier pestaña aparece «■ Detenga la grabación» si alguien no autoriza, «Grabación en espera» si alguien no ha respondido y «● Grabación autorizada» si todos autorizan. El panel solo muestra conteos: nadie queda expuesto por nombre.
- **Prueba:** «Descargar autorizaciones (CSV)» en la pestaña Sesión. El historial vive en `iaab_consentimientos` y sobrevive a «Reiniciar».
- **Nombre:** en las sesiones `pco-…` se pide nombre y apellido (es la prueba de la autorización); en el muro solo se ve el primer nombre. En MP sigue el seudónimo.
- **Base de datos:** correr una vez `supabase/003_consentimiento_grabacion.sql` ANTES de publicar este cambio.

## Identidad entre sesiones y «Mis prompts» (migración 004, 25-oct-2026)

Correr `supabase/004_identidad.sql` una vez en el SQL Editor (es idempotente). Sin ella la plataforma sigue funcionando como antes y «Ya me registré» / «Mis prompts» muestran «Falta actualizar la base de datos».

- **Ya me registré:** en la pantalla de registro. La persona ve la lista de la sesión (primer nombre + inicial y área), toca la suya y confirma «¿Usted es …?». Entra con el mismo perfil y su decisión de grabación vigente. Riesgo aceptado: alguien podría tocar el nombre de otro.
- **Mis prompts:** pestaña en la biblioteca y plegable en «Ahora»: todo lo que la persona publicó en cualquier nivel, con Copiar.
- **Usuario huérfano:** si el perfil guardado en el celular ya no existe (tras «Reiniciar»), se limpia y se pide registro.
- **Una sesión por programa:** use la misma sesión en todas las sesiones de un cliente y no la reinicie entre ellas (se pierden los prompts).
- **Panel:** «Descargar publicaciones (CSV)» en la pestaña Sesión.

## Grupos con roles y mesa propia (migración 005, 25-oct-2026)

Correr `supabase/005_grupos.sql` una vez en el SQL Editor (idempotente; después de la 004). Sin ella el tablero sigue igual y la pestaña Grupos del panel muestra «Falta actualizar la base de datos».

- **Panel › Grupos:** «Por área» (por defecto) o «Mezclados», tamaño 3–5 (objetivo 4). Toma solo a las personas **activas** (ping en los últimos 3 minutos; `G_VENTANA_MIN` en `admin.html`). «Formar grupos» muestra una vista previa; se puede mover a cualquiera con «Mover a…» y luego «Publicar grupos». Publicados: «Rotar roles», «Borrar grupos» (doble toque), mover a mano y agregar a quien llegó tarde («Sin grupo»).
- **Algoritmo (`js/grupos.js`, funciones puras):** por área, cada área con 3 o más arma sus grupos (los escalones de la encuesta `escalon-inicio` se reparten en serpentina); quien queda solo en su área (1–2, o «Otra») se suma al grupo más pequeño, y si son 3 o más forman una mesa mixta. Mezclados: turnos por área y escalón.
- **Roles:** Coordinador (modera, da la palabra, no escribe en la IA), Piloto (escribe con su cuenta), Revisor (criterios y semáforo), Relator (publica en el muro); grupo de 3: Coordinador y relator en una persona; de 5: Apoyo. «Rotar roles» pasa a cada persona el rol de la anterior: cambia el piloto y se reparte el consumo de las cuentas gratuitas.
- **Celular:** tarjeta «Su grupo» arriba (grupo, mesa, rol, compañeros y las 3 reglas del coordinador). Si no hay grupos, no aparece.
- **Mesa propia:** el archivo (N2-03), los prompts por mesa (`promptMesa`, N2-04 y N2-05) y los criterios (`porMesa`, N2-14) muestran primero la mesa de la persona: la de su grupo; si no tiene, la que eligió con «Trabajar con esta mesa»; si no, la de su área. Las otras mesas quedan en «Ver las otras mesas».
- **Reiniciar** borra también los grupos (cascada).
