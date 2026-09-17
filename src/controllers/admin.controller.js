const userService = require('../services/user.service');
const accountService = require('../services/account.service');
const transferService = require('../services/transfer.service');
const requestService = require('../services/request.service');
const complaintService = require('../services/complaint.service');
const cardService = require('../services/card.service');
const { asyncHandler, DomainError } = require('../middlewares/error.middleware');

const adminController = {
  dashboard: asyncHandler(async (req, res) => {
    const [stats, accounts, transfers, managers, users] = await Promise.all([
      userService.getStats(),
      accountService.listAll(),
      transferService.listAll(),
      userService.listManagerActivity(),
      userService.listUsers(),
    ]);
    res.render('admin/dashboard', {
      title: 'Administration',
      stats,
      accounts,
      transfers,
      managers,
      clients: users.filter((item) => item.role_name === 'client'),
    });
  }),

  users: asyncHandler(async (req, res) => {
    const [users, managers, roles] = await Promise.all([
      userService.listUsers(),
      userService.listManagers(),
      userService.listRoles(),
    ]);
    res.render('admin/users', {
      title: 'Utilisateurs',
      users,
      managers,
      roles,
    });
  }),

  showCreateUser: asyncHandler(async (req, res) => {
    const [managers, roles] = await Promise.all([
      userService.listManagers(),
      userService.listRoles(),
    ]);
    res.render('admin/user-form', {
      title: 'Créer un utilisateur',
      managers,
      roles,
      person: null,
    });
  }),

  createUser: asyncHandler(async (req, res) => {
    await userService.createUser({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      roleName: req.body.roleName,
      managerId: req.body.managerId ? Number(req.body.managerId) : null,
    });
    req.flash('success', 'Utilisateur créé.');
    res.redirect('/admin/users');
  }),

  showEditUser: asyncHandler(async (req, res) => {
    const person = await userService.getWithPermissions(Number(req.params.id));
    if (!person) {
      throw new DomainError('Utilisateur introuvable.', 404);
    }
    const [managers, roles] = await Promise.all([
      userService.listManagers(),
      userService.listRoles(),
    ]);
    res.render('admin/user-form', {
      title: 'Modifier un utilisateur',
      person,
      managers,
      roles,
    });
  }),

  updateUser: asyncHandler(async (req, res) => {
    await userService.updateUser(Number(req.params.id), {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      roleName: req.body.roleName,
      managerId: req.body.managerId ? Number(req.body.managerId) : null,
      status: req.body.status,
    });
    req.flash('success', 'Utilisateur mis à jour.');
    res.redirect('/admin/users');
  }),

  assignManager: asyncHandler(async (req, res) => {
    await userService.assignManager(Number(req.params.id), Number(req.body.managerId) || null);
    req.flash('success', 'Chargé client affecté.');
    res.redirect('/admin/users');
  }),

  setUserStatus: asyncHandler(async (req, res) => {
    await userService.setStatus(Number(req.params.id), req.body.status);
    req.flash('success', 'Statut utilisateur mis à jour.');
    res.redirect('/admin/users');
  }),

  freezeAccount: asyncHandler(async (req, res) => {
    await accountService.setStatus(Number(req.params.id), req.body.status);
    req.flash('success', 'Statut du compte mis à jour.');
    res.redirect('/admin');
  }),

  createAccount: asyncHandler(async (req, res) => {
    await accountService.createForUser(Number(req.body.userId), req.body.type || 'checking');
    req.flash('success', 'Compte bancaire créé.');
    res.redirect('/admin');
  }),

  cards: asyncHandler(async (req, res) => {
    const cards = await cardService.listAll();
    res.render('admin/cards', { title: 'Cartes', cards });
  }),

  setCardStatus: asyncHandler(async (req, res) => {
    await cardService.forceStatus(Number(req.params.id), req.body.status);
    req.flash('success', 'Statut de la carte mis à jour.');
    res.redirect('/admin/cards');
  }),

  requests: asyncHandler(async (req, res) => {
    const requests = await requestService.listAll(null);
    res.render('admin/requests', { title: 'Toutes les demandes', requests });
  }),

  decideRequest: asyncHandler(async (req, res) => {
    await requestService.decide({
      requestId: Number(req.params.id),
      status: req.body.status,
      handlerId: req.user.id,
      response: req.body.response,
      actor: req.user,
    });
    req.flash('success', 'Demande mise à jour.');
    res.redirect('/admin/requests');
  }),

  complaints: asyncHandler(async (req, res) => {
    const complaints = await complaintService.listAll(null);
    res.render('admin/complaints', { title: 'Toutes les réclamations', complaints });
  }),

  updateComplaint: asyncHandler(async (req, res) => {
    await complaintService.updateStatus({
      complaintId: Number(req.params.id),
      status: req.body.status,
      handlerId: req.user.id,
      response: req.body.response,
      actor: req.user,
    });
    req.flash('success', 'Réclamation mise à jour.');
    res.redirect('/admin/complaints');
  }),

  transfers: asyncHandler(async (req, res) => {
    const transfers = await transferService.listAll();
    res.render('admin/transfers', { title: 'Virements et opérations', transfers });
  }),

  managers: asyncHandler(async (req, res) => {
    const managers = await userService.listManagerActivity();
    res.render('admin/managers', { title: 'Supervision des chargés', managers });
  }),
};

module.exports = adminController;
