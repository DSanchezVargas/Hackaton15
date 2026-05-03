const { pool } = require('../config/db');

// Ejecutar procedimiento almacenado y devolver todos los result sets
async function callProc(name, params = []) {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${name}(${placeholders})`;
  const [results] = await pool.execute(sql, params);
  return results;
}

// ---------- Usuarios ----------

async function crearUsuario(nombre, email, passwordHash, rol) {
  const results = await callProc('sp_crear_usuario', [nombre, email, passwordHash, rol]);
  return results[0][0];
}

async function obtenerUsuarioPorEmail(email) {
  const results = await callProc('sp_obtener_usuario_email', [email]);
  return results[0][0] || null;
}

// ---------- Paquetes ----------

async function crearPaquete(codigo, descripcion, remitenteId, destinatario, direccionDest, mensaje) {
  const results = await callProc('sp_crear_paquete', [
    codigo, descripcion, remitenteId, destinatario, direccionDest, mensaje || null,
  ]);
  return results[0][0];
}

async function actualizarEstadoPaquete(id, estado, mensajeroId = null) {
  const results = await callProc('sp_actualizar_estado_paquete', [id, estado, mensajeroId]);
  return results[0][0];
}

async function listarPaquetesRemitente(remitenteId) {
  const results = await callProc('sp_listar_paquetes_remitente', [remitenteId]);
  return results[0];
}

async function listarTodosPaquetes() {
  const results = await callProc('sp_listar_todos_paquetes', []);
  return results[0];
}

// ---------- Seguimiento ----------

async function registrarUbicacion(paqueteId, latitud, longitud, descripcion) {
  const results = await callProc('sp_registrar_ubicacion', [
    paqueteId,
    latitud  !== undefined ? latitud  : null,
    longitud !== undefined ? longitud : null,
    descripcion || null,
  ]);
  return results[0][0];
}

async function obtenerSeguimiento(paqueteId) {
  const results = await callProc('sp_obtener_seguimiento', [paqueteId]);
  return results[0];
}

module.exports = {
  crearUsuario,
  obtenerUsuarioPorEmail,
  crearPaquete,
  actualizarEstadoPaquete,
  listarPaquetesRemitente,
  listarTodosPaquetes,
  registrarUbicacion,
  obtenerSeguimiento,
};
