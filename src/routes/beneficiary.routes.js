const express = require('express');
const beneficiaryController = require('../controllers/beneficiary.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { beneficiaryRules } = require('../validators/beneficiary.validator');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', beneficiaryController.index);
router.post('/', beneficiaryRules, validate('/beneficiaries'), beneficiaryController.create);
router.post('/:id/delete', beneficiaryController.remove);

module.exports = router;
