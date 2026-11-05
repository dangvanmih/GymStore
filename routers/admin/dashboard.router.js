const express = require('express');
const router = express.Router();

const Controller = require('../../controllers/admin/dashboard.controller');

router.get('/chart-data', Controller.chartData);
router.get('/', Controller.dashboard);

module.exports = router;
