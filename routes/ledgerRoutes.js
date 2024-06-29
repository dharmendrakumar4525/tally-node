const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

// Define routes
router.post('/ledgers', ledgerController.upsertLedgers);

module.exports = router;
