const express  = require('express');
const { requireAuth, requireRol } = require('../middleware/auth');
const {
  crearPaquete,
  actualizarEstadoPaquete,
  listarPaquetesRemitente,
  listarTodosPaquetes,
  registrarUbicacion,
  obtenerSeguimiento,
} = require('../models/queries');

const router = express.Router();

// Generar código único para el paquete
function generarCodigo() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG-${ts}-${rand}`;
}

// GET /api/paquetes  - listar paquetes según rol
router.get('/', requireAuth, async (req, res) => {
  try {
    const { id, rol } = req.session.usuario;
    const paquetes = (rol === 'admin' || rol === 'mensajero')
      ? await listarTodosPaquetes()
      : await listarPaquetesRemitente(id);
    res.json(paquetes);
  } catch (err) {
    console.error('Error al listar paquetes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/paquetes  - crear paquete (solo clientes y admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { descripcion, destinatario, direccion_dest, mensaje } = req.body;
    if (!descripcion || !destinatario || !direccion_dest) {
      return res.status(400).json({ error: 'descripcion, destinatario y direccion_dest son obligatorios' });
    }

    const codigo  = generarCodigo();
    const result  = await crearPaquete(
      codigo, descripcion, req.session.usuario.id,
      destinatario, direccion_dest, mensaje
    );

    // Emitir evento Socket.io al room general
    req.app.get('io').emit('paquete:nuevo', {
      id: result.id, codigo, descripcion, destinatario, estado: 'pendiente',
    });

    res.status(201).json({ mensaje: 'Paquete creado', id: result.id, codigo });
  } catch (err) {
    console.error('Error al crear paquete:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/paquetes/:id/estado  - cambiar estado (mensajero / admin)
router.patch('/:id/estado', requireRol('mensajero', 'admin'), async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'en_transito', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const mensajeroId = req.session.usuario.rol === 'mensajero' ? req.session.usuario.id : null;
    await actualizarEstadoPaquete(parseInt(req.params.id, 10), estado, mensajeroId);

    req.app.get('io').emit('paquete:estado', {
      id: parseInt(req.params.id, 10), estado,
    });

    res.json({ mensaje: 'Estado actualizado', estado });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/paquetes/:id/seguimiento
router.get('/:id/seguimiento', requireAuth, async (req, res) => {
  try {
    const historial = await obtenerSeguimiento(parseInt(req.params.id, 10));
    res.json(historial);
  } catch (err) {
    console.error('Error al obtener seguimiento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/paquetes/:id/ubicacion  - registrar ubicación GPS (mensajero / admin)
router.post('/:id/ubicacion', requireRol('mensajero', 'admin'), async (req, res) => {
  try {
    const { descripcion } = req.body;
    const paqueteId = parseInt(req.params.id, 10);

    const latRaw = req.body.latitud;
    const lngRaw = req.body.longitud;

    const latitud  = (latRaw !== undefined && latRaw !== null && latRaw !== '')
      ? parseFloat(latRaw)
      : null;
    const longitud = (lngRaw !== undefined && lngRaw !== null && lngRaw !== '')
      ? parseFloat(lngRaw)
      : null;

    if (latitud !== null && isNaN(latitud)) {
      return res.status(400).json({ error: 'latitud debe ser un número válido' });
    }
    if (longitud !== null && isNaN(longitud)) {
      return res.status(400).json({ error: 'longitud debe ser un número válido' });
    }

    const result = await registrarUbicacion(paqueteId, latitud, longitud, descripcion);

    req.app.get('io').emit('paquete:ubicacion', {
      paquete_id: paqueteId, latitud, longitud, descripcion,
      registrado_en: new Date().toISOString(),
    });

    res.status(201).json({ mensaje: 'Ubicación registrada', id: result.id });
  } catch (err) {
    console.error('Error al registrar ubicación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
