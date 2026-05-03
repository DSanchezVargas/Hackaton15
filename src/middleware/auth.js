function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.session.usuario.rol)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRol };
