# Plataforma IA-abilities

Plataforma de la capacitación IA-abilities (Coknow: Daniel Restrepo y Juan Gonzalo Tamayo) para dos equipos cliente (mercadeo y talento humano). Usa la misma arquitectura del Foro de Ideación (`~/code/foro-ideacion`).

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
