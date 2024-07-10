const Voucher = require('../models/voucherModel');

exports.upsertVouchers = async (req, res) => {
  const vouchers = req.body.Data;

  if (!Array.isArray(vouchers)) {
    return res.status(400).json({ error: 'Input should be an array of voucher entries' });
  }

  try {
    const result = await Voucher.upsertVoucher(vouchers);
    res.status(200).json({ message: 'Voucher data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into voucher:', err);
    res.status(500).json({ error: 'Failed to upsert voucher data', details: err.message });
  }
};
