const express = require('express');
const router = express.Router();
const costCenterController = require('../controllers/costCenterController');

// Define routes
router.post('/cost-centers', costCenterController.upsertCostCenters);

module.exports = router;
