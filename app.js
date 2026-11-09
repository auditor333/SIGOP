/*
   lógica del sistema de gestión de operaciones
   contraloría - Planta VAN Stellantis
   ------------------------------------------------------------
   contiene: inicio de sesión, vistas (calendario, lista,
   pizarra), historial, panel de gestión y validación de datos.
*/


/* 1. datos */

/* usuarios del área. Cada uno tiene un TID (identificador de 4 dígitos),
   un rol y la propiedad "gestiona" (true solo para contralor y supervisora,
   que son quienes pueden usar el panel de gestión). */
let usuarios = [
  { tid: "1001", nombre: "Hector Alvarez", rol: "Contralor",    gestiona: true  },
  { tid: "1002", nombre: "Daniela",        rol: "Supervisora",  gestiona: true  },
  { tid: "1003", nombre: "Pablo Marquez",  rol: "Especialista", gestiona: false },
  { tid: "1004", nombre: "Janeth Maciel",  rol: "Analista",     gestiona: false },
  { tid: "1005", nombre: "Pamela Vega",    rol: "Becaria",      gestiona: false }
];

/* usuario que inició sesión (se asigna al entrar). */
let usuarioActual = null;

/* vista activa del bloque de detalle: "lista" o "pizarra". */
let vistaActual = "lista";

/* actividades. responsable = tid del dueño. traspasadaA = tid de quien
   la recibió temporalmente ("" = nadie). */
let actividades = [
  { id:1, nombre:"Pólizas hourly / salary", frecuencia:"Semanal", dia:"Lunes", estado:"pendiente",
    resumen:"Elaboración de pólizas contables semanales.", link:"Portal interno",
    responsable:"1005", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Ingresar al portal y descargar los dos archivos Excel.","Modificar la fecha del periodo en el archivo de salary.","Eliminar la última columna que contiene un cero.","Copiar la información y pegarla en la macro de pólizas.","Verificar que la póliza cuadre.","Generar el PDF para firma del contralor y supervisor."] },
  { id:2, nombre:"Scrap diario", frecuencia:"Diaria", dia:"Martes", estado:"completada",
    resumen:"Registro diario del desperdicio de material.", link:"Mainframe (TXT)",
    responsable:"1004", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Ejecutar el bot que descarga el TXT de Mainframe.","Abrir el Excel del reporte mensual.","Pegar el contenido del TXT.","Usar los botones borrar, filtrar y procesar.","Ajustar los números de parte.","Verificar que el total cuadre en el pivot."] },
  { id:3, nombre:"MMS", frecuencia:"Diaria", dia:"Miércoles", estado:"proceso",
    resumen:"Registro de movimientos de material.", link:"Mainframe (TXT)",
    responsable:"1004", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Obtener el TXT de MMS de Mainframe.","Procesar con la macro igual que scrap.","Validar que los montos sean consistentes.","Cargar al pivot del reporte."] },
  { id:4, nombre:"Conteos cíclicos", frecuencia:"Diaria", dia:"Jueves", estado:"pendiente",
    resumen:"Conteo físico contra conteo de Mainframe.", link:"Mainframe + físico",
    responsable:"1004", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Extraer el conteo del sistema.","Comparar contra el conteo físico.","Registrar diferencias.","Actualizar el porcentaje de exactitud."] },
  { id:5, nombre:"Presentación de Costos", frecuencia:"Semanal", dia:"Miércoles", estado:"completada",
    resumen:"Presentación semanal de costos antes de las 9 am.", link:"Excel de costos",
    responsable:"1003", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Reunir los datos de costos de la semana.","Actualizar la presentación.","Revisar variaciones contra pronóstico.","Enviar antes de las 9 am del miércoles."] },
  { id:6, nombre:"Control de salidas mecanizadas", frecuencia:"Quincenal", dia:"Viernes", estado:"proceso",
    resumen:"Registros, destrucciones y certificados.", link:"Sistema de control",
    responsable:"1005", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Revisar registros de salidas.","Validar las destrucciones.","Generar certificados.","Archivar la documentación."] },
  { id:7, nombre:"PC1 Summary report", frecuencia:"Diaria", dia:"Lunes", estado:"completada",
    resumen:"Reporte resumen PC1 por pérdida.", link:"Portal interno",
    responsable:"1003", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Descargar el reporte PC1.","Identificar las pérdidas del periodo.","Resumir en el formato establecido.","Enviar al área correspondiente."] },
  { id:8, nombre:"Reporte mensual consolidado", frecuencia:"Mensual", dia:"Viernes", estado:"pendiente",
    resumen:"Consolida scrap, MMS y conteos del mes.", link:"Excel Reporte Mensual",
    responsable:"1002", traspasadaA:"", fechaFin:"", motivo:"",
    manual:["Reunir datos de scrap, MMS y conteos.","Consolidar en el reporte.","Analizar tendencias.","Presentar al contralor."] }
];

/* historial de acciones. Cada entrada: tipo, texto y fecha/hora. */
let historial = [];


/* 2. validación de texto */

/* quita espacios invisibles y caracteres de ancho cero que a veces se
   cuelan al copiar y pegar (el "espacio raro" que parece texto pero está
   vacío). Devuelve el texto limpio. */
function limpiarInvisibles(texto) {
  // \u200B-\u200D: espacios de ancho cero; \uFEFF: marca de orden de bytes;
  // \u00A0: espacio duro; \u2060: unión de palabras.
  return texto.replace(/[\u200B-\u200D\uFEFF\u00A0\u2060]/g, "").trim();
}

/* valida un nombre: solo letras (con acentos y ñ), espacios y puntos.
   Devuelve {ok:true, valor:"..."} o {ok:false, error:"..."} */
function validarNombre(texto) {
  const limpio = limpiarInvisibles(texto);
  if (limpio === "") return { ok: false, error: "El nombre no puede estar vacío." };
  // permite letras, acentos, ñ, espacios y puntos. Nada de números ni signos raros.
  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñ.\s]+$/;
  if (!patron.test(limpio)) return { ok: false, error: "El nombre solo puede contener letras y espacios." };
  return { ok: true, valor: limpio };
}

/* valida un TID: exactamente 4 dígitos, sin nada más. */
function validarTID(texto) {
  const limpio = limpiarInvisibles(texto);
  if (limpio === "") return { ok: false, error: "El TID no puede estar vacío." };
  const patron = /^[0-9]{4}$/;
  if (!patron.test(limpio)) return { ok: false, error: "El TID debe tener exactamente 4 dígitos numéricos." };
  return { ok: true, valor: limpio };
}

/* valida un texto libre (resumen): no vacío y sin caracteres invisibles. */
function validarTextoLibre(texto) {
  const limpio = limpiarInvisibles(texto);
  if (limpio === "") return { ok: false, error: "Este campo no puede estar vacío." };
  return { ok: true, valor: limpio };
}


/* 3. inicio de sesión */

function buscarUsuarioPorNombre(nombre) {
  const n = nombre.toLowerCase();
  return usuarios.find(u => u.nombre.toLowerCase() === n);
}
function buscarUsuarioPorTID(tid) {
  return usuarios.find(u => u.tid === tid);
}

function iniciarSesion() {
  const err = document.getElementById("loginError");
  err.innerHTML = "";

  const vNombre = validarNombre(document.getElementById("inputUsuario").value);
  if (!vNombre.ok) { err.innerHTML = vNombre.error; return; }

  const vTID = validarTID(document.getElementById("inputTID").value);
  if (!vTID.ok) { err.innerHTML = vTID.error; return; }

  // busca el usuario y comprueba que el nombre y el TID correspondan a la misma persona.
  const usuario = buscarUsuarioPorNombre(vNombre.valor);
  if (!usuario) { err.innerHTML = "El usuario no existe."; return; }
  if (usuario.tid !== vTID.valor) { err.innerHTML = "El TID no coincide con el usuario."; return; }

  // inicio de sesión correcto
  usuarioActual = usuario;
  document.getElementById("pantallaLogin").style.display = "none";
  document.getElementById("pantallaApp").classList.remove("app-oculta");

  // el botón del panel solo se muestra a quien puede gestionar
  document.getElementById("btnPanel").style.display = usuario.gestiona ? "inline-block" : "none";

  document.getElementById("headerUsuario").innerHTML = usuario.nombre;
  document.getElementById("headerRol").innerHTML = usuario.rol;

  cambiarVista("lista");
  render();
}

function cerrarSesion() {
  usuarioActual = null;
  document.getElementById("inputUsuario").value = "";
  document.getElementById("inputTID").value = "";
  document.getElementById("loginError").innerHTML = "";
  document.getElementById("pantallaApp").classList.add("app-oculta");
  document.getElementById("pantallaLogin").style.display = "flex";
  // asegura que se regrese a la vista de trabajo
  document.getElementById("vistaTrabajo").classList.remove("app-oculta");
  document.getElementById("vistaPanel").classList.add("app-oculta");
}


/* 4. utilidades */

function leToca(act) {
  if (act.responsable === usuarioActual.tid && act.traspasadaA === "") return true;
  if (act.traspasadaA === usuarioActual.tid) return true;
  return false;
}

/* el contralor y la supervisora ven todas las actividades; los demás solo las suyas. */
function actividadesVisibles() {
  if (usuarioActual.gestiona) return actividades;
  return actividades.filter(leToca);
}

function textoEstado(e) {
  return e === "pendiente" ? "Pendiente" : e === "proceso" ? "En proceso" : "Completada";
}

function nombreDe(tid) {
  const u = buscarUsuarioPorTID(tid);
  return u ? u.nombre : "Desconocido";
}

/* registra una acción en el historial con la fecha y hora actuales. */
function registrarHistorial(tipo, texto) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-MX") + " " + ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  historial.unshift({ tipo, texto, fecha, usuario: usuarioActual.nombre });
}


/* 5. render principal */

function render() {
  const u = buscarUsuarioPorTID(usuarioActual.tid);
  document.getElementById("tituloBienvenida").innerHTML = "Mi lugar de trabajo - " + u.nombre;
  document.getElementById("subtitulo").innerHTML = u.gestiona
    ? "Vista de " + u.rol + ": puede ver todas las actividades del equipo y acceder al panel de gestión."
    : "Vista de " + u.rol + ": muestra las actividades que le corresponden.";

  actualizarResumen();
  document.getElementById("bloqueCalendario").innerHTML = vistaCalendario();
  document.getElementById("bloqueDetalle").innerHTML = (vistaActual === "lista") ? vistaLista() : vistaPizarra();
}

function actualizarResumen() {
  const vis = actividadesVisibles();
  document.getElementById("rTotal").innerHTML = vis.length;
  document.getElementById("rPend").innerHTML = vis.filter(a => a.estado === "pendiente").length;
  document.getElementById("rProc").innerHTML = vis.filter(a => a.estado === "proceso").length;
  document.getElementById("rComp").innerHTML = vis.filter(a => a.estado === "completada").length;
}


/* 6. vista calendario */

function vistaCalendario() {
  const vis = actividadesVisibles();
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  let h = '<div class="calendario"><div class="cal-grid">';
  dias.forEach(dia => {
    h += '<div><div class="cal-dia-tit">' + dia + '</div>';
    const items = vis.filter(a => a.dia === dia);
    items.forEach(act => {
      h += '<div class="cal-tarea ' + act.estado + '" onclick="verManual(' + act.id + ')">' +
           '<div class="cal-tarea-nom">' + act.nombre + '</div><div>' + act.frecuencia + '</div></div>';
    });
    if (items.length === 0) h += '<div class="cal-vacio">—</div>';
    h += '</div>';
  });
  return h + '</div></div>';
}


/* 7. vista lista */

function botonesDe(act) {
  let b = '<button class="btn-accion" onclick="verManual(' + act.id + ')">Manual</button>' +
          '<button class="btn-accion" onclick="cambiarEstado(' + act.id + ')">Estado</button>';
  // puede traspasar: el dueño de la actividad, o quien gestiona (contralor/supervisora).
  if ((act.responsable === usuarioActual.tid && act.traspasadaA === "") || usuarioActual.gestiona) {
    b += '<button class="btn-accion" onclick="abrirTraspaso(' + act.id + ')">Traspasar</button>';
  }
  // puede regresar una tarea traspasada.
  if (act.traspasadaA !== "" && (act.responsable === usuarioActual.tid || usuarioActual.gestiona)) {
    b += '<button class="btn-accion" onclick="regresar(' + act.id + ')">Regresar</button>';
  }
  return b;
}

function notaDe(act) {
  if (act.traspasadaA === usuarioActual.tid) {
    return '<div class="nota-traspaso">Recibida de ' + nombreDe(act.responsable) + ' - hasta ' + act.fechaFin + ' (' + act.motivo + ')</div>';
  }
  if (act.traspasadaA !== "" && (act.responsable === usuarioActual.tid || usuarioActual.gestiona)) {
    return '<div class="nota-traspaso">Traspasada a ' + nombreDe(act.traspasadaA) + ' - hasta ' + act.fechaFin + '</div>';
  }
  return "";
}

function vistaLista() {
  const vis = actividadesVisibles();
  if (vis.length === 0) return "<p style='color:#5a6785'>No hay actividades para mostrar.</p>";
  let h = '<div class="lista">';
  vis.forEach(act => {
    h += '<div class="fila ' + act.estado + '">' +
      '<div class="fila-info">' +
        '<div class="fila-nombre">' + act.nombre + '</div>' +
        '<div class="fila-det">' + act.dia + ' &bull; Responsable: ' + nombreDe(act.responsable) + ' &bull; ' + act.resumen + '</div>' +
        '<div class="fila-det">Archivo: ' + act.link + '</div>' + notaDe(act) +
      '</div>' +
      '<span class="b-frec">' + act.frecuencia + '</span>' +
      '<span class="badge b-' + act.estado + '">' + textoEstado(act.estado) + '</span>' +
      '<div class="acciones">' + botonesDe(act) + '</div>' +
    '</div>';
  });
  return h + '</div>';
}


/* 8. vista pizarra */

function vistaPizarra() {
  const vis = actividadesVisibles();
  const cols = [
    { k: "pendiente", t: "Pendientes" },
    { k: "proceso", t: "En proceso" },
    { k: "completada", t: "Completadas" }
  ];
  let h = '<div class="pizarra">';
  cols.forEach(col => {
    const items = vis.filter(a => a.estado === col.k);
    h += '<div class="columna"><div class="col-titulo">' + col.t + ' <span class="col-cuenta">' + items.length + '</span></div>';
    items.forEach(act => {
      h += '<div class="tarjeta-k ' + act.estado + '" onclick="verManual(' + act.id + ')">' +
        '<div class="tk-nombre">' + act.nombre + '</div>' +
        '<div class="tk-det">' + act.dia + ' &bull; ' + nombreDe(act.responsable) + '</div>' +
        '<div class="tk-pie"><span class="b-frec">' + act.frecuencia + '</span>' +
        '<button class="btn-accion" onclick="event.stopPropagation(); cambiarEstado(' + act.id + ')">Mover</button></div>' +
      '</div>';
    });
    if (items.length === 0) h += '<p class="cal-vacio">Vacío</p>';
    h += '</div>';
  });
  return h + '</div>';
}


/* 9. cambio de vista */

function cambiarVista(v) {
  vistaActual = v;
  document.getElementById("bvLista").classList.toggle("activo", v === "lista");
  document.getElementById("bvPizarra").classList.toggle("activo", v === "pizarra");
  if (usuarioActual) render();
}


/* 10. acciones sobre actividades */

function cambiarEstado(id) {
  const a = actividades.find(x => x.id === id);
  const anterior = textoEstado(a.estado);
  a.estado = a.estado === "pendiente" ? "proceso" : a.estado === "proceso" ? "completada" : "pendiente";
  registrarHistorial("estado", "Cambió el estado de \"" + a.nombre + "\" de " + anterior + " a " + textoEstado(a.estado) + ".");
  render();
}

function verManual(id) {
  const a = actividades.find(x => x.id === id);
  document.getElementById("tituloManual").innerHTML = "Manual: " + a.nombre;
  let c = "";
  a.manual.forEach((p, i) => {
    c += '<div class="paso"><div class="n-paso">' + (i + 1) + '</div><div class="t-paso">' + p + '</div></div>';
  });
  document.getElementById("pasosManual").innerHTML = c;
  document.getElementById("vManual").style.display = "flex";
}

function cerrar(id) { document.getElementById(id).style.display = "none"; }


/* 11. traspaso de tareas */

let idTraspaso = 0;

function abrirTraspaso(id) {
  idTraspaso = id;
  const a = actividades.find(x => x.id === id);
  document.getElementById("txtTraspaso").innerHTML = "Vas a traspasar: " + a.nombre;
  const d = document.getElementById("tDestino");
  d.innerHTML = "";
  usuarios.forEach(u => {
    if (u.tid !== usuarioActual.tid) {
      const o = document.createElement("option");
      o.value = u.tid;
      o.text = u.nombre + " (" + u.rol + ")";
      d.appendChild(o);
    }
  });
  document.getElementById("vTraspaso").style.display = "flex";
}

function confirmarTraspaso() {
  const destino = document.getElementById("tDestino").value;
  const fecha = document.getElementById("tFecha").value;
  const motivo = document.getElementById("tMotivo").value;
  if (!fecha) { alert("Elige la fecha hasta cuándo dura el traspaso."); return; }
  const a = actividades.find(x => x.id === idTraspaso);
  a.traspasadaA = destino;
  a.fechaFin = fecha;
  a.motivo = motivo;
  registrarHistorial("traspaso", "Traspasó \"" + a.nombre + "\" a " + nombreDe(destino) + " hasta el " + fecha + " (" + motivo + ").");
  cerrar("vTraspaso");
  render();
}

function regresar(id) {
  const a = actividades.find(x => x.id === id);
  const quien = nombreDe(a.traspasadaA);
  a.traspasadaA = "";
  a.fechaFin = "";
  a.motivo = "";
  registrarHistorial("devolucion", "Devolvió \"" + a.nombre + "\" (antes asignada a " + quien + ") a su responsable original.");
  render();
}


/* 12. formularios (abrir/cerrar) */

function abrirForm(tipo) {
  if (tipo === "actividad") {
    document.getElementById("errorActividad").innerHTML = "";
    document.getElementById("vFormActividad").style.display = "flex";
  } else {
    document.getElementById("errorUsuario").innerHTML = "";
    document.getElementById("vFormUsuario").style.display = "flex";
  }
}

/* ----- guardar nueva actividad (con validación) ----- */
function guardarActividad() {
  const err = document.getElementById("errorActividad");
  err.innerHTML = "";
  const vNombre = validarTextoLibre(document.getElementById("actNombre").value);
  if (!vNombre.ok) { err.innerHTML = vNombre.error; return; }
  const vResumen = validarTextoLibre(document.getElementById("actResumen").value);
  if (!vResumen.ok) { err.innerHTML = vResumen.error; return; }

  const nueva = {
    id: actividades.length + 1,
    nombre: vNombre.valor,
    frecuencia: document.getElementById("actFrec").value,
    dia: document.getElementById("actDia").value,
    estado: "pendiente",
    resumen: vResumen.valor,
    link: "Por definir",
    responsable: usuarioActual.tid,
    traspasadaA: "", fechaFin: "", motivo: "",
    manual: ["Manual por documentar."]
  };
  actividades.push(nueva);
  registrarHistorial("nueva", "Creó la actividad \"" + vNombre.valor + "\".");
  document.getElementById("actNombre").value = "";
  document.getElementById("actResumen").value = "";
  cerrar("vFormActividad");
  render();
}

/* ----- guardar nuevo usuario (con validación de nombre y TID) ----- */
function guardarUsuario() {
  const err = document.getElementById("errorUsuario");
  err.innerHTML = "";
  const vNombre = validarNombre(document.getElementById("usrNombre").value);
  if (!vNombre.ok) { err.innerHTML = vNombre.error; return; }
  const vTID = validarTID(document.getElementById("usrTID").value);
  if (!vTID.ok) { err.innerHTML = vTID.error; return; }

  // verifica que el TID no esté repetido
  if (buscarUsuarioPorTID(vTID.valor)) { err.innerHTML = "Ya existe un usuario con ese TID."; return; }
  // verifica que el nombre no esté repetido
  if (buscarUsuarioPorNombre(vNombre.valor)) { err.innerHTML = "Ya existe un usuario con ese nombre."; return; }

  const rol = document.getElementById("usrRol").value;
  const gestiona = (rol === "Contralor" || rol === "Supervisora");
  usuarios.push({ tid: vTID.valor, nombre: vNombre.valor, rol: rol, gestiona: gestiona });
  registrarHistorial("nueva", "Agregó al usuario " + vNombre.valor + " (" + rol + ", TID " + vTID.valor + ").");
  document.getElementById("usrNombre").value = "";
  document.getElementById("usrTID").value = "";
  cerrar("vFormUsuario");
  renderPanel();
}


/* 13. historial (panel lateral) */

function abrirHistorial() {
  renderHistorial();
  document.getElementById("historialFondo").style.display = "block";
  document.getElementById("historialPanel").classList.add("abierto");
}
function cerrarHistorial() {
  document.getElementById("historialFondo").style.display = "none";
  document.getElementById("historialPanel").classList.remove("abierto");
}

function renderHistorial() {
  const cont = document.getElementById("historialContenido");
  if (historial.length === 0) {
    cont.innerHTML = '<div class="hist-vacio">Aún no hay acciones registradas.<br>Las acciones que realices (cambios de estado, traspasos, devoluciones) aparecerán aquí.</div>';
    return;
  }
  let h = "";
  historial.forEach(ev => {
    let clase = "ha-estado", etq = "Cambio";
    if (ev.tipo === "traspaso") { clase = "ha-traspaso"; etq = "Traspaso"; }
    else if (ev.tipo === "devolucion") { clase = "ha-devolucion"; etq = "Devolución"; }
    else if (ev.tipo === "nueva") { clase = "ha-nueva"; etq = "Alta"; }
    h += '<div class="hist-item">' +
      '<div class="hist-fecha">' + ev.fecha + ' &bull; ' + ev.usuario + '</div>' +
      '<span class="hist-accion ' + clase + '">' + etq + '</span>' +
      '<div class="hist-texto">' + ev.texto + '</div>' +
    '</div>';
  });
  cont.innerHTML = h;
}


/* 14. panel de gestión */

function irAPanel() {
  document.getElementById("vistaTrabajo").classList.add("app-oculta");
  document.getElementById("vistaPanel").classList.remove("app-oculta");
  renderPanel();
}
function volverATrabajo() {
  document.getElementById("vistaPanel").classList.add("app-oculta");
  document.getElementById("vistaTrabajo").classList.remove("app-oculta");
  render();
}

function renderPanel() {
  // --- lista de usuarios con opción de cambiar rol y eliminar ---
  let hu = "";
  usuarios.forEach(u => {
    const esYo = (u.tid === usuarioActual.tid);
    hu += '<div class="usuario-item">' +
      '<div class="usuario-item-info">' +
        '<div class="usuario-item-nom">' + u.nombre + (esYo ? " (tú)" : "") + '</div>' +
        '<div class="usuario-item-rol">TID: ' + u.tid + '</div>' +
      '</div>' +
      '<select class="select-rol" onchange="cambiarRol(\'' + u.tid + '\', this.value)">' +
        opcionRol("Becaria", u.rol) + opcionRol("Analista", u.rol) + opcionRol("Especialista", u.rol) +
        opcionRol("Supervisora", u.rol) + opcionRol("Contralor", u.rol) +
      '</select>' +
      (esYo ? '' : '<button class="btn-eliminar" onclick="eliminarUsuario(\'' + u.tid + '\')">Eliminar</button>') +
    '</div>';
  });
  document.getElementById("listaUsuariosPanel").innerHTML = hu;

  // --- reasignar actividades ---
  let hr = "";
  actividades.forEach(act => {
    hr += '<div class="reasignar-item">' +
      '<div class="reasignar-nom">' + act.nombre + '</div>' +
      '<div class="reasignar-ctrl">' +
        '<span style="font-size:11px;color:#5a6785;">Responsable:</span>' +
        '<select onchange="reasignar(' + act.id + ', this.value)">' + opcionesUsuarios(act.responsable) + '</select>' +
      '</div>' +
    '</div>';
  });
  document.getElementById("listaReasignar").innerHTML = hr;
}

function opcionRol(rol, actual) {
  return '<option value="' + rol + '"' + (rol === actual ? ' selected' : '') + '>' + rol + '</option>';
}
function opcionesUsuarios(tidActual) {
  let o = "";
  usuarios.forEach(u => {
    o += '<option value="' + u.tid + '"' + (u.tid === tidActual ? ' selected' : '') + '>' + u.nombre + '</option>';
  });
  return o;
}

function cambiarRol(tid, nuevoRol) {
  const u = buscarUsuarioPorTID(tid);
  u.rol = nuevoRol;
  u.gestiona = (nuevoRol === "Contralor" || nuevoRol === "Supervisora");
  registrarHistorial("nueva", "Cambió el rol de " + u.nombre + " a " + nuevoRol + ".");
  renderPanel();
}

function eliminarUsuario(tid) {
  const u = buscarUsuarioPorTID(tid);
  if (!confirm("¿Eliminar al usuario " + u.nombre + "? Sus actividades quedarán sin responsable asignado.")) return;
  usuarios = usuarios.filter(x => x.tid !== tid);
  registrarHistorial("devolucion", "Eliminó al usuario " + u.nombre + ".");
  renderPanel();
}

function reasignar(id, nuevoTID) {
  const a = actividades.find(x => x.id === id);
  const antes = nombreDe(a.responsable);
  a.responsable = nuevoTID;
  a.traspasadaA = "";  // al reasignar el dueño, se limpia cualquier traspaso temporal
  registrarHistorial("traspaso", "Reasignó \"" + a.nombre + "\" de " + antes + " a " + nombreDe(nuevoTID) + ".");
  renderPanel();
}


/* 15. arranque */
/* la app empieza en la pantalla de login; no se renderiza nada
   hasta que un usuario inicie sesión correctamente. */