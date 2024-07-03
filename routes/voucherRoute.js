const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.post('/vouchers', voucherController.upsertVouchers);

module.exports = router;
