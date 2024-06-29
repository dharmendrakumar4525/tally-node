const express = require('express');
const router = express.Router();
const stockItemController = require('../controllers/stockItemController');

// Define routes
router.post('/stockitems', stockItemController.upsertStockItems);

module.exports = router;
