const { body } = require('express-validator');

const requestRules = [
  body('type')
    .isIn(['new_card', 'savings_account', 'rib', 'pin_reset', 'card_opposition'])
    .withMessage('Type de demande invalide.'),
  body('message').optional({ values: 'falsy' }).isLength({ max: 1000 }),
];

const complaintRules = [
  body('subject').trim().notEmpty().withMessage('Le sujet est requis.'),
  body('message').trim().notEmpty().withMessage('Le message est requis.'),
];

const profileRules = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis.'),
];

module.exports = { requestRules, complaintRules, profileRules };
