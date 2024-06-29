const express = require('express');
const router = express.Router();
const voucherTypeController = require('../controllers/voucherTypeController');

// Define routes
router.post('/vouchertypes', voucherTypeController.upsertVoucherTypes);

module.exports = router;
