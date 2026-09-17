const express = require('express');
const clientController = require('../controllers/client.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { profileRules } = require('../validators/request.validator');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', clientController.dashboard);
router.get('/profile', clientController.showProfile);
router.post('/profile', profileRules, validate('/client/profile'), clientController.updateProfile);

module.exports = router;
