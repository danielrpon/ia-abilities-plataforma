/* ============================================================
   DB — capa de datos de la plataforma IA-abilities.
   Dos backends con la MISMA interfaz (mismo patrón del Foro de Ideación):
   - supabase: producción (todas las pantallas comparten la nube)
   - local:    demo en este navegador (localStorage + BroadcastChannel)
   ============================================================ */
(function () {
  const CFG = window.IAAB_CONFIG || {};
  const qs = new URLSearchParams(location.search);
  const SES = (qs.get('s') || CFG.SESION || 'mp-demo').toLowerCase();
  const placeholder = !CFG.SUPABASE_URL || /TU-PROYECTO/.test(CFG.SUPABASE_URL) || !CFG.SUPABASE_ANON_KEY || /TU-ANON/.test(CFG.SUPABASE_ANON_KEY);
  const MODE = (CFG.MODE === 'supabase' && !placeholder && window.supabase && qs.get('demo') !== '1') ? 'supabase' : 'local';

  const DB = { MODE, SES, clave: sessionStorage.getItem('iaab_clave_' + SES) || '' };
  DB.setClave = (c) => { DB.clave = c; sessionStorage.setItem('iaab_clave_' + SES, c); };

  /* ---------------- SUPABASE ---------------- */
  if (MODE === 'supabase') {
    const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    const ok = (r) => { if (r.error) throw new Error(r.error.message || JSON.stringify(r.error)); return r.data; };
    DB.getSesion = async () => ok(await sb.from('iaab_v_sesiones').select('*').eq('id', SES).maybeSingle());
    DB.registrar = async (nombre, area) => ok(await sb.rpc('iaab_registrar', { p_sesion: SES, p_nombre: nombre, p_area: area }));
    DB.ping = async (pid) => { try { await sb.rpc('iaab_ping', { p_id: pid }); } catch (e) {} };
    DB.getPublicaciones = async () => ok(await sb.from('iaab_v_publicaciones').select('*').eq('sesion_id', SES).order('created_at', { ascending: false }));
    DB.publicar = async (pid, nombre, act_id, texto, tipo) => ok(await sb.rpc('iaab_publicar', { p_sesion: SES, p_part: pid, p_act: act_id, p_texto: texto, p_tipo: tipo || 'prompt' }));
    DB.getMisVotos = async (pid) => (ok(await sb.rpc('iaab_mis_votos', { p_part: pid })) || []).map(Number);
    DB.votar = async (pub_id, pid) => ok(await sb.rpc('iaab_votar', { p_pub: pub_id, p_part: pid }));
    DB.quitarVoto = async (pub_id, pid) => ok(await sb.rpc('iaab_quitar_voto', { p_pub: pub_id, p_part: pid }));
    DB.responder = async (encuesta_id, pid, valor) => ok(await sb.rpc('iaab_responder', { p_sesion: SES, p_encuesta: encuesta_id, p_part: pid, p_valor: valor }));
    DB.getResultados = async () => ok(await sb.rpc('iaab_resultados', { p_sesion: SES }));
    DB.admin = async (op, payload = {}, clave) => ok(await sb.rpc('iaab_admin_op', { p_sesion: SES, p_clave: clave || DB.clave, p_op: op, p_payload: payload }));
    DB.onChange = null; // las pantallas refrescan cada POLL_MS
  }

  /* ---------------- LOCAL (demo) ---------------- */
  else {
    const KEY = 'iaab_local_' + SES;
    const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('iaab_' + SES) : null;
    const nowIso = () => new Date().toISOString();
    const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'p-' + Math.random().toString(36).slice(2) + Date.now());
    const cliente = /^pco/.test(SES) ? 'pco' : 'mp';
    const seed = () => ({
      seq: 1,
      sesion: { id: SES, cliente, nombre: 'IA-abilities · ' + (cliente === 'pco' ? 'Equipo de talento humano' : 'Equipo de mercadeo') + ' (práctica)',
        habilitadas: [], actual: null, encuesta: null, muestra: null, clave_admin: 'admin', created_at: nowIso() },
      participantes: [], publicaciones: [], votos: [], respuestas: []
    });
    const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sesion) return s; } catch (e) {} const s = seed(); save(s); return s; };
    const save = (s) => { localStorage.setItem(KEY, JSON.stringify(s)); if (chan) chan.postMessage('upd'); };
    const nextId = (s) => (s.seq = (s.seq || 1) + 1);
    const pub = (s) => { const { clave_admin, ...rest } = s.sesion; return rest; };
    const vPubs = (s) => s.publicaciones.map(p => ({ ...p, votos: s.votos.filter(v => v.publicacion_id === p.id).length }));

    DB.getSesion = async () => pub(load());
    DB.registrar = async (nombre, area) => { const s = load(); const p = { id: uuid(), sesion_id: SES, nombre, area, created_at: nowIso(), last_seen: nowIso() }; s.participantes.push(p); save(s); return p; };
    DB.ping = async (pid) => { const s = load(); const p = s.participantes.find(p => p.id === pid); if (p) { p.last_seen = nowIso(); localStorage.setItem(KEY, JSON.stringify(s)); } };
    DB.getPublicaciones = async () => vPubs(load()).filter(p => p.estado !== 'oculta').sort((a, b) => b.created_at.localeCompare(a.created_at));
    DB.publicar = async (pid, nombre, act_id, texto, tipo) => {
      const s = load();
      if (!s.sesion.habilitadas.includes(act_id)) throw new Error('ACTIVIDAD_CERRADA');
      if (!texto || texto.length > 4000) throw new Error('TEXTO_INVALIDO');
      const p = { id: nextId(s), sesion_id: SES, participante_id: pid, nombre, act_id, texto, tipo: tipo || 'prompt', estado: 'visible', created_at: nowIso() };
      s.publicaciones.push(p); save(s); return p;
    };
    DB.getMisVotos = async (pid) => load().votos.filter(v => v.participante_id === pid).map(v => v.publicacion_id);
    DB.votar = async (pub_id, pid) => { const s = load(); if (s.votos.some(v => v.publicacion_id === pub_id && v.participante_id === pid)) return true; s.votos.push({ id: nextId(s), sesion_id: SES, publicacion_id: pub_id, participante_id: pid }); save(s); return true; };
    DB.quitarVoto = async (pub_id, pid) => { const s = load(); s.votos = s.votos.filter(v => !(v.publicacion_id === pub_id && v.participante_id === pid)); save(s); return true; };
    DB.responder = async (encuesta_id, pid, valor) => {
      const s = load();
      if (!s.sesion.encuesta || s.sesion.encuesta !== encuesta_id) throw new Error('ENCUESTA_CERRADA');
      s.respuestas = s.respuestas.filter(r => !(r.encuesta_id === encuesta_id && r.participante_id === pid));
      s.respuestas.push({ id: nextId(s), sesion_id: SES, encuesta_id, participante_id: pid, valor, created_at: nowIso() });
      save(s); return true;
    };
    DB.getResultados = async () => {
      const s = load(), m = s.sesion.muestra;
      return m ? { encuesta_id: m, rows: s.respuestas.filter(x => x.encuesta_id === m).map(x => ({ valor: x.valor })) } : null;
    };
    DB.admin = async (op, payload = {}, clave) => {
      const s = load(); clave = clave || DB.clave;
      if (clave !== s.sesion.clave_admin) throw new Error('CLAVE_INVALIDA');
      let r = { ok: true };
      switch (op) {
        case 'login': break;
        case 'habilitar': {
          const set = new Set(s.sesion.habilitadas);
          (payload.ids || []).forEach(id => payload.on ? set.add(id) : set.delete(id));
          s.sesion.habilitadas = [...set]; break;
        }
        case 'actual': s.sesion.actual = payload.id || null; break;
        case 'encuesta': s.sesion.encuesta = payload.id || null; break;
        case 'muestra': s.sesion.muestra = payload.id || null; break;
        case 'estado_pub': { const p = s.publicaciones.find(p => p.id === Number(payload.id)); if (p) p.estado = payload.estado; break; }
        case 'publicaciones': r.rows = vPubs(s); break;
        case 'participantes': r.rows = s.participantes; break;
        case 'respuestas': r.rows = s.respuestas.filter(x => x.encuesta_id === payload.encuesta_id).map(({ participante_id, ...x }) => x); break;
        case 'borrar_todo': Object.assign(s, { participantes: [], publicaciones: [], votos: [], respuestas: [] }); Object.assign(s.sesion, { habilitadas: [], actual: null, encuesta: null, muestra: null }); break;
        default: throw new Error('OP_DESCONOCIDA: ' + op);
      }
      save(s); return r;
    };
    DB.onChange = (fn) => { if (chan) chan.onmessage = fn; window.addEventListener('storage', (e) => { if (e.key === KEY) fn(); }); };
  }

  window.DB = DB;
})();
