class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'DomainError';
    this.status = status;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res) {
  res.status(404).render('errors/404', { title: 'Page introuvable' });
}

function errorHandler(error, req, res, next) {
  if (error instanceof DomainError) {
    req.flash('error', error.message);
    const fallback = req.get('Referrer') || '/';
    return res.redirect(fallback);
  }

  console.error(error);
  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500);
  if (req.accepts('html')) {
    return res.status(500).render('errors/500', { title: 'Erreur serveur' });
  }
  res.json({ error: 'Internal Server Error' });
}

module.exports = {
  DomainError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
