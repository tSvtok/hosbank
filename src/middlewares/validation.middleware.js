const { validationResult } = require('express-validator');

function validate(redirectTo) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    req.flash('error', errors.array().map((item) => item.msg).join(' '));
    return res.redirect(redirectTo || req.get('Referrer') || '/');
  };
}

module.exports = { validate };
