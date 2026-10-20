/* ============================================================
   Utilidades compartidas: cliente, textos, avisos, copiar, prompts.
   ============================================================ */
(function () {
  const C = /^pco/.test(window.DB.SES) ? 'pco' : 'mp';
  document.documentElement.setAttribute('data-client', C);

  const U = { C };
  U.$ = s => document.querySelector(s);
  U.v = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x[C] : x;
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.DATASETS = 'datasets/' + C + '/';
  U.store = {
    get(k) { try { return localStorage.getItem('iaab:' + window.DB.SES + ':' + k); } catch (e) { return null; } },
    set(k, val) { try { localStorage.setItem('iaab:' + window.DB.SES + ':' + k, val); } catch (e) {} }
  };
  U.tarjeta = id => window.TARJETAS.find(a => a.id === id);
  U.cap = id => window.CAPITULOS.find(c => c.id === id);
  /* «Ahora en la sala»: actual puede ser un capítulo (n1-c3) o una tarjeta (N1-10); el capítulo sale de la tarjeta.
     El orden de las tarjetas es el de contenido.js (N1-00…N1-17 son cronológicos). */
  U.orden = id => window.TARJETAS.findIndex(t => t.id === id);
  U.foco = S => {
    const a = S && S.actual; if (!a) return null;
    const t = U.tarjeta(a); if (t) return { cap: U.cap(t.capitulo), tarjeta: t };
    const c = U.cap(a); return c ? { cap: c, tarjeta: null } : null;
  };
  U.actLabel = id => { const a = U.tarjeta(id) || U.cap(id); return a ? (a.id.startsWith('N') ? a.id + ' · ' : 'Nivel 0' + a.nivel + ' · ') + a.t : id; };
  U.TIPOS = { hallazgo: 'Hallazgo', par: 'Sin estructura / con la guía', prompt: 'Prompt', loop: 'Loop' };
  U.hora = iso => { try { return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };

  let toastT;
  U.toast = msg => {
    let t = U.$('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1700);
  };
  U.copiar = async text => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const a = document.createElement('textarea'); a.value = text; a.setAttribute('readonly', '');
      a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); } catch (_) {}
      a.remove();
    }
    U.toast('<i>✓</i> Copiado. Péguelo en su asistente.');
  };
  U.whatsapp = text => window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  U.errMsg = e => {
    const m = String(e && e.message || e);
    if (/CLAVE_INVALIDA/.test(m)) return 'Clave incorrecta.';
    if (/ACTIVIDAD_CERRADA/.test(m)) return 'Esta actividad todavía no está abierta.';
    if (/ENCUESTA_CERRADA/.test(m)) return 'La encuesta ya se cerró.';
    if (/TEXTO_INVALIDO|check constraint/.test(m)) return 'Revise el texto: no puede ir vacío ni pasar de 4.000 caracteres.';
    if (/Failed to fetch|NetworkError/.test(m)) return 'Sin conexión. Intente de nuevo.';
    if (/OP_DESCONOCIDA/.test(m)) return 'Falta actualizar la base de datos (supabase/002_resultados_en_muro.sql).';
    if (/FALTA_GRABACION/.test(m)) return 'Elija si autoriza o no la grabación de la sesión.';
    if (/iaab_registrar_v2|iaab_consentir|iaab_grabacion/.test(m)) return 'Falta actualizar la base de datos (supabase/003_consentimiento_grabacion.sql).';
    return 'No se pudo completar. Intente de nuevo.';
  };

  /* Autorización de grabación (Ley 1581 de 2012). Si cambia el texto, suba «ver»:
     cada decisión queda guardada con la versión que la persona leyó. */
  U.GRABACION = {
    ver: 'v1 · 2026-10-19',
    resumen: 'Para preparar las memorias del programa grabamos el audio de la sesión con Plaud. Es voluntario: si alguien no lo autoriza, la sesión no se graba y su participación sigue igual.',
    texto: [
      ['Responsable', 'Daniel Restrepo Núñez, facilitador del programa IA-abilities. Contacto: contacto@freaknerd.co.'],
      ['Qué se graba', 'Solo el audio de la sesión, que incluye su voz y lo que diga en ella. La voz es un dato personal según la Ley 1581 de 2012. No se graba video.'],
      ['Para qué', 'Transcribir y resumir la sesión para elaborar las memorias, ajustar el programa y preparar el material de seguimiento de su equipo. No se publica ni se usa para otros fines.'],
      ['Con qué herramienta', 'Plaud. El audio se procesa con proveedores de IA (OpenAI, Google o Microsoft) fuera de Colombia, bajo contratos que les impiden conservarlo o usarlo para entrenar modelos de inteligencia artificial.'],
      ['Por cuánto tiempo', 'Hasta tres meses después de terminar el programa. Luego se borran el audio y la transcripción.'],
      ['Sus derechos', 'Conocer, actualizar, rectificar y suprimir sus datos, y retirar esta autorización cuando quiera, desde este tablero («Grabación · Cambiar») o escribiendo a contacto@freaknerd.co.'],
      ['Es voluntaria', 'No está obligado a autorizar y no autorizar no afecta su participación. Si una persona no autoriza, el facilitador detiene la grabación.']
    ]
  };
  U.grabacionHtml = () => `<dl class="consent">${U.GRABACION.texto.map(([t, d]) => `<dt>${U.esc(t)}</dt><dd>${U.esc(d)}</dd>`).join('')}</dl><p class="hint">Versión ${U.esc(U.GRABACION.ver)}</p>`;
  U.grabacionPick = (val) => `<div class="pick" role="group" aria-label="Grabación de la sesión">
    <button type="button" data-graba="si" aria-pressed="${val === true}"><span class="k">●</span><span class="td"><span class="t">Autorizo la grabación</span><span class="d">Mi voz puede quedar en el audio de la sesión.</span></span></button>
    <button type="button" data-graba="no" aria-pressed="${val === false}"><span class="k">■</span><span class="td"><span class="t">No autorizo la grabación</span><span class="d">El facilitador verá un aviso para detenerla.</span></span></button></div>`;

  U.ICON_COPY ='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  U.ICON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 0 1-13.4 7.9L3 21l1.2-4.4A9 9 0 1 1 21 12z"/></svg>';

  /* Prompts copiables: se registran en una lista y los botones guardan el índice */
  U.PROMPTS = [];
  U.promptBox = (text, label, cls) => {
    const i = U.PROMPTS.push(text) - 1;
    return `<div class="prompt ${cls || ''}"><div class="prompt-h"><span>${U.esc(label || 'Prompt')}</span></div>
      <pre>${U.esc(text)}</pre>
      <div class="prompt-a"><button class="btn" data-copy="${i}">${U.ICON_COPY}Copiar</button>
      <button class="btn alt" data-wa="${i}">${U.ICON_WA}Enviármelo por WhatsApp</button></div></div>`;
  };
  U.ladder = (N) => {
    const on = new Set(N.escalones), asoma = new Set(N.asoma || []);
    return `<div class="ladder" aria-hidden="true">${window.ESCALERA.map(e => `<div class="step ${on.has(e.k) ? 'here' : ''} ${asoma.has(e.k) ? 'on' : ''}" style="--i:${e.k}"></div>`).join('')}</div>
      <div class="ladder-lbl"><span>0 · Buscador</span><span>7 · Piloto automático</span></div>`;
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) U.copiar(U.PROMPTS[+b.dataset.copy]);
    if (b.dataset.wa) U.whatsapp(U.PROMPTS[+b.dataset.wa]);
  });

  /* Resultados de una encuesta, siempre en agregado. El panel (fac) ve además la regla y la sugerencia;
     el muro proyectado no, para no adelantar la discusión. */
  U.resultados = (E, rows, fac) => {
    const esc = U.esc;
    /* Cada barra: porcentaje sobre el total de respuestas y, entre paréntesis, el número de votos */
    const bar = (label, c, n, color) => { const pc = n ? Math.round(100 * c / n) : 0;
      return `<div class="bar"><span>${label}</span><span class="track"><span class="fill" style="display:block;width:${pc}%${color ? ';background:' + color : ''}"></span></span><span class="v">${pc} % <i>(${c})</i></span></div>`; };
    if (E.tipo === 'escalon'){
      const vals = rows.map(r => r.valor && r.valor.escalon).filter(x => x != null);
      const n = vals.length, prom = n ? vals.reduce((a, b) => a + b, 0) / n : 0;
      const sd = n ? Math.sqrt(vals.reduce((a, b) => a + (b - prom) ** 2, 0) / n) : 0;
      const arriba2 = n ? Math.round(100 * vals.filter(x => x >= 2).length / n) : 0;
      return `<div class="stats"><span><b>${n}</b>respuestas</span><span><b>${prom.toFixed(1).replace('.', ',')}</b>promedio</span><span><b>${sd.toFixed(1).replace('.', ',')}</b>dispersión</span><span><b>${arriba2} %</b>en el 2 o arriba</span></div>
        <div class="bars">${window.ESCALERA.map(e => bar(`${e.k} · ${esc(e.t)}`, vals.filter(x => x === e.k).length, n)).join('')}</div>
        ${fac ? `<p class="hint">${n ? (arriba2 >= 80 ? 'El 80 % o más está en el escalón 2 o arriba: pase rápido por los escalones 0 y 1.' : sd >= 1.5 ? 'Dispersión alta: arme mesas mixtas con al menos una persona avanzada.' : 'Grupo parejo: siga el ritmo previsto.') : ''}</p>` : ''}`;
    }
    if (E.tipo === 'semaforo'){
      const casos = rows.map(r => r.valor && r.valor.casos).filter(Boolean);
      return `<div class="stats"><span><b>${casos.length}</b>respuestas</span></div><div class="bars">${window.SEMAFORO[C].map(([txt, col], j) => {
        const c = { v: 0, a: 0, r: 0 }; casos.forEach(cs => { if (c[cs[j]] != null) c[cs[j]]++; });
        const n = Math.max(1, casos.length), acuerdo = Math.max(c.v, c.a, c.r) / n;
        const nota = [fac ? 'regla: ' + { v: 'verde', a: 'amarillo', r: 'rojo', d: 'debate' }[col] : '', casos.length && acuerdo < 0.7 ? 'sin acuerdo: discutir' : ''].filter(Boolean).join(' · ');
        return `<div class="sem-caso"><div class="sem-t">${j + 1}. ${esc(txt)}${nota ? ` <span class="m">· ${nota}</span>` : ''}</div>
          ${['v', 'a', 'r'].map(k => bar({ v: 'Verde', a: 'Amarillo', r: 'Rojo' }[k], c[k], casos.length, `var(--${{ v: 'ok', a: 'warn', r: 'no' }[k]})`)).join('')}</div>`; }).join('')}</div>`;
    }
    if (E.tipo === 'multiple'){
      const ops = rows.map(r => r.valor && r.valor.opcion).filter(x => x != null);
      return `<div class="stats"><span><b>${ops.length}</b>respuestas</span></div><div class="bars">${E.opciones.map((o, j) => bar(esc(o), ops.filter(x => x === j).length, ops.length)).join('')}</div>`;
    }
    return `<div class="posts">${rows.map(r => `<article class="post"><pre>${esc(r.valor && r.valor.texto)}</pre></article>`).join('') || '<p class="hint">Sin respuestas todavía.</p>'}</div>`;
  };

  /* Aviso de modo demo */
  U.demoBanner = () => {
    if (window.DB.MODE !== 'local') return;
    const d = document.createElement('div'); d.className = 'demo-banner';
    d.textContent = 'Modo práctica: los datos viven solo en este navegador.';
    document.body.prepend(d);
  };
  window.U = U;
})();
