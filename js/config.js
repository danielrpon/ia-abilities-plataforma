// ============================================================
// CONFIGURACIÓN · Plataforma IA-abilities (Freaknerd)
// ============================================================
// Práctica sin backend: agregar ?demo=1 a la URL (o MODE 'local').
// MODE 'local'    → demo sin backend (este navegador; se sincroniza entre pestañas).
// MODE 'supabase' → producción: correr supabase/schema.sql y crear la sesión
//                   (ver README), y pegar aquí la URL y la llave anon.
// La sesión se elige con ?s=<id>: «mp-…» usa el contenido del equipo de mercadeo
// y «pco-…» el del equipo de talento humano.
// ============================================================
window.IAAB_CONFIG = {
  MODE: 'supabase',
  SUPABASE_URL: 'https://zccrvdytrmrloahnbajl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3J2ZHl0cm1ybG9haG5iYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NDA2NzQsImV4cCI6MjEwNDQxNjY3NH0.blfohUbSXniU_WMHzGAsek9DA_7ZsGNgxsoDJeC7hDg',
  SESION: 'mp-ensayo',
  POLL_MS: 4000
};
