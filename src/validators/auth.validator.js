const { body } = require('express-validator');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis.'),
  body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }
    return true;
  }),
];

const loginRules = [
  body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis.'),
];

const resendRules = [
  body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
];

module.exports = { registerRules, loginRules, resendRules };
