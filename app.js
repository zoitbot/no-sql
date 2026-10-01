(() => {
  'use strict';

  const TOKENS_DIARIOS = 10000;
  const CLAVE = 'dba-request:v1';
  const MINUTO = 60 * 1000;

  // Pedidos frecuentes. `patron` se usa para reconocer el mismo pedido en texto libre.
  const PEDIDOS = [
    {
      id: 'sp',
      emoji: '📜',
      etiqueta: 'Crear un stored procedure',
      texto: 'Necesito que me crees un stored procedure nuevo.',
      costo: 1500,
      patron: /stored?\s*proc|procedimiento|\bsp(_|\b)/i,
      respuestas: [
        '¿Otro stored procedure? Ya hay 4.812 y nadie sabe qué hace ninguno.',
        'Mandame el script. Con comentarios. Y sin cursores. Ah, ¿tiene cursores? NO.',
        'Ya existe sp_nuevo_final_v2_ahora_si. Usá ese.',
        '¿Y quién lo va a mantener? Porque yo no. Bueno, sí, yo. Por eso NO.',
        '¿Lo probaste con más de diez filas? No me contestes, ya sé que no.',
      ],
    },
    {
      id: 'base',
      emoji: '🆕',
      etiqueta: 'Crear una base nueva',
      texto: 'Arrancamos un proyecto nuevo y necesitamos una base nueva.',
      costo: 4000,
      patron: /base\s+(de\s+datos\s+)?nueva|nueva\s+base|crear\s+(una\s+)?base|database|proyecto\s+nuevo|nuevo\s+proyecto/i,
      respuestas: [
        '¿Una base nueva? ¿Y el espacio en disco de dónde lo saco, de mi casa?',
        'Usá un esquema en la base que ya tenés y no me hagas renegar.',
        'Cada proyecto nuevo quiere su base. Después el proyecto muere y la base me queda a mí.',
        '¿Proyecto nuevo? Dura dos meses. NO.',
        '¿Ya definieron el modelo de datos? "Lo vamos viendo" no es un modelo de datos.',
        'Llená el formulario de alta de bases. Son 14 páginas. Lo quiero impreso.',
      ],
    },
    {
      id: 'indice',
      emoji: '🔎',
      etiqueta: 'Agregar un índice',
      texto: '¿Me agregás un índice en una tabla?',
      costo: 800,
      patron: /[íi]ndice/i,
      respuestas: [
        'Ya tenés 14 índices en esa tabla. ¿Querés uno por columna?',
        'El problema no es el índice, es tu consulta.',
        'Mandame el plan de ejecución y después hablamos.',
      ],
    },
    {
      id: 'prod',
      emoji: '🔑',
      etiqueta: 'Acceso a producción',
      texto: 'Necesito acceso de escritura a producción, es un ratito nomás.',
      costo: 6000,
      patron: /\bprod(ucci[oó]n)?\b/i,
      respuestas: [
        'Jajajaja. No.',
        'Acceso a producción tiene el DBA. Vos sos dev. Fin.',
        '"Un ratito nomás" dijeron la última vez. Estuvimos caídos seis horas.',
        '¿Para qué? No, mejor no me cuentes.',
      ],
    },
    {
      id: 'restore',
      emoji: '⏪',
      etiqueta: 'Restaurar el backup de ayer',
      texto: '¿Podés restaurar el backup de ayer?',
      costo: 3500,
      patron: /restaur|restore|backup|respaldo/i,
      respuestas: [
        '¿Restaurar? ¿Qué rompiste?',
        'El backup está. Que funcione es otro tema.',
        '¿Hiciste un DELETE sin WHERE? Decime la verdad.',
      ],
    },
    {
      id: 'alter',
      emoji: '🔥',
      etiqueta: 'ALTER TABLE un viernes',
      texto: 'Necesito correr un ALTER TABLE en producción hoy, que es viernes.',
      costo: 5000,
      patron: /\balter\b|viernes/i,
      respuestas: [
        '¿Un viernes? ¿Vos me querés arruinar el fin de semana?',
        'No hay ventana de mantenimiento hasta marzo.',
        'Los viernes no se toca nada. Los lunes tampoco. Los demás días, consultar.',
      ],
    },
    {
      id: 'select',
      emoji: '👀',
      etiqueta: 'Una consulta rapidita',
      texto: '¿Me corrés un SELECT rapidito?',
      costo: 300,
      patron: /select|consulta|query/i,
      respuestas: [
        '¿SELECT * sin WHERE? Bloqueado.',
        '"Rapidito" son 80 millones de filas sin índice.',
        'Corrélo vos en desarrollo. Ah, ¿en desarrollo no hay datos? Qué pena.',
      ],
    },
    {
      id: 'usuario',
      emoji: '👤',
      etiqueta: 'Usuario con permisos',
      texto: 'Necesito un usuario nuevo con permisos sobre la base.',
      costo: 1200,
      patron: /usuario|permiso/i,
      respuestas: [
        'Usá el usuario que ya tenés. Ah, ¿no tenés? Mejor.',
        '¿Permisos de qué? ¿De todo? NO.',
        'Te doy solo lectura. Sobre una tabla. Vacía.',
      ],
    },
    {
      id: 'lenta',
      emoji: '🐌',
      etiqueta: '"La base está lenta"',
      texto: 'La base está lenta, ¿pueden mirar?',
      costo: 2000,
      patron: /lent[ao]|tarda|performance|rendimiento/i,
      respuestas: [
        'La base no está lenta. Tu código es lento.',
        'La base anda perfecto. Lo que anda mal es todo lo que le mandan.',
        'Estás haciendo 3.000 consultas adentro de un bucle. No es la base.',
      ],
    },
  ];

  const RESPUESTAS_NO = ['NO.', 'NO.', 'NO.', 'No.', 'no', 'NO. Siguiente.', 'Ni ahí.', 'No, y no insistas.'];

  // GIFs de GIPHY con los que el DBA contesta en lugar de escribir. `id` es el del GIF en giphy.com.
  const GIFS_NO = [
    { id: 'fXnRObM8Q0RkOmR5nf', descripcion: 'Bugs Bunny diciendo "NO"' },
    { id: 'VzkTZ1DFYeBY5ZId6j', descripcion: 'Bugs Bunny, de perfil, diciendo "NO"' },
    { id: 'nR4L10XlJcSeQ', descripcion: 'Un gato negando con la cabeza' },
    { id: '8vUEXZA2me7vnuUvrs', descripcion: 'Michael Scott gritando "NO!"' },
    { id: 'vyTnNTrs3wqQ0UIvwE', descripcion: 'Michael Scott repitiendo "NO! NO!"' },
    { id: 'vPN3zK9dNL236', descripcion: 'Grumpy Cat diciendo "NOPE."' },
    { id: 'gnE4FFhtFoLKM', descripcion: 'Un minion diciendo "EHH... NO"' },
  ];
  const PROBABILIDAD_GIF = 0.4;

  const RESPUESTAS_GENERICAS = [
    '¿Y el ticket? Sin ticket no existís.',
    '¿Lo probaste en desarrollo aunque sea? No me contestes, ya sé que no.',
    '¿Otra vez vos? Ya me pediste demasiadas cosas hoy.',
    'Estoy con un incidente. Volvé el mes que viene.',
    'Eso se pide con 15 días hábiles de anticipación.',
    '¿Quién te aprobó eso? Porque yo no.',
    'Hacé el pedido por el formulario. El formulario lo estoy rediseñando.',
    'Eso no es un problema de la base. Nunca es un problema de la base.',
    'En mi época eso se resolvía sin pedirle nada a nadie.',
  ];

  const RESPUESTAS_URGENTE = [
    'Todo es urgente. Entonces nada es urgente. NO.',
    'Tu falta de planificación no es mi urgencia.',
    '"Urgente" me dijeron ayer por algo que sigue sin usarse.',
  ];

  const RESPUESTAS_APROBADO = [
    'Bueno, dale. Pero es la última vez.',
    'Está bien. Pero si se rompe, yo no fui.',
    'Lo hago el lunes. No aclaro qué lunes.',
    'Ya está. No me agradezcas. En serio, no me hables.',
  ];

  const RESPUESTA_ALMUERZO = '[El DBA se fue a almorzar. Los tokens se cobraron igual.]';

  const ESCRIBIENDO = [
    'El DBA está renegando',
    'El DBA está suspirando',
    'El DBA está leyendo tu pedido con desprecio',
    'El DBA está buscando una excusa',
  ];

  const SELLOS = {
    rechazado: 'Rechazado',
    renegado: 'Renegado',
    aprobado: 'Aprobado de mala gana',
  };

  const RECARGAS = [
    {
      id: 'facturas',
      emoji: '🥐',
      etiqueta: 'Llevarle facturas al DBA',
      detalle: '+2.000 tokens',
      maximo: 1,
      agotado: 'Ya le llevaste facturas hoy. No se compra tan fácil.',
      aplicar: () => ({ tokens: 2000, paciencia: 30, mensaje: 'Aceptó las facturas sin decir gracias. +2.000 tokens.' }),
    },
    {
      id: 'mates',
      emoji: '🧉',
      etiqueta: 'Cebarle unos mates',
      detalle: '+800 tokens',
      maximo: 2,
      agotado: 'Ya tomó demasiado mate. Ahora está acelerado y enojado.',
      aplicar: () => ({ tokens: 800, paciencia: 15, mensaje: '"Está lavado", dijo. Pero te dio +800 tokens.' }),
    },
    {
      id: 'director',
      emoji: '👔',
      etiqueta: 'Decir que es para el director',
      detalle: 'A todo o nada',
      maximo: 1,
      agotado: 'Esa ya la usaste. El director sigue sin saber quién sos.',
      aplicar: () => (Math.random() < 0.5
        ? { tokens: 3000, paciencia: 0, mensaje: 'Se la creyó. +3.000 tokens. No lo repitas.' }
        : { tokens: 0, paciencia: -25, mensaje: 'Le preguntó al director. No sabe quién sos. El DBA perdió más paciencia.' }),
    },
    {
      id: 'corporativo',
      emoji: '💳',
      etiqueta: 'Pasarte al plan Corporativo',
      detalle: 'tokens ilimitados',
      maximo: Infinity,
      aplicar: () => ({
        tokens: 0,
        paciencia: 0,
        mensaje: elegir([
          'Compras dice que el presupuesto se aprueba en 2028.',
          'Tu pedido de cambio de plan fue derivado al DBA. Respondió: NO.',
          'Error 402: el plan Corporativo requiere la aprobación de alguien que te quiera.',
        ]),
      }),
    },
  ];

  const $ = (id) => document.getElementById(id);
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const limitar = (n, min, max) => Math.min(max, Math.max(min, n));
  const dosDigitos = (n) => String(n).padStart(2, '0');
  const numero = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  function hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
  }

  // ---------- Estado ----------

  function estadoInicial() {
    return {
      dia: hoy(),
      tokens: TOKENS_DIARIOS,
      paciencia: 100,
      pacienciaTs: Date.now(),
      secuencia: 0,
      tickets: [],
      recargas: {},
    };
  }

  function cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado && guardado.dia && Array.isArray(guardado.tickets)) {
        return { ...estadoInicial(), ...guardado };
      }
    } catch {
      // Sin almacenamiento (o datos rotos): se arranca de cero.
    }
    return estadoInicial();
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      // La aplicación funciona igual sin persistencia.
    }
  }

  function reiniciar({ conservarSecuencia }) {
    const secuencia = conservarSecuencia ? estado.secuencia : 0;
    estado = estadoInicial();
    estado.secuencia = secuencia;
    guardar();
  }

  let estado = cargar();
  let pendiente = false;

  // ---------- Reglas del juego ----------

  function animo(paciencia) {
    if (paciencia >= 70) return { nivel: 'alto', emoji: '🧉', estado: 'Tranquilo, tomando mate', recargo: 1 };
    if (paciencia >= 40) return { nivel: 'medio', emoji: '😒', estado: 'Renegando', recargo: 1.25 };
    if (paciencia >= 15) return { nivel: 'bajo', emoji: '😤', estado: 'Muy caliente', recargo: 1.5 };
    return { nivel: 'bajo', emoji: '🤬', estado: 'A punto de irse a almorzar', recargo: 2 };
  }

  function reconocer(texto) {
    return PEDIDOS.find((p) => p.patron.test(texto)) || null;
  }

  function calcularCosto(texto, pedido, urgente) {
    const base = pedido ? pedido.costo : limitar(500 + texto.length * 10, 500, 3000);
    const variacion = 0.9 + Math.random() * 0.2;
    const total = base * animo(estado.paciencia).recargo * (urgente ? 1.5 : 1) * variacion;
    return Math.max(50, Math.round(total / 10) * 10);
  }

  function responder(pedido, urgente) {
    const paciencia = estado.paciencia;
    const azar = Math.random();
    const probAprobado = paciencia > 40 ? 0.1 : 0.03;
    const probNo = 0.35 + ((100 - paciencia) / 100) * 0.35;

    if (azar < probAprobado) {
      return { estado: 'aprobado', respuesta: elegir(RESPUESTAS_APROBADO) };
    }
    if (azar < probAprobado + probNo) {
      const almuerzo = paciencia < 15 && Math.random() < 0.35;
      if (almuerzo) return { estado: 'rechazado', respuesta: RESPUESTA_ALMUERZO };
      if (Math.random() < PROBABILIDAD_GIF) return { estado: 'rechazado', respuesta: 'NO.', gif: elegir(GIFS_NO).id };
      return { estado: 'rechazado', respuesta: elegir(RESPUESTAS_NO) };
    }
    if (urgente && Math.random() < 0.6) {
      return { estado: 'renegado', respuesta: elegir(RESPUESTAS_URGENTE) };
    }
    const propias = pedido && Math.random() < 0.75;
    return { estado: 'renegado', respuesta: elegir(propias ? pedido.respuestas : RESPUESTAS_GENERICAS) };
  }

  function enviar(textoCrudo, pedidoElegido) {
    const texto = textoCrudo.trim();
    if (!texto || pendiente || estado.tokens <= 0) return;
    chequearDia();

    pendiente = true;
    pintarControles();
    agregarMensaje({ autor: 'dev', texto });
    const indicador = agregarEscribiendo();

    setTimeout(() => {
      indicador.remove();

      const pedido = pedidoElegido || reconocer(texto);
      const urgente = /urgent|ya mismo|para ayer/i.test(texto);
      const costo = calcularCosto(texto, pedido, urgente);
      const cortado = costo > estado.tokens;
      const cobrado = Math.min(costo, estado.tokens);
      let { estado: resultado, respuesta, gif } = responder(pedido, urgente);
      // Sin tokens no alcanza para un GIF: queda el "NO." de texto.
      if (cortado) gif = undefined;
      if (cortado && respuesta.length > 6) {
        respuesta = `${respuesta.slice(0, Math.ceil(respuesta.length / 2)).trimEnd()}—`;
      }

      estado.tokens -= cobrado;
      estado.paciencia = limitar(estado.paciencia - Math.round(4 + costo / 400), 0, 100);
      estado.pacienciaTs = Date.now();
      estado.secuencia += 1;

      const ahora = new Date();
      const ticket = {
        id: `DBA-${String(estado.secuencia).padStart(4, '0')}`,
        hora: `${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`,
        texto,
        respuesta,
        gif,
        estado: resultado,
        costo: cobrado,
        entrada: Math.min(cobrado, Math.ceil(texto.split(/\s+/).length * 1.3)),
        cortado,
      };
      estado.tickets.push(ticket);
      guardar();

      pendiente = false;
      agregarRespuesta(ticket);
      pintar();
      if (estado.tokens <= 0) {
        setTimeout(abrirDialogo, 900);
      } else if (!pedidoElegido) {
        $('texto').focus();
      }
    }, 900 + Math.random() * 900);
  }

  function aplicarRecarga(recarga) {
    const usos = estado.recargas[recarga.id] || 0;
    if (usos >= recarga.maximo) {
      $('recarga-resultado').textContent = recarga.agotado;
      return;
    }
    const efecto = recarga.aplicar();
    estado.recargas[recarga.id] = usos + 1;
    estado.tokens += efecto.tokens;
    estado.paciencia = limitar(estado.paciencia + efecto.paciencia, 0, 100);
    estado.pacienciaTs = Date.now();
    guardar();
    pintar();
    pintarDialogo();
    $('recarga-resultado').textContent = efecto.mensaje;
  }

  // El DBA recupera un punto de paciencia por minuto sin pedidos.
  function recuperarPaciencia() {
    const minutos = Math.floor((Date.now() - estado.pacienciaTs) / MINUTO);
    if (minutos < 1) return false;
    estado.pacienciaTs += minutos * MINUTO;
    if (estado.paciencia >= 100) return false;
    estado.paciencia = limitar(estado.paciencia + minutos, 0, 100);
    guardar();
    return true;
  }

  function chequearDia() {
    if (estado.dia === hoy()) return false;
    reiniciar({ conservarSecuencia: true });
    pintarTodo();
    return true;
  }

  // ---------- Interfaz ----------

  function crear(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function bajarChat() {
    const mensajes = $('mensajes');
    mensajes.scrollTop = mensajes.scrollHeight;
  }

  function ponerTexto(burbuja, texto, autor) {
    burbuja.className = 'burbuja';
    burbuja.textContent = texto;
    if (autor === 'dba' && texto.length <= 14 && /^no\b/i.test(texto)) burbuja.classList.add('no-seco');
  }

  // Si el GIF no carga (sin conexión, GIPHY bloqueado), queda la respuesta de texto.
  function ponerGif(burbuja, gif, texto) {
    const imagen = crear('img');
    imagen.alt = gif.descripcion;
    imagen.addEventListener('load', bajarChat);
    imagen.addEventListener('error', () => ponerTexto(burbuja, texto, 'dba'));
    imagen.src = `https://media.giphy.com/media/${gif.id}/200.gif`;
    burbuja.className = 'burbuja burbuja-gif';
    burbuja.replaceChildren(imagen);
  }

  function agregarMensaje({ autor, texto, meta, sello, gif }) {
    const mensaje = crear('div', `mensaje mensaje-${autor}`);
    if (autor === 'dba') mensaje.append(crear('span', 'avatar', '🧔'));
    const cuerpo = crear('div', 'cuerpo');
    const burbuja = crear('div');
    const gifConocido = gif && GIFS_NO.find((g) => g.id === gif);
    if (gifConocido) ponerGif(burbuja, gifConocido, texto);
    else ponerTexto(burbuja, texto, autor);
    cuerpo.append(burbuja);
    if (meta || sello) {
      const linea = crear('div', 'meta');
      if (sello) linea.append(crear('span', `sello sello-${sello}`, SELLOS[sello]));
      if (meta) linea.append(crear('span', '', meta));
      cuerpo.append(linea);
    }
    mensaje.append(cuerpo);
    $('mensajes').append(mensaje);
    bajarChat();
    return mensaje;
  }

  function agregarEscribiendo() {
    const mensaje = crear('div', 'mensaje mensaje-dba escribiendo');
    mensaje.append(crear('span', 'avatar', '🧔'));
    const burbuja = crear('div', 'burbuja', elegir(ESCRIBIENDO));
    const puntos = crear('span', 'puntos');
    puntos.append(crear('span', '', '.'), crear('span', '', '.'), crear('span', '', '.'));
    burbuja.append(puntos);
    mensaje.append(burbuja);
    $('mensajes').append(mensaje);
    bajarChat();
    return mensaje;
  }

  function agregarRespuesta(ticket) {
    let meta = `−${numero(ticket.costo)} tokens (entrada ${numero(ticket.entrada)} · renegada ${numero(ticket.costo - ticket.entrada)})`;
    if (ticket.cortado) meta += ' · respuesta cortada: sin tokens';
    agregarMensaje({ autor: 'dba', texto: ticket.respuesta, meta, sello: ticket.estado, gif: ticket.gif });
  }

  function pintarChat() {
    $('mensajes').replaceChildren();
    agregarMensaje({ autor: 'dba', texto: 'Hola. Antes de que pidas nada: NO.\nAhora sí, ¿qué querés?' });
    for (const ticket of estado.tickets) {
      agregarMensaje({ autor: 'dev', texto: ticket.texto });
      agregarRespuesta(ticket);
    }
  }

  function pintarRapidos() {
    const contenedor = $('rapidos');
    contenedor.replaceChildren();
    for (const pedido of PEDIDOS) {
      const boton = crear('button', 'rapido');
      boton.type = 'button';
      boton.append(crear('span', '', `${pedido.emoji} ${pedido.etiqueta}`), crear('small', '', `~${numero(pedido.costo)}`));
      boton.addEventListener('click', () => enviar(pedido.texto, pedido));
      contenedor.append(boton);
    }
  }

  function pintarControles() {
    const sinTokens = estado.tokens <= 0;
    const bloqueado = sinTokens || pendiente;
    const texto = $('texto');
    texto.disabled = bloqueado;
    texto.placeholder = sinTokens ? 'Sin tokens. Volvé mañana o sobornalo.' : 'Escribí tu pedido al DBA…';
    $('enviar').disabled = bloqueado;
    for (const boton of $('rapidos').children) boton.disabled = bloqueado;
  }

  function pintarSaldo() {
    const porcentaje = limitar((estado.tokens / TOKENS_DIARIOS) * 100, 0, 100);
    $('tokens-valor').textContent = numero(estado.tokens);
    $('tokens-total').textContent = numero(TOKENS_DIARIOS);
    $('tokens-relleno').style.width = `${porcentaje}%`;
    $('tokens-medidor').setAttribute('aria-valuenow', String(estado.tokens));
    $('saldo').dataset.nivel = porcentaje > 50 ? 'alto' : porcentaje > 20 ? 'medio' : 'bajo';
  }

  function pintarAnimo() {
    const a = animo(estado.paciencia);
    $('animo-emoji').textContent = a.emoji;
    $('animo-estado').textContent = a.estado;
    $('animo-recargo').textContent = a.recargo === 1
      ? 'Sin recargo'
      : `Recargo por renegar: ×${String(a.recargo).replace('.', ',')}`;
    $('paciencia-relleno').style.width = `${estado.paciencia}%`;
    $('paciencia-medidor').setAttribute('aria-valuenow', String(estado.paciencia));
    $('paciencia-medidor').dataset.nivel = a.nivel;
  }

  function resumen() {
    const tickets = estado.tickets;
    const contar = (e) => tickets.filter((t) => t.estado === e).length;
    return {
      pedidos: tickets.length,
      gastados: tickets.reduce((suma, t) => suma + t.costo, 0),
      rechazados: contar('rechazado'),
      renegados: contar('renegado'),
      aprobados: contar('aprobado'),
    };
  }

  function pintarCifras() {
    const r = resumen();
    $('cifra-pedidos').textContent = numero(r.pedidos);
    $('cifra-gastados').textContent = numero(r.gastados);
    $('cifra-no').textContent = numero(r.rechazados);
  }

  function pintarHistorial() {
    const lista = $('historial');
    lista.replaceChildren();
    for (const ticket of [...estado.tickets].reverse()) {
      const item = crear('li', `ticket ticket-${ticket.estado}`);
      const cabecera = crear('div', 'ticket-cabecera');
      cabecera.append(crear('span', '', `#${ticket.id}`), crear('span', '', ticket.hora));
      const pie = crear('div', 'ticket-pie');
      pie.append(
        crear('span', `sello sello-${ticket.estado}`, SELLOS[ticket.estado]),
        crear('span', '', `−${numero(ticket.costo)} tokens`),
      );
      item.append(cabecera, crear('div', 'ticket-texto', ticket.texto), pie);
      lista.append(item);
    }
    $('historial-vacio').hidden = estado.tickets.length > 0;
  }

  function pintarCuenta() {
    const ahora = new Date();
    const medianoche = new Date(ahora);
    medianoche.setHours(24, 0, 0, 0);
    const segundos = Math.max(0, Math.floor((medianoche - ahora) / 1000));
    const texto = [Math.floor(segundos / 3600), Math.floor((segundos % 3600) / 60), segundos % 60]
      .map(dosDigitos)
      .join(':');
    $('cuenta-regresiva').textContent = texto;
    $('dialogo-cuenta').textContent = texto;
  }

  function pintar() {
    pintarSaldo();
    pintarAnimo();
    pintarCifras();
    pintarHistorial();
    pintarControles();
  }

  function pintarTodo() {
    pintarChat();
    pintar();
    pintarCuenta();
  }

  // ---------- Diálogo de recargas ----------

  function pintarDialogo() {
    const agotado = estado.tokens <= 0;
    $('dialogo').classList.toggle('agotado', agotado);
    $('dialogo-titulo').textContent = agotado ? 'Te quedaste sin tokens 💀' : 'Conseguir tokens';
    $('dialogo-texto').textContent = agotado
      ? 'Pediste demasiado. El DBA ya no te lee, no te contesta y, si puede, no te saluda. Esperá la recarga de mañana o probá ablandarlo.'
      : `Te quedan ${numero(estado.tokens)} tokens. Si querés más, hay formas… no todas funcionan.`;

    const contenedor = $('recargas');
    contenedor.replaceChildren();
    for (const recarga of RECARGAS) {
      const boton = crear('button', 'recarga');
      boton.type = 'button';
      const restantes = recarga.maximo - (estado.recargas[recarga.id] || 0);
      const detalle = Number.isFinite(restantes) && restantes <= 0 ? 'agotado por hoy' : recarga.detalle;
      boton.append(crear('span', '', `${recarga.emoji} ${recarga.etiqueta}`), crear('small', '', detalle));
      boton.addEventListener('click', () => aplicarRecarga(recarga));
      contenedor.append(boton);
    }
  }

  function abrirDialogo() {
    const dialogo = $('dialogo');
    $('recarga-resultado').textContent = '';
    pintarDialogo();
    if (!dialogo.open) dialogo.showModal();
  }

  // ---------- Compartir ----------

  let temporizadorAviso;
  function avisar(texto) {
    const aviso = $('aviso-flotante');
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 3000);
  }

  function textoParaCompartir() {
    const r = resumen();
    return [
      '🗄️ NO-SQL — Mi día con el DBA',
      `Pedidos: ${numero(r.pedidos)} · Tokens gastados: ${numero(r.gastados)}`,
      `❌ ${r.rechazados} rechazados · 😤 ${r.renegados} renegados · ✅ ${r.aprobados} aprobados de mala gana`,
      estado.tokens <= 0 ? '💀 Me quedé sin tokens.' : `Me quedan ${numero(estado.tokens)} tokens.`,
      location.href,
    ].join('\n');
  }

  async function compartir() {
    const texto = textoParaCompartir();
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Copiado. Pegalo en el chat del equipo.');
    } catch {
      window.prompt('Copiá el texto:', texto);
    }
  }

  // ---------- Inicio ----------

  $('formulario').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const campo = $('texto');
    const texto = campo.value;
    if (!texto.trim() || pendiente) return;
    campo.value = '';
    enviar(texto);
  });

  $('texto').addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      $('formulario').requestSubmit();
    }
  });

  $('abrir-recargas').addEventListener('click', abrirDialogo);
  $('dialogo-cerrar').addEventListener('click', () => $('dialogo').close());
  $('compartir').addEventListener('click', compartir);
  $('dialogo-compartir').addEventListener('click', compartir);
  $('reiniciar').addEventListener('click', () => {
    if (pendiente) return;
    if (window.confirm('¿Reiniciar todo? Se borra el historial y vuelven los tokens. (Es trampa.)')) {
      reiniciar({ conservarSecuencia: false });
      pintarTodo();
    }
  });

  setInterval(() => {
    if (!pendiente && chequearDia()) return;
    pintarCuenta();
    if (recuperarPaciencia()) pintarAnimo();
  }, 1000);

  pintarRapidos();
  if (!chequearDia()) {
    recuperarPaciencia();
    pintarTodo();
  }
})();
