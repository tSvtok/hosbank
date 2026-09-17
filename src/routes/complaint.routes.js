const express = require('express');
const complaintController = require('../controllers/complaint.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { complaintRules } = require('../validators/request.validator');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', complaintController.index);
router.post('/', complaintRules, validate('/complaints'), complaintController.create);

module.exports = router;
