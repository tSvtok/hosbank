const userService = require('../services/user.service');
const requestService = require('../services/request.service');
const complaintService = require('../services/complaint.service');
const accountService = require('../services/account.service');
const cardService = require('../services/card.service');
const interactionRepository = require('../repositories/interaction.repository');
const { asyncHandler, DomainError } = require('../middlewares/error.middleware');

function managerScope(user) {
  return user.roleName === 'admin' ? null : user.id;
}

const managerController = {
  dashboard: asyncHandler(async (req, res) => {
    const scope = managerScope(req.user);
    const [assignedClients, allUsers, requests, complaints] = await Promise.all([
      userService.listClientsForManager(req.user.id),
      userService.listUsers(),
      requestService.listAll(scope),
      complaintService.listAll(scope),
    ]);
    const clients =
      req.user.roleName === 'admin'
        ? allUsers.filter((item) => item.role_name === 'client')
        : assignedClients;
    res.render('manager/dashboard', {
      title: 'Espace chargé client',
      clients,
      requests: requests.filter((item) => item.status === 'pending'),
      complaints: complaints.filter((item) => item.status !== 'closed'),
    });
  }),

  clients: asyncHandler(async (req, res) => {
    const clients =
      req.user.roleName === 'admin'
        ? (await userService.listUsers()).filter((item) => item.role_name === 'client')
        : await userService.listClientsForManager(req.user.id);
    res.render('manager/clients', {
      title: 'Mes clients',
      clients,
    });
  }),

  clientDetail: asyncHandler(async (req, res) => {
    const clientId = Number(req.params.id);
    const clientUser = await userService.getWithPermissions(clientId);
    if (!clientUser || clientUser.roleName !== 'client') {
      throw new DomainError('Client introuvable.', 404);
    }
    if (
      req.user.roleName === 'manager' &&
      Number(clientUser.managerId) !== Number(req.user.id)
    ) {
      throw new DomainError('Ce client ne vous est pas affecté.');
    }
    const [{ accounts, transfers }, cards, requests, complaints, interactions] = await Promise.all([
      accountService.getDashboard(clientId),
      cardService.listForUser(clientId),
      requestService.listForUser(clientId),
      complaintService.listForUser(clientId),
      interactionRepository.findByClientId(clientId),
    ]);
    res.render('manager/client-detail', {
      title: `${clientUser.firstName} ${clientUser.lastName}`,
      person: {
        id: clientUser.id,
        first_name: clientUser.firstName,
        last_name: clientUser.lastName,
        email: clientUser.email,
        phone: clientUser.phone,
        status: clientUser.status,
      },
      accounts,
      transfers,
      cards,
      requests,
      complaints,
      interactions,
    });
  }),

  addInteraction: asyncHandler(async (req, res) => {
    await interactionRepository.create({
      managerId: req.user.id,
      clientId: Number(req.params.id),
      type: req.body.type || 'note',
      content: req.body.content,
    });
    req.flash('success', 'Interaction enregistrée.');
    res.redirect(`/manager/clients/${req.params.id}`);
  }),

  requests: asyncHandler(async (req, res) => {
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';
    const requests = (await requestService.listAll(managerScope(req.user))).filter((item) => {
      const statusOk = status === 'all' || item.status === status;
      const typeOk = type === 'all' || item.type === type;
      return statusOk && typeOk;
    });
    res.render('manager/requests', {
      title: 'Demandes clients',
      requests,
      filters: { status, type },
    });
  }),

  decideRequest: asyncHandler(async (req, res) => {
    await requestService.decide({
      requestId: Number(req.params.id),
      status: req.body.status,
      handlerId: req.user.id,
      response: req.body.response,
      actor: req.user,
    });
    req.flash('success', 'Demande mise à jour. Une réponse a été envoyée au client.');
    res.redirect('/manager/requests');
  }),

  complaints: asyncHandler(async (req, res) => {
    const complaints = await complaintService.listAll(managerScope(req.user));
    res.render('manager/complaints', {
      title: 'Réclamations',
      complaints,
    });
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
    res.redirect('/manager/complaints');
  }),
};

module.exports = managerController;
