const accountService = require('../services/account.service');
const requestService = require('../services/request.service');
const userService = require('../services/user.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { formatRib } = require('../utils/generateRib');

const clientController = {
  dashboard: asyncHandler(async (req, res) => {
    const { accounts, transfers, cards } = await accountService.getDashboard(req.user.id);
    res.render('client/dashboard', {
      title: 'Espace client',
      accounts,
      transfers,
      cards,
      formatRib,
    });
  }),

  accounts: asyncHandler(async (req, res) => {
    const { accounts } = await accountService.getDashboard(req.user.id);
    res.render('client/accounts', {
      title: 'Mes comptes',
      accounts,
      formatRib,
    });
  }),

  accountDetail: asyncHandler(async (req, res) => {
    const account = await accountService.getByIdForUser(Number(req.params.id), req.user.id);
    const { transfers } = await accountService.getDashboard(req.user.id);
    res.render('client/account-detail', {
      title: 'Détail du compte',
      account,
      transfers: transfers.filter(
        (item) =>
          item.from_account_number === account.account_number ||
          item.to_account_number === account.account_number,
      ),
      formatRib,
    });
  }),

  rib: asyncHandler(async (req, res) => {
    const account = await accountService.getByIdForUser(Number(req.params.id), req.user.id);
    res.render('client/rib', {
      title: 'RIB',
      account,
      formatRib,
    });
  }),

  requestRib: asyncHandler(async (req, res) => {
    await requestService.create({
      userId: req.user.id,
      type: 'rib',
      message: 'Demande de RIB officiel',
      relatedAccountId: Number(req.params.id),
    });
    req.flash('success', 'Demande de RIB envoyée à votre chargé client.');
    res.redirect('/requests');
  }),

  showProfile: asyncHandler(async (req, res) => {
    res.render('client/profile', {
      title: 'Mes informations',
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    await userService.updateProfile(req.user.id, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    req.flash('success', 'Informations mises à jour.');
    res.redirect('/client/profile');
  }),
};

module.exports = clientController;
