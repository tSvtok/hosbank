const authService = require('../services/auth.service');
const { redirectForRole } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

const authController = {
  home(req, res) {
    res.render('auth/home', { title: 'Hosbank' });
  },

  showRegister(req, res) {
    res.render('auth/register', { title: 'Ouvrir un compte' });
  },

  register: asyncHandler(async (req, res) => {
    await authService.register({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    });
    req.flash(
      'success',
      'Un e-mail de vérification a été envoyé. En local, ouvrez MailHog sur http://localhost:8025',
    );
    res.redirect('/login');
  }),

  showLogin(req, res) {
    res.render('auth/login', { title: 'Connexion' });
  },

  login: asyncHandler(async (req, res) => {
    const user = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });
    req.session.userId = user.id;
    req.session.save(() => {
      res.redirect(redirectForRole(user.role_name));
    });
  }),

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/');
    });
  },

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.query.token);
    req.flash('success', 'Adresse e-mail vérifiée. Vous pouvez vous connecter.');
    res.redirect('/login');
  }),

  resendVerification: asyncHandler(async (req, res) => {
    await authService.resendVerification(req.body.email);
    req.flash('success', 'Si un compte existe, un nouvel e-mail a été envoyé.');
    res.redirect('/login');
  }),
};

module.exports = authController;
