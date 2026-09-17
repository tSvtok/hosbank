const express = require('express');
const transferController = require('../controllers/transfer.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { transferRules } = require('../validators/transfer.validator');

const router = express.Router();

router.use(requireAuth, requireRole('client'), requirePermission('accounts.transfer'));
router.get('/', transferController.index);
router.post('/', transferRules, validate('/transfers'), transferController.create);

module.exports = router;
