const userService = require('../services/user.service');

async function loadUser(req, res, next) {
  try {
    if (!req.session.userId) {
      res.locals.user = null;
      return next();
    }

    const user = await userService.getWithPermissions(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      res.locals.user = null;
      return next();
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Connectez-vous pour continuer.');
    return res.redirect('/login');
  }
  if (req.user.status === 'suspended') {
    req.session.destroy(() => {});
    req.flash('error', 'Ce compte est suspendu.');
    return res.redirect('/login');
  }
  next();
}

function guestOnly(req, res, next) {
  if (req.user) {
    return res.redirect(redirectForRole(req.user.roleName));
  }
  next();
}

function redirectForRole(roleName) {
  if (roleName === 'admin') {
    return '/admin';
  }
  if (roleName === 'manager') {
    return '/manager';
  }
  return '/client';
}

module.exports = {
  loadUser,
  requireAuth,
  guestOnly,
  redirectForRole,
};
