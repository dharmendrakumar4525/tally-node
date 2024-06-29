const express = require('express');
const router = express.Router();
const stockGroupController = require('../controllers/stockGroupController');

// Define routes
router.post('/stock-groups', stockGroupController.upsertStockGroups);

module.exports = router;
