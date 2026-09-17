const { body } = require('express-validator');

const beneficiaryRules = [
  body('label').trim().notEmpty().withMessage('Le libellé est requis.'),
  body('holderName').trim().notEmpty().withMessage('Le titulaire est requis.'),
  body('rib').trim().notEmpty().withMessage('Le RIB / IBAN est requis.'),
];

module.exports = { beneficiaryRules };
