const express = require('express');
const bcrypt  = require('bcryptjs');
const { crearUsuario, obtenerUsuarioPorEmail } = require('../models/queries');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    const rolValido = ['cliente', 'mensajero'].includes(rol) ? rol : 'cliente';

    const existe = await obtenerUsuarioPorEmail(email);
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await crearUsuario(nombre, email, hash, rolValido);

    req.session.usuario = { id: result.id, nombre, email, rol: rolValido };
    res.status(201).json({ mensaje: 'Usuario creado', usuario: req.session.usuario });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await obtenerUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    req.session.usuario = {
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol,
    };
    res.json({ mensaje: 'Login exitoso', usuario: req.session.usuario });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensaje: 'Sesión cerrada' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.usuario) {
    return res.json({ usuario: req.session.usuario });
  }
  res.status(401).json({ error: 'No autenticado' });
});

module.exports = router;
