const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

// Define routes
router.post('/units', unitController.upsertUnits);

module.exports = router;
