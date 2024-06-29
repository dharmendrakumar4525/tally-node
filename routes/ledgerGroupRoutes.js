const express = require('express');
const router = express.Router();
const ledgerGroupController = require('../controllers/ledgerGroupController');

// Define routes
router.post('/ledger-groups', ledgerGroupController.upsertLedgerGroups);

module.exports = router;
