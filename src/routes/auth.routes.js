const express = require('express');
const authController = require('../controllers/auth.controller');
const { guestOnly } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { registerRules, loginRules, resendRules } = require('../validators/auth.validator');

const router = express.Router();

router.get('/', authController.home);
router.get('/register', guestOnly, authController.showRegister);
router.post('/register', guestOnly, registerRules, validate('/register'), authController.register);
router.get('/login', guestOnly, authController.showLogin);
router.post('/login', guestOnly, loginRules, validate('/login'), authController.login);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post(
  '/resend-verification',
  guestOnly,
  resendRules,
  validate('/login'),
  authController.resendVerification,
);

module.exports = router;
