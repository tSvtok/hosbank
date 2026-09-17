const express = require('express');
const requestController = require('../controllers/request.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { requestRules } = require('../validators/request.validator');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', requestController.index);
router.post('/', requestRules, validate('/requests'), requestController.create);

module.exports = router;
