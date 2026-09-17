const express = require('express');
const cardController = require('../controllers/card.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', cardController.index);
router.post('/virtual', cardController.requestVirtual);
router.post('/:id/opposition', cardController.requestOpposition);
router.post('/:id/pin', cardController.requestPin);

module.exports = router;
