/* ============================================================
   GRUPOS — formación automática de grupos con roles que rotan.
   Lo usa el panel (formar, rotar, mover) y el celular (qué hace su rol).
   Funciones puras: sin DOM ni base de datos (se prueban con node).
   ============================================================ */
(function (root) {
  const ROLES = {
    'coordinador':         { t: 'Coordinador', d: 'Modera, cuida el tiempo y da la palabra. No escribe en la IA.' },
    'piloto':              { t: 'Piloto', d: 'Escribe en la IA con su propia cuenta y muestra la pantalla al grupo.' },
    'revisor':             { t: 'Revisor', d: 'Contrasta la respuesta con los criterios de la mesa y con el semáforo.' },
    'relator':             { t: 'Relator', d: 'Publica en el muro lo que el grupo acordó.' },
    'apoyo':               { t: 'Apoyo', d: 'Busca los datos en el archivo y cronometra.' },
    'coordinador-relator': { t: 'Coordinador y relator', d: 'Modera, da la palabra y publica en el muro lo acordado. No escribe en la IA.' }
  };
  const REGLAS = [
    'Nadie habla dos veces hasta que todos hayan hablado una.',
    'Cada idea en un minuto. Si se alarga: «¿cuál es la conclusión?».',
    'El grupo decide con la evidencia del revisor, no con la opinión más fuerte.'
  ];
  /* Roles según el tamaño del grupo, en orden de asignación */
  function rolesPara(n) {
    if (n <= 1) return ['piloto'];
    if (n === 2) return ['piloto', 'revisor'];
    if (n === 3) return ['coordinador-relator', 'piloto', 'revisor'];
    const r = ['coordinador', 'piloto', 'revisor', 'relator'];
    while (r.length < n) r.push('apoyo');
    return r;
  }
  /* Cuántos grupos para n personas con tamaño objetivo t, dentro de [min, max] */
  function cuantos(n, t, min, max) {
    if (n <= max) return 1;
    const kmin = Math.ceil(n / max), kmax = Math.max(kmin, Math.floor(n / min));
    return Math.min(kmax, Math.max(kmin, Math.round(n / t)));
  }
  /* Reparte en k grupos en serpentina (1,2,3,3,2,1…) para que los escalones altos queden repartidos */
  function serpentina(lista, k) {
    const g = Array.from({ length: k }, () => []);
    lista.forEach((p, i) => { const r = Math.floor(i / k), j = i % k; g[r % 2 ? k - 1 - j : j].push(p); });
    return g;
  }
  const porEscalon = (a, b) => (b.escalon ?? -1) - (a.escalon ?? -1) || String(a.corto).localeCompare(String(b.corto));

  /* Participantes: [{id, corto, area, escalon}]. Devuelve [{mesa, miembros:[p…]}] (sin roles todavía).
     opts: {modo:'area'|'mezclados', tam:4, min:3, max:5, areas:[orden preferido], sinMesa:['Otra']} */
  function formar(participantes, opts) {
    const o = Object.assign({ modo: 'area', tam: 4, min: 3, max: 5, areas: [], sinMesa: ['Otra'] }, opts || {});
    o.tam = Math.min(o.max, Math.max(o.min, o.tam));
    const ps = participantes.slice();
    if (!ps.length) return [];
    const ordenArea = a => { const i = o.areas.indexOf(a); return i < 0 ? 999 : i; };

    if (o.modo === 'mezclados') {
      const k = cuantos(ps.length, o.tam, o.min, o.max);
      const colas = {};
      ps.slice().sort(porEscalon).forEach(p => (colas[p.area || ''] = colas[p.area || ''] || []).push(p));
      const areas = Object.keys(colas).sort((a, b) => colas[b].length - colas[a].length || ordenArea(a) - ordenArea(b));
      const seq = [];
      while (seq.length < ps.length) areas.forEach(a => { if (colas[a].length) seq.push(colas[a].shift()); });
      return serpentina(seq, k).map(m => ({ mesa: null, miembros: m }));
    }

    /* Por área: cada área con 3 o más forma sus grupos; los sueltos (1–2 por área, o «Otra») se suman al grupo
       más pequeño o, si son 3 o más, forman una mesa mixta. */
    const buckets = {};
    ps.forEach(p => (buckets[p.area || ''] = buckets[p.area || ''] || []).push(p));
    const grupos = [], sueltos = [];
    Object.keys(buckets).sort((a, b) => ordenArea(a) - ordenArea(b) || a.localeCompare(b)).forEach(a => {
      const b = buckets[a].slice().sort(porEscalon);
      if (b.length < o.min || o.sinMesa.includes(a)) { sueltos.push(...b); return; }
      serpentina(b, cuantos(b.length, o.tam, o.min, o.max)).forEach(m => grupos.push({ mesa: a, miembros: m }));
    });
    sueltos.sort(porEscalon);
    if (sueltos.length >= o.min || !grupos.length) {
      serpentina(sueltos, cuantos(sueltos.length, o.tam, o.min, o.max)).forEach(m => grupos.push({ mesa: null, miembros: m }));
    } else {
      sueltos.forEach(p => {
        const menor = grupos.slice().sort((x, y) => x.miembros.length - y.miembros.length)[0];
        menor.miembros.push(p);
      });
    }
    /* Una mesa «mixta» donde todos son de la misma área es, en realidad, la mesa de esa área */
    grupos.forEach(g => {
      const as = [...new Set(g.miembros.map(p => p.area || ''))];
      if (!g.mesa && as.length === 1 && as[0] && !o.sinMesa.includes(as[0])) g.mesa = as[0];
    });
    return grupos.filter(g => g.miembros.length);
  }

  /* Filas para guardar: [{pid, grupo, rol, mesa, orden}] */
  function asignar(grupos) {
    const filas = [];
    grupos.forEach((g, i) => {
      const r = rolesPara(g.miembros.length);
      g.miembros.forEach((p, j) => filas.push({ pid: p.id, grupo: i + 1, rol: r[j], mesa: g.mesa || '', orden: j }));
    });
    return filas;
  }

  /* Rotar: dentro de cada grupo, cada persona toma el rol de la anterior (así cambia el piloto) */
  function rotar(filas) {
    const por = {};
    filas.forEach(f => (por[f.grupo] = por[f.grupo] || []).push(f));
    return Object.values(por).flatMap(g => {
      g.sort((a, b) => a.orden - b.orden);
      const roles = g.map(f => f.rol);
      return g.map((f, j) => Object.assign({}, f, { rol: roles[(j - 1 + g.length) % g.length] }));
    });
  }

  /* Mover a una persona a otro grupo (o a uno nuevo con destino = 'nuevo'); renumera y vuelve a dar roles en los grupos tocados */
  function mover(filas, pid, destino) {
    const f = filas.find(x => x.pid === pid); if (!f) return filas;
    const origen = f.grupo;
    let nuevo = destino === 'nuevo' ? Math.max(0, ...filas.map(x => x.grupo)) + 1 : Number(destino);
    if (nuevo === origen) return filas;
    let out = filas.map(x => x.pid === pid ? Object.assign({}, x, { grupo: nuevo, orden: 999 }) : Object.assign({}, x));
    const dest = out.filter(x => x.grupo === nuevo && x.pid !== pid);
    const mov = out.find(x => x.pid === pid);
    mov.mesa = dest.length ? dest[0].mesa : (f.mesa || '');
    [origen, nuevo].forEach(gr => {
      const g = out.filter(x => x.grupo === gr).sort((a, b) => a.orden - b.orden);
      const r = rolesPara(g.length);
      g.forEach((x, j) => { x.orden = j; x.rol = r[j]; });
    });
    /* Renumera 1..k sin huecos */
    const ids = [...new Set(out.map(x => x.grupo))].sort((a, b) => a - b);
    out.forEach(x => { x.grupo = ids.indexOf(x.grupo) + 1; });
    return out;
  }

  const API = { ROLES, REGLAS, rolesPara, formar, asignar, rotar, mover };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.GRUPOS = API;
})(typeof window !== 'undefined' ? window : globalThis);
