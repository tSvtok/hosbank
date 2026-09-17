const requestService = require('../services/request.service');
const accountService = require('../services/account.service');
const cardService = require('../services/card.service');
const { asyncHandler } = require('../middlewares/error.middleware');

const requestController = {
  index: asyncHandler(async (req, res) => {
    const [{ accounts }, requests, cards] = await Promise.all([
      accountService.getDashboard(req.user.id),
      requestService.listForUser(req.user.id),
      cardService.listForUser(req.user.id),
    ]);
    res.render('client/requests', {
      title: 'Demandes',
      requests,
      accounts,
      cards,
    });
  }),

  create: asyncHandler(async (req, res) => {
    await requestService.create({
      userId: req.user.id,
      type: req.body.type,
      message: req.body.message,
      relatedAccountId: req.body.relatedAccountId ? Number(req.body.relatedAccountId) : null,
      relatedCardId: req.body.relatedCardId ? Number(req.body.relatedCardId) : null,
    });
    req.flash('success', 'Demande envoyée à votre chargé client.');
    res.redirect('/requests');
  }),
};

module.exports = requestController;
