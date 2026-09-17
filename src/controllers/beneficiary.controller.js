const beneficiaryService = require('../services/beneficiary.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { formatRib } = require('../utils/generateRib');

const beneficiaryController = {
  index: asyncHandler(async (req, res) => {
    const beneficiaries = await beneficiaryService.listForUser(req.user.id);
    res.render('client/beneficiaries', {
      title: 'Bénéficiaires',
      beneficiaries,
      formatRib,
    });
  }),

  create: asyncHandler(async (req, res) => {
    await beneficiaryService.create({
      userId: req.user.id,
      label: req.body.label,
      holderName: req.body.holderName,
      rib: req.body.rib,
    });
    req.flash('success', 'Bénéficiaire ajouté.');
    res.redirect('/beneficiaries');
  }),

  remove: asyncHandler(async (req, res) => {
    await beneficiaryService.remove(Number(req.params.id), req.user.id);
    req.flash('success', 'Bénéficiaire supprimé.');
    res.redirect('/beneficiaries');
  }),
};

module.exports = beneficiaryController;
