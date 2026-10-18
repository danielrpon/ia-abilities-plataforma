// ============================================================
// CONFIGURACIÓN · Plataforma IA-abilities (Coknow · Freaknerd)
// ============================================================
// MODE 'local'    → demo sin backend (este navegador; se sincroniza entre pestañas).
// MODE 'supabase' → producción: correr supabase/schema.sql y crear la sesión
//                   (ver README), y pegar aquí la URL y la llave anon.
// La sesión se elige con ?s=<id>: «mp-…» usa el contenido del equipo de mercadeo
// y «pco-…» el del equipo de talento humano.
// ============================================================
window.IAAB_CONFIG = {
  MODE: 'local',
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'TU-ANON-KEY',
  SESION: 'mp-demo',
  POLL_MS: 4000
};
