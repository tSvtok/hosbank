const cardService = require('../services/card.service');
const requestService = require('../services/request.service');
const { asyncHandler } = require('../middlewares/error.middleware');

const cardController = {
  index: asyncHandler(async (req, res) => {
    const cards = await cardService.listForUser(req.user.id);
    res.render('client/cards', {
      title: 'Cartes',
      cards,
    });
  }),

  requestVirtual: asyncHandler(async (req, res) => {
    await requestService.create({
      userId: req.user.id,
      type: 'new_card',
      message: 'Demande de carte virtuelle',
    });
    req.flash('success', 'Demande de carte virtuelle envoyée.');
    res.redirect('/requests');
  }),

  requestOpposition: asyncHandler(async (req, res) => {
    await requestService.create({
      userId: req.user.id,
      type: 'card_opposition',
      message: req.body.message || 'Demande d’opposition',
      relatedCardId: Number(req.params.id),
    });
    req.flash('success', 'Demande d’opposition envoyée à votre chargé client.');
    res.redirect('/requests');
  }),

  requestPin: asyncHandler(async (req, res) => {
    await requestService.create({
      userId: req.user.id,
      type: 'pin_reset',
      message: 'Demande de renouvellement du PIN',
      relatedCardId: Number(req.params.id),
    });
    req.flash('success', 'Demande de PIN envoyée à votre chargé client.');
    res.redirect('/requests');
  }),
};

module.exports = cardController;
