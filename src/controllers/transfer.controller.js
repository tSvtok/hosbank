const transferService = require('../services/transfer.service');
const beneficiaryService = require('../services/beneficiary.service');
const accountService = require('../services/account.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { formatRib } = require('../utils/generateRib');

const transferController = {
  index: asyncHandler(async (req, res) => {
    const [{ accounts }, beneficiaries, transfers] = await Promise.all([
      accountService.getDashboard(req.user.id),
      beneficiaryService.listForUser(req.user.id),
      transferService.listForUser(req.user.id),
    ]);
    res.render('client/transfers', {
      title: 'Virements',
      accounts,
      beneficiaries,
      transfers,
      formatRib,
    });
  }),

  create: asyncHandler(async (req, res) => {
    await transferService.execute({
      userId: req.user.id,
      fromAccountId: Number(req.body.fromAccountId),
      beneficiaryId: Number(req.body.beneficiaryId),
      amount: req.body.amount,
      label: req.body.label,
    });
    req.flash('success', 'Virement effectué.');
    res.redirect('/transfers');
  }),
};

module.exports = transferController;
