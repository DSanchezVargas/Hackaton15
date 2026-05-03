require('dotenv').config();

const express        = require('express');
const http           = require('http');
const { Server }     = require('socket.io');
const session        = require('express-session');
const rateLimit      = require('express-rate-limit');
const path           = require('path');

const { testConnection } = require('./src/config/db');
const authRouter         = require('./src/routes/auth');
const paquetesRouter     = require('./src/routes/paquetes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Compartir io con los routers
app.set('io', io);

const isProduction = process.env.NODE_ENV === 'production';

// ── Rate limiting ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde' },
});

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'curier_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            {
    secure:   isProduction,
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   1000 * 60 * 60 * 8,
  },
}));

// ── Rutas API ─────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRouter);
app.use('/api/paquetes', apiLimiter,  paquetesRouter);

// SPA fallback (Express 5 requires explicit wildcard parameter)
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Socket.io ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌  Cliente conectado: ${socket.id}`);

  // El cliente puede suscribirse al seguimiento de un paquete específico
  socket.on('seguir:paquete', (paqueteId) => {
    socket.join(`paquete_${paqueteId}`);
    console.log(`   ↳ ${socket.id} sigue paquete #${paqueteId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌  Cliente desconectado: ${socket.id}`);
  });
});

// ── Arranque ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

(async () => {
  await testConnection();
  server.listen(PORT, () => {
    console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
  });
})();
