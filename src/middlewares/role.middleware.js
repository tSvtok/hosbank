function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Connectez-vous pour continuer.');
      return res.redirect('/login');
    }
    if (!roles.includes(req.user.roleName)) {
      return res.status(403).render('errors/403', { title: 'Accès refusé' });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Connectez-vous pour continuer.');
      return res.redirect('/login');
    }
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).render('errors/403', { title: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { requireRole, requirePermission };
