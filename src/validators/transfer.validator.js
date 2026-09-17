const { body } = require('express-validator');

const transferRules = [
  body('fromAccountId').isInt().withMessage('Compte source invalide.'),
  body('beneficiaryId').isInt().withMessage('Bénéficiaire invalide.'),
  body('amount').notEmpty().withMessage('Le montant est requis.'),
  body('label').optional({ values: 'falsy' }).isLength({ max: 255 }),
];

module.exports = { transferRules };
