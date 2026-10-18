/* ============================================================
   CONTENIDO del programa IA-abilities (fuente única, dos equipos).
   Textos con {mp:'…', pco:'…'}: «mp» = equipo de mercadeo, «pco» = equipo de talento humano.
   Estructura: nivel → capítulos (cada uno con sus 3 capas) → tarjetas.
   Ids de tarjeta «N1-00»…; ids de capítulo «n1-c0»….
   v0.2 · 2026-10-18 · según «00 Diseño del programa - estructura y contenido - v2.0» (§3 y §4).
   ============================================================ */

window.EQUIPO = { mp: 'Equipo de mercadeo', pco: 'Equipo de talento humano' };

/* La escalera: piso + 7 escalones */
window.ESCALERA = [
  {k:0, t:'Piso · Buscador', d:'Le pregunta cosas sueltas, como a Google.', w:'Nivel 01'},
  {k:1, t:'Planear antes de pedir', d:'Deja que la IA le pregunte y arme el plan antes de producir.', w:'Nivel 01 · Nivel 02'},
  {k:2, t:'Darle el manual', d:'La IA ya sabe quién es usted, su tono y sus reglas, sin repetírselo.', w:'Nivel 02 · Nivel 03'},
  {k:3, t:'No repetir', d:'Lo que hace cada semana queda guardado en un asistente propio.', w:'Nivel 03'},
  {k:4, t:'Conectar', d:'La IA lee el correo, el Drive o una base sin copiar y pegar (con TI).', w:'Nivel 03 · Nivel 04'},
  {k:5, t:'Por fases', d:'Un trabajo grande en etapas, cada una con su criterio de «listo».', w:'Nivel 02 (asoma) · Nivel 04'},
  {k:6, t:'Un equipo de especialistas', d:'Uno investiga, otro redacta, otro revisa.', w:'Nivel 02 (asoma) · Nivel 04'},
  {k:7, t:'Piloto automático', d:'El trabajo corre solo y usted revisa el resultado.', w:'Nivel 04'}
];

const HERRAMIENTA = {mp:'ChatGPT o Claude, con la cuenta de la empresa', pco:'ChatGPT Enterprise, con la cuenta de la empresa'};

window.NIVELES = [
/* ======================= NIVEL 01 ======================= */
{
  id:1, verbo:'Entender', escalones:[0,1],
  lede:'Qué es la IA, qué datos sí y qué datos no, y cómo pedirle bien las cosas. Hoy subimos del piso al escalón 1.',
  capitulos:[
  { id:'n1-c0', t:'La escalera', min:'12 min',
    donde:'En el piso, mirando la escalera completa.',
    nuevo:['<b>La IA no es una herramienta: es una escalera de formas de trabajar.</b> Cada escalón contiene al anterior; nada se reemplaza, se acumula.',
           '<b>Como aprender a conducir:</b> primero el carro parqueado, luego la ruta planeada… y al final el piloto automático con usted mirando. Las marcas cambian; la forma de conducir no.'],
    habilita:['<b>Este tablero:</b> su cuaderno de hoy y de todo el programa.'],
    tarjetas:[
      {id:'N1-00', t:'Bienvenida y cinco acuerdos', tipo:'texto',
       html:`<ol class="steps">
        <li><span><b>Computador abierto.</b> La mitad de cada sesión es práctica. Tenga su sesión iniciada en la cuenta de trabajo.</span></li>
        <li><span><b>Cero datos reales.</b> En clase, solo datos de ejemplo.</span></li>
        <li><span><b>No hay preguntas tontas.</b> Si una palabra no se entiende, se pregunta.</span></li>
        <li><span><b>Usted firma.</b> La IA propone, usted decide. Todo se revisa antes de usarse.</span></li>
        <li><span><b>La tarea cuenta.</b> Cada sesión arranca con lo que pasó cuando lo usó en su trabajo real.</span></li></ol>`},
      {id:'N1-01', t:'¿En qué escalón está usted hoy?', tipo:'encuesta', encuesta:'escalon-inicio',
       intro:'Responda cuando el facilitador abra la encuesta: le aparece en pantalla. Es anónima y se ve solo en conjunto.'},
      {id:'N1-02', t:'La escalera: el piso y siete escalones', tipo:'escalera-ref',
       intro:'Todo lo que vamos a ver cabe aquí. Inspirada en los niveles de uso de Juan Gabriel Gomila, traducida al trabajo de su equipo.'}
    ]},
  { id:'n1-c1', t:'Qué es el caballo', min:'30 min',
    donde:'El piso: antes de subir, sepa qué está pisando.',
    nuevo:['<b>Predice, no sabe:</b> escoge la continuación más probable, como el teclado del celular. Lo probable no siempre es lo verdadero.',
           '<b>Lo que no está en la ventana no existe,</b> y más contexto no es mejor contexto: rinde peor mucho antes de llenarse.',
           '<b>Alucinar:</b> inventar con total seguridad.',
           '<b>Sesgos:</b> hereda los de los textos con que aprendió.'],
    habilita:['<b>El chat,</b> y la primera regla: pida fuentes y dele permiso de no saber.'],
    tarjetas:[
      {id:'N1-03', t:'Demo: la siguiente palabra', tipo:'prompt',
       intro:'Córralo dos veces, en dos chats nuevos. ¿Salió igual? Por qué no: escoge lo probable, no lo único.',
       prompt:{mp:'Escribe en una frase por qué una clienta debería comprar por catálogo.', pco:'Escribe en una frase por qué es importante la inducción de un nuevo colaborador.'}},
      {id:'N1-04', t:'Pregúntele por el artículo', tipo:'comparar',
       intro:'Primero como lo haría hoy; después, en un chat nuevo, con permiso de no saber. Compare: ¿inventó contenido, número o fecha en la primera?',
       antes:{mp:'¿Qué dice el artículo 46-B del Estatuto del Consumidor (Ley 1480 de 2011) sobre las ventas por catálogo?', pco:'¿Qué dice el artículo 489-B del Código Sustantivo del Trabajo sobre el trabajo en casa?'},
       despues:{mp:'Responde solo si estás seguro y cita la fuente oficial. Si el artículo no existe o no lo sabes, dilo.\n¿Qué dice el artículo 46-B del Estatuto del Consumidor (Ley 1480 de 2011) sobre las ventas por catálogo?', pco:'Responde solo si estás seguro y cita la fuente oficial. Si el artículo no existe o no lo sabes, dilo.\n¿Qué dice el artículo 489-B del Código Sustantivo del Trabajo sobre el trabajo en casa?'},
       nota:'La pregunta cambia la respuesta: el permiso de no saber es parte del prompt.',
       muro:{tipo:'hallazgo', guia:'En una línea: lo que inventó la IA (o no) cuando le preguntó por el artículo.'}},
      {id:'N1-05', t:'Más contexto no es mejor contexto', tipo:'datasets',
       intro:'La demo del facilitador, para repetirla después: la misma pregunta con el compendio largo y con la circular corta.',
       archivos:{mp:[['demo 01 Compendio de condiciones comerciales de asesoras 2023-2026 (largo).docx','El documento largo'],['demo 02 Circular vigente de ganancia (corto).docx','La circular vigente']],
                 pco:[['demo 01 Compendio de políticas 2022-2026 (largo).docx','El documento largo'],['demo 02 Circular vigente de teletrabajo (corto).docx','La circular vigente']]},
       prompt:{mp:'Con base en el documento adjunto, ¿cuál es hoy el porcentaje de ganancia de una asesora en la categoría Básicos? Cita la sección de donde lo sacas.', pco:'Con base en el documento adjunto, ¿cuántos días de teletrabajo por semana permite hoy la política? Cita la sección de donde lo sacas.'}}
    ]},
  { id:'n1-c2', t:'La baranda: ¿qué datos sí?', min:'20 min',
    donde:'No es un escalón: es la baranda que acompaña toda la escalera.',
    nuevo:['<b>El semáforo:</b> público, interno, sensible.',
           '<b>Habeas Data</b> (Ley 1581 de 2012): el nombre y la imagen de una persona son datos personales.',
           '<b>Anonimizar:</b> códigos, rangos y roles; la tabla de equivalencias se queda en su computador.',
           '<b>La baranda no le impide subir:</b> le impide caerse.'],
    habilita:[{mp:'<b>La cuenta de la empresa</b> (nunca la personal para datos de la empresa) y las tres técnicas de anonimización.', pco:'<b>La cuenta de la empresa</b> (la regla oficial es la de TI) y las tres técnicas de anonimización.'}],
    tarjetas:[
      {id:'N1-06', t:'¿Verde, amarillo o rojo? Ocho casos', tipo:'encuesta', encuesta:'semaforo',
       intro:'Vote los ocho casos por intuición cuando el facilitador abra la votación. Después vemos la regla y discutimos solo donde no hubo acuerdo.'},
      {id:'N1-07', t:'Anonimice en un minuto', tipo:'pasos',
       pasos:[{mp:'<b>Nombres → códigos</b> (A-01, A-02…).', pco:'<b>Nombres → códigos</b> (P-01, P-02…).'},
              '<b>Quite</b> cédulas, celulares y correos.',
              {mp:'<b>Ventas → rangos o promedios</b> por zona; nunca grupos de menos de 5.', pco:'<b>Salarios → rangos o promedios</b>; nunca grupos de menos de 5.'},
              '<b>Pregunta de control:</b> ¿alguien podría saber de quién se trata? Si la respuesta es sí, sigue en rojo.']},
      {id:'N1-08', t:'El semáforo de datos', tipo:'semaforo-ref',
       intro:'La regla, y por qué cada caso tiene su color.'}
    ]},
  { id:'n1-c3', t:'Planear antes de pedir', min:'40 min',
    donde:'Escalón 1: no es pedir más rápido, es tener intención.',
    nuevo:['<b>Anatomía del prompt:</b> tres obligatorias (tarea, contexto, formato) y tres que lo suben de nivel (rol, ejemplos, restricciones). Como un colega brillante que llegó ayer.',
           '<b>El atajo de la entrevista:</b> deje que la IA le pregunte antes de ejecutar.',
           '<b>Planee y revise con un modelo de razonamiento; produzca con uno rápido.</b> El jefe de cocina no pone al chef estrella a pelar papas: lo pone a planear la receta.'],
    habilita:['<b>El prompt de entrevista,</b> la plantilla mínima, la lista de verificación y el selector de modelo.'],
    tarjetas:[
      {id:'N1-09', t:'Paso 1 · Pídalo como lo haría hoy', tipo:'pasos',
       pasos:['Escoja una tarea de su semana (la del formulario o una de la tarjeta N1-13).', 'Pídasela a la IA <b>como lo haría hoy, en una sola frase</b>.', 'Corra el prompt. <b>No borre la respuesta:</b> la vamos a comparar.']},
      {id:'N1-10', t:'Paso 2 · El atajo de la entrevista', tipo:'prompt',
       intro:'En un chat nuevo. Responda las preguntas, copie el prompt final y córralo.',
       prompt:'Quiero que me ayudes a escribir un prompt para [tarea]. Antes de escribirlo, hazme una por una las preguntas que necesites sobre el objetivo, el contexto, el formato y las restricciones. Cuando tengas todo, entrégame el prompt final, listo para copiar, y dime qué parte podría mejorar.'},
      {id:'N1-11', t:'Plantilla mínima', tipo:'prompt',
       intro:'Si prefiere escribirlo directo.',
       prompt:'Actúa como [rol]. [Verbo + tarea]. Contexto: [para quién, para qué, qué datos hay]. Entrégamelo en [formato y extensión]. No [restricción]; si te falta información, pregúntame.'},
      {id:'N1-12', t:'Paso 3 · Compare con la lista', tipo:'checklist',
       intro:'Ponga las dos respuestas lado a lado y pase la lista por su primer prompt. ¿Qué le preguntó la IA que usted no había pensado?',
       checklist:['Empieza con un verbo claro.','Tiene el contexto que un colega nuevo necesitaría.','Dice el formato, la extensión y el tono.','Le da un rol.','Tiene un ejemplo o un criterio de calidad.','Dice qué no hacer: no inventar, preguntar si falta algo.','Está en verde o amarillo.']},
      {id:'N1-13', t:'Ideas de tareas (y cómo arreglar una roja)', tipo:'texto',
       html:{mp:'<p><b>Ideas:</b> textos de producto, brief de una pieza para diseño, resumen de ventas de una campaña para el comité, guion de mensaje para asesoras, preguntas de una encuesta a clientas.</p><p><b>Tarea roja → reformúlela:</b> en vez de «analiza los pedidos de María», pida «una lista de señales para detectar asesoras que bajan su orden promedio».</p><p><b>Ejemplo resuelto:</b> «Hazme el texto de este producto para el catálogo» frente a: «Actúa como redactora de catálogo de una empresa colombiana de venta directa. Escribe el texto de producto para [referencia]… Dame un título de máximo 6 palabras… No inventes materiales ni precios y, si te falta información, pregúntame».</p>',
             pco:'<p><b>Ideas:</b> convocatoria interna, preguntas de entrevista por competencias, resumen de una política, plan de bienestar del mes.</p><p><b>Tarea roja → reformúlela:</b> en vez de «revisa la nómina de Pedro», pida «una lista de validaciones para las novedades de nómina».</p><p><b>Ejemplo resuelto:</b> «Hazme un correo para el reto de bienestar» frente a: «Actúa como analista de comunicaciones internas de una empresa colombiana. Redacta un correo que invite a inscribirse al reto de pausas activas de noviembre… Dame un asunto de máximo 8 palabras… No inventes premios y, si te falta información, pregúntame».</p>'}},
      {id:'N1-14', t:'Qué modelo para qué (opcional)', tipo:'pasos',
       pasos:['Corra su prompt final con el <b>modelo rápido</b> y con el <b>de razonamiento</b>.', 'Compare solo la estructura: ¿cuál planeó mejor?', 'Regla: planee y revise con el de razonamiento; produzca con el rápido.']},
      {id:'N1-15', t:'Paso 4 · Al muro: su par y sus tres prompts', tipo:'muro-card',
       intro:'Publique su par «sin estructura / con la guía» y sus tres prompts. Es la evidencia del nivel.',
       muro:{tipo:'par', guia:'Su prompt de una frase, el prompt final de la entrevista y una línea: lo que le preguntó la IA que usted no había pensado.'},
       muro2:{tipo:'prompt', guia:'Sus tres prompts (el de la entrevista y dos más de su semana, con la plantilla).'}}
    ]},
  { id:'n1-c4', t:'Cierre', min:'8 min',
    donde:'Hoy subimos del piso al escalón 1.',
    nuevo:['<b>El caballo y el arnés:</b> hoy supimos qué es el caballo; en cada nivel le ponemos una pieza del arnés para subir.'],
    habilita:['<b>La tarea</b> y el cuestionario de salida.'],
    tarjetas:[
      {id:'N1-16', t:'Tarea: úselo en trabajo real', tipo:'texto',
       html:'<p>Use uno de sus tres prompts en una <b>tarea real</b> esta semana y anote <b>qué pidió, qué salió y qué tuvo que corregir</b>. Con eso arrancamos el nivel 02.</p>'},
      {id:'N1-17', t:'¿Qué nos llevamos? Cuestionario de salida', tipo:'enlace',
       intro:'Cinco minutos, anónimo.',
       url:{mp:'https://docs.google.com/forms/d/e/1FAIpQLScWOPPwLxiEZy4XrXUEoOuLRsRlMF_AzT6-p-UheOVnYfOi4w/viewform', pco:'https://docs.google.com/forms/d/e/1FAIpQLScxBWzEuw34wVQnCD9TaUgsfQNZQevHTxIMuDm67QsZegGfDQ/viewform'},
       label:'Abrir el cuestionario'}
    ]}
  ]
},
/* ======================= NIVEL 02 ======================= */
{
  id:2, verbo:'Preguntar', escalones:[1,2], asoma:[5,6], borrador:true,
  lede:'De un archivo a un resultado útil, planeado antes de ejecutar y revisado con un loop. Hoy subimos al 2 y miramos el 5 y el 6.',
  capitulos:[
  { id:'n2-c1', t:'La evolución: cuatro etapas que se acumulan', min:'15 min',
    donde:'Estamos en el escalón 1 y hoy pisamos el 2; desde aquí se ven el 5 y el 6.',
    nuevo:['<b>Prompt → contexto → arnés → loop.</b> Ninguna etapa reemplaza a la anterior: para llegar a un loop hace falta un buen prompt, con contexto y con arnés.',
           '<b>El empleado nuevo sin inducción improvisa,</b> y probablemente se equivoca.',
           '<b>El pura sangre:</b> sin arnés, se desboca.'],
    habilita:['<b>El mapa de la evolución</b> sobre la escalera.'],
    tarjetas:[
      {id:'N2-01', t:'Retorno: ¿qué tuvo que corregir?', tipo:'encuesta', encuesta:'retorno-n2',
       intro:'Si hubo tarea entre sesiones, responda cuando se abra la encuesta. Si es la misma tarde, abra en el muro su par del nivel 01: ese prompt es su punto de partida.'},
      {id:'N2-02', t:'La evolución sobre la escalera', tipo:'texto',
       html:'<ol class="steps"><li><span><b>Prompt</b> (pedir bien) = escalón 1.</span></li><li><span><b>Contexto</b> (la inducción) = escalón 2.</span></li><li><span><b>Arnés</b> (límites y reglas) = las reglas del 2 y el 3.</span></li><li><span><b>Loop</b> (hace, comprueba, corrige, para) = escalones 5 y 6.</span></li></ol>'}
    ]},
  { id:'n2-c2', t:'Modo plan', min:'15 min',
    donde:'Escalón 1, ahora en serio: nada se ejecuta hasta que el plan está completo.',
    nuevo:['<b>Modo plan:</b> «no ejecute: pregúnteme hasta que el plan esté completo». La IA pregunta, usted responde.',
           '<b>Cinco piezas</b> que convierten un pedido en un encargo: rol, contexto, ejemplos, pasos y formato. La que más se olvida: pasos.',
           '<b>Respuesta en pirámide</b> y <b>«¿cómo podemos…?»</b>.'],
    habilita:['<b>La plantilla de modo plan</b> y el archivo de su mesa.'],
    tarjetas:[
      {id:'N2-03', t:'El archivo de su mesa', tipo:'datasets',
       intro:'Todos los datos son ficticios. Cada archivo trae una hoja LÉAME.',
       archivos:{
         mp:[['01 Ventas por campaña y referencia - sintético.xlsx','Mercadeo y catálogo · ¿Qué explica la venta y dónde están las devoluciones?'],
             ['02 Pedidos por zona y asesora - sintético.xlsx','Comercial · ¿Cada zona crece por asesoras, actividad u orden promedio?'],
             ['03 Brief creativo campaña Navidad - ficticio.docx','Diseño y contenido · ¿Qué le falta al brief antes de crear?'],
             ['04 Histórico mensual de demanda por categoría - sintético.xlsx','Demanda · ¿Qué esperamos de octubre a diciembre por categoría?'],
             ['05 Comentarios de clientas - sintético.xlsx','Dirección y servicio · ¿Cuáles son los tres problemas que más se repiten?']],
         pco:[['01 Estudio salarial sintético.xlsx','Compensación · ¿Qué cargos están bajo el P25 y con qué rotación?'],
             ['05 Vacante y hojas de vida ficticias.docx','Selección · ¿Quién cumple qué requisito y con qué evidencia?'],
             ['03 Novedades de nómina sintéticas.xlsx','Nómina · ¿Qué novedades incumplen las reglas R1 a R6?'],
             ['04 Participación gamificación sintética.xlsx','Talento y bienestar · ¿Qué áreas y retos necesitan acción?'],
             ['02 Maestro de cargos sintético.xlsx','Plataformas core · ¿Qué tan confiable es el maestro?']]}},
      {id:'N2-04', t:'Paso 1 · Pídalo de una (sin estructura)', tipo:'prompt',
       intro:'Con el archivo de su mesa adjunto. Guarde la respuesta.',
       prompt:{mp:'Hazme las piezas de la campaña con este brief. (Mesa de diseño.) / Dime qué pasó con las ventas. (Las demás mesas.)', pco:'Hazme el informe para el comité con este archivo.'}},
      {id:'N2-05', t:'Paso 2 · Modo plan', tipo:'prompt',
       intro:'En un chat nuevo, con el mismo archivo. ¿Cuántas preguntas hizo? ¿Qué vacío encontró que la primera versión rellenó inventando?',
       prompt:{mp:'Necesito [las piezas de la campaña de Navidad para diseño · o · una lectura de una página para la reunión de mercadeo y comercial] para [quién y para qué]. No ejecutes nada todavía. Hazme, una por una, las preguntas que necesites sobre el objetivo, los datos que tienes y los que te faltan, el formato, las restricciones y cómo sabremos que quedó bien. Cuando tengas todo, escribe el plan en pasos numerados, con lo que necesita cada paso, y espera mi aprobación antes de empezar.',
               pco:'Necesito un informe de una página para el comité del área para [quién y para qué]. No ejecutes nada todavía. Hazme, una por una, las preguntas que necesites sobre el objetivo, los datos que tienes y los que te faltan, el formato, las restricciones y cómo sabremos que quedó bien. Cuando tengas todo, escribe el plan en pasos numerados, con lo que necesita cada paso, y espera mi aprobación antes de empezar.'},
       muro:{tipo:'hallazgo', guia:'Una por mesa: la mejor pregunta que le hizo la IA en modo plan.'}}
    ]},
  { id:'n2-c3', t:'Un archivo real: contexto y verificación', min:'30 min',
    donde:'Escalón 2: darle el manual de la tarea.',
    nuevo:['<b>Contexto justo:</b> el criterio, dos ejemplos y los documentos de esta tarea; no el manual de 200 páginas.',
           '<b>Antes de analizar, que le cuente qué vio.</b>',
           '<b>Verifique:</b> la IA describe bien lo que se le pide describir, y concluye mal sobre lo que no miró.',
           '<b>Semáforo antes de subir:</b> un archivo solo con códigos se vuelve rojo si se cruza con la base de identidades.'],
    habilita:['<b>Subir archivos</b> a la herramienta de la empresa, el prompt de descripción y el de verificación.'],
    tarjetas:[
      {id:'N2-06', t:'Paso 3 · Que le cuente qué vio', tipo:'prompt',
       prompt:'Antes de analizar, describe el archivo: qué hojas o secciones tiene, qué columnas, cuántas filas, el rango de fechas y qué datos faltan, se repiten o se ven raros. No concluyas nada todavía.'},
      {id:'N2-07', t:'Paso 4 · La pregunta de su mesa', tipo:'texto',
       html:'<p>Haga la pregunta de negocio de su mesa (está junto a su archivo en la tarjeta N2-03) y apruebe el plan paso a paso.</p>'},
      {id:'N2-08', t:'Paso 5 · Verifique tres cifras', tipo:'prompt',
       intro:'Compruebe a mano las tres. Después compare con la respuesta «de una» del paso 1: ¿vio los datos raros?',
       prompt:'Dame tres cifras o afirmaciones de tu respuesta y dime exactamente de qué hoja, columnas y filas salen, para que yo las compruebe. Si alguna la estimaste o la supusiste, dilo.',
       muro:{tipo:'prompt', guia:'El prompt que funcionó, con la pregunta de su mesa y una línea con el dato raro que la IA encontró (o no).'}},
      {id:'N2-09', t:'Cinco hábitos de verificación', tipo:'pasos',
       pasos:['Pida que describa antes de concluir.', 'Pida de dónde sale cada cifra.', 'Compruebe dos cifras a mano.', 'Pregunte qué no puede saber con ese archivo.', 'Desconfíe de lo que suena demasiado redondo.']},
      {id:'N2-10', t:'Semáforo antes de subir un archivo', tipo:'texto',
       html:{mp:'<p>Antes de subir, mírele el color. Datos de asesoras o clientas identificables, costos y márgenes: <b>rojo</b>. Agregados por zona de 5 o más asesoras, en la cuenta de la empresa: <b>amarillo</b>.</p>', pco:'<p>Antes de subir, mírele el color. Nombres con salarios, cédulas, evaluaciones u hojas de vida: <b>rojo</b>. Agregados de 5 o más personas, en la herramienta corporativa: <b>amarillo</b>.</p>'}}
    ]},
  { id:'n2-c4', t:'El loop con juez', min:'35 min',
    donde:'Desde el escalón 2 se ven el 5 (por fases) y el 6 (uno hace, otro revisa). Hoy los probamos dentro del chat.',
    nuevo:['<b>Fusión a mano:</b> si le pregunta a uno solo, no está validando su idea; está buscando que le digan que sí.',
           '<b>El loop:</b> no es un prompt más largo, es un ciclo con juez y con salida (objetivo, contexto, acciones, criterios, qué hacer si no cumple, memoria, parada).',
           '<b>Para un loop no hace falta un agente:</b> basta el chat con dos roles y una condición de parada.',
           '<b>Revisor exigente frente a complaciente:</b> el criterio lo pone usted.'],
    habilita:['<b>Dos chats o dos herramientas en paralelo</b> y la plantilla de dos roles.'],
    tarjetas:[
      {id:'N2-11', t:'Fusión a mano: la misma pregunta a dos', tipo:'pasos',
       pasos:[{mp:'Haga la pregunta de su mesa, con el mismo archivo, en <b>ChatGPT y en Claude</b>.', pco:'Haga la pregunta de su mesa, con el mismo archivo, en <b>dos chats nuevos</b>: uno con el modelo rápido y otro con el de razonamiento.'},
              '¿En qué difieren? ¿Qué decide usted?', 'Las diferencias señalan dónde hay que verificar.']},
      {id:'N2-12', t:'Práctica 2, paso 1 · «Revisa y mejora»', tipo:'prompt',
       intro:'En el chat de la práctica 1. Lea qué cambió.',
       prompt:'Revisa tu respuesta y mejórala.'},
      {id:'N2-13', t:'Práctica 2, paso 2 · El loop con dos roles', tipo:'prompt',
       intro:'Use los criterios de su mesa (tarjeta N2-14). Al final lea la tabla de vueltas: ¿el revisor fue exigente o complaciente?',
       prompt:'OBJETIVO: [qué entregar y para quién]. CONTEXTO: [archivo adjunto + reglas o datos clave].\nTrabaja en dos roles. REDACTOR: produce la versión. REVISOR: evalúala contra estos CRITERIOS: [1] [2] [3]; por cada uno di «cumple» o «no cumple» y por qué.\nSI NO CUMPLE: el redactor corrige solo lo señalado y el revisor vuelve a evaluar.\nMEMORIA: lleva una tabla de vueltas con lo que se corrigió.\nPARADA: entrega cuando cumpla todos los criterios o tras 3 vueltas; si no lo logra, dime qué falta y qué necesitas de mí. Muéstrame solo la versión final y la tabla de vueltas.',
       muro:{tipo:'loop', guia:'Su loop completo con los criterios de su mesa y un resumen de la tabla de vueltas: cuántas vueltas y qué corrigió el revisor.'}},
      {id:'N2-14', t:'Criterios del revisor por mesa', tipo:'texto',
       html:{mp:'<ul class="checks"><li><b>Demanda:</b> supuestos explícitos y retroprueba contra 2024.</li><li><b>Diseño:</b> ninguna restricción del brief violada; sin precios inventados.</li><li><b>Mercadeo:</b> devoluciones por referencia con porcentaje y campaña de quiebre.</li><li><b>Comercial:</b> actividad, orden promedio y número de asesoras por separado; sin nombres.</li><li><b>Servicio:</b> tres problemas con conteo y dos citas textuales cada uno.</li></ul>',
             pco:'<ul class="checks"><li><b>Nómina:</b> cada novedad marcada cita la regla R1–R6 que incumple.</li><li><b>Selección:</b> cada requisito tiene evidencia textual de la hoja de vida; no se menciona edad, género ni foto.</li><li><b>Compensación:</b> toda cifra tiene hoja y fila; ninguna persona identificable.</li><li><b>Talento:</b> conclusión primero, máximo una página.</li><li><b>Plataformas core:</b> cada inconsistencia dice fila y columna.</li></ul>'}},
      {id:'N2-15', t:'Plantillas de loop A y B', tipo:'pendiente', intro:'Las plantillas probadas de Juan Gonzalo (A: análisis con auditor de cifras · B: documento contra criterios). Por nutrir.'}
    ]},
  { id:'n2-c5', t:'Cierre', min:'15 min',
    donde:'Hoy subimos al 2 y miramos el 5 y el 6 desde ahí.',
    nuevo:['<b>Las 4D</b> (delegación, descripción, discernimiento, diligencia) <b>y una quinta: dirigir.</b>'],
    habilita:['<b>La tarea,</b> la evidencia en el muro y la pregunta de salida.'],
    tarjetas:[
      {id:'N2-16', t:'Las 4D + Dirigir', tipo:'pendiente', intro:'Con un ejemplo de cada D tomado del muro de hoy. La definición de «Dirigir» la trae Juan Gonzalo.'},
      {id:'N2-18', t:'Tarea: el loop con un archivo real', tipo:'texto',
       html:{mp:'<p>Corra el loop con un archivo real de su área, en la cuenta de la empresa (verde o amarillo), y anote qué corrigió el revisor. <b>Traiga una tarea que se repite cada semana.</b></p>',
             pco:'<p>Corra el loop con un archivo real del proceso, en ChatGPT Enterprise (verde o amarillo). <b>Traiga el perfil de su cargo al nivel 03.</b></p>'}},
      {id:'N2-19', t:'Salida: ¿qué fue lo más útil y qué sobró?', tipo:'encuesta', encuesta:'salida-n2',
       intro:'Responda cuando se abra la encuesta.'}
    ]}
  ]
},
{id:3, verbo:'Construir', escalones:[2,3,4], asoma:[6], lede:'Del chat a su asistente propio: reglas del proyecto, conocimiento y especialistas.', pronto:'Aquí encontrará la plantilla de reglas del proyecto, la ficha de su asistente, los casos de prueba y qué conectores existen.'},
{id:4, verbo:'Automatizar', escalones:[5,6,7], lede:'Procesos por fases, equipos de especialistas y lo que viene.', pronto:'Aquí encontrará la prueba de aceptación, la demostración, la plataforma de ideación y su siguiente escalón.'}
];

/* Casos del semáforo (encuesta «semaforo») y su respuesta */
window.SEMAFORO = {
  mp:[['Pedirle a la IA 10 ideas de nombre para la colección de la próxima campaña.','v','Genérico y creativo. Si se pega el brief completo, pasa a amarillo.'],
      ['Subir el Excel de pedidos, con nombre y celular de cada asesora, para ver quién bajó su orden promedio.','r','Datos personales y desempeño. Alternativa: códigos y rangos.'],
      ['Resumir en la cuenta de empresa el brief de una campaña que aún no sale.','a','Interno, sin personas, en la cuenta correcta. En una cuenta personal sería rojo.'],
      ['Pegar en una cuenta personal gratuita la base de clientas con teléfonos para segmentarla.','r','Datos de terceros en una cuenta personal. Doble falta.'],
      ['Analizar las ventas agregadas por zona y referencia, sin nombres de asesoras.','a','Agregado e interno. Si una zona tiene una sola asesora, es identificable: rojo.'],
      ['Preguntarle qué exige la ley colombiana para hacer una promoción con sorteo.','v','Pública. Terreno fértil para alucinaciones: verificar en la norma.'],
      ['Conectar un asistente a la base de pedidos para que les responda a las asesoras su cartera.','r','Integración con un sistema y datos financieros: se decide con quien administra el sistema.'],
      ['Generar con IA una imagen para el catálogo a partir de la foto de una asesora real.','d','Debate: con autorización escrita y en la cuenta de empresa, amarillo; sin ella, rojo.']],
  pco:[['Pedirle a la IA 10 ideas para celebrar el mes de la familia.','v','Genérico, sin datos de personas.'],
      ['Subir a la IA el Excel de nómina de octubre, con nombres y salarios, para encontrar errores.','r','Datos personales y salariales. Alternativa: anonimizar o un asistente aprobado por TI.'],
      ['Resumir en la herramienta corporativa la política interna de trabajo en casa.','a','Documento interno, sin personas, en la herramienta correcta.'],
      ['Pegar en ChatGPT personal la hoja de vida de un candidato, con su cédula y su teléfono.','r','Dato personal de un tercero en una cuenta personal. Doble falta.'],
      ['Analizar los resultados de clima agregados por área, con grupos de más de 5 personas.','a','Agregado e interno. Con menos de 5, identificable: rojo.'],
      ['Preguntarle cómo se calculan las horas extra según la ley colombiana.','v','Pública. Terreno fértil para alucinaciones: verificar con la norma.'],
      ['Conectar un asistente al sistema de gestión de personal para que responda saldos de vacaciones.','r','Integración con un sistema: pasa por TI.'],
      ['Redactar el correo de bienvenida de un colaborador nuevo usando solo su nombre de pila.','d','Debate: casi no identifica; con cargo, fecha y área, sí. El color depende de la combinación.']]
};

/* Encuestas que lanza el facilitador */
window.ENCUESTAS = [
  { id:'escalon-inicio', titulo:'¿En qué escalón está usted hoy?', tipo:'escalon' },
  { id:'semaforo', titulo:'¿Verde, amarillo o rojo?', tipo:'semaforo' },
  { id:'retorno-n2', titulo:'Cuando lo usó en su trabajo, ¿qué tuvo que corregir?', tipo:'multiple', opciones:['El contexto','El formato','Datos inventados','El tono','Nada: salió bien'] },
  { id:'salida-n2', titulo:'Nivel 02 · ¿Qué fue lo más útil y qué sobró?', tipo:'abierta' },
  { id:'escalon-final', titulo:'Al cerrar el programa: ¿en qué escalón está ahora?', tipo:'escalon' }
];

/* Índices */
window.CAPITULOS = window.NIVELES.flatMap(N => (N.capitulos || []).map(c => Object.assign({ nivel: N.id }, c)));
window.TARJETAS = window.CAPITULOS.flatMap(c => c.tarjetas.map(t => Object.assign({ nivel: c.nivel, capitulo: c.id }, t)));
