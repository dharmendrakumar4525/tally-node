const express = require('express');
const router = express.Router();
const costCategoryController = require('../controllers/costCategoryController');

// Define routes
router.post('/cost-categories', costCategoryController.upsertCostCategories);

module.exports = router;
