const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/inventory.controller');
const { requirePermission } = require('../../middlewares/admin/permission.middleware');

router.get('/', requirePermission('inventory_view'), controller.index);
router.get('/edit/:id', requirePermission('inventory_view'), controller.edit);
router.post('/edit/:id', requirePermission('inventory_view'), controller.update);

module.exports = router;
