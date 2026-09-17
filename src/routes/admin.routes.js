const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', adminController.dashboard);
router.get('/users', requirePermission('users.read'), adminController.users);
router.get('/users/new', requirePermission('users.manage'), adminController.showCreateUser);
router.post('/users', requirePermission('users.manage'), adminController.createUser);
router.get('/users/:id/edit', requirePermission('users.manage'), adminController.showEditUser);
router.post('/users/:id', requirePermission('users.manage'), adminController.updateUser);
router.post('/users/:id/manager', requirePermission('users.manage'), adminController.assignManager);
router.post('/users/:id/status', requirePermission('users.manage'), adminController.setUserStatus);
router.post('/accounts', requirePermission('accounts.manage'), adminController.createAccount);
router.post('/accounts/:id/status', requirePermission('accounts.manage'), adminController.freezeAccount);
router.get('/cards', requirePermission('accounts.manage'), adminController.cards);
router.post('/cards/:id/status', requirePermission('accounts.manage'), adminController.setCardStatus);
router.get('/requests', requirePermission('requests.handle'), adminController.requests);
router.post('/requests/:id', requirePermission('requests.handle'), adminController.decideRequest);
router.get('/complaints', requirePermission('complaints.handle'), adminController.complaints);
router.post('/complaints/:id', requirePermission('complaints.handle'), adminController.updateComplaint);
router.get('/transfers', requirePermission('accounts.read_all'), adminController.transfers);
router.get('/managers', requirePermission('users.read'), adminController.managers);

module.exports = router;
