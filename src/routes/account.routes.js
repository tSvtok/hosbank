const express = require('express');
const clientController = require('../controllers/client.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('client'));
router.get('/', clientController.accounts);
router.get('/:id/rib', clientController.rib);
router.post('/:id/rib', clientController.requestRib);
router.get('/:id', clientController.accountDetail);

module.exports = router;
