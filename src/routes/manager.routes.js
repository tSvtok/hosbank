const express = require('express');
const managerController = require('../controllers/manager.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('manager', 'admin'));
router.get('/', managerController.dashboard);
router.get('/clients', requirePermission('users.read'), managerController.clients);
router.get('/clients/:id', requirePermission('users.read'), managerController.clientDetail);
router.post('/clients/:id/interactions', requirePermission('users.read'), managerController.addInteraction);
router.get('/requests', requirePermission('requests.handle'), managerController.requests);
router.post('/requests/:id', requirePermission('requests.handle'), managerController.decideRequest);
router.get('/complaints', requirePermission('complaints.handle'), managerController.complaints);
router.post('/complaints/:id', requirePermission('complaints.handle'), managerController.updateComplaint);

module.exports = router;
