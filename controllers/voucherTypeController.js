const VoucherType = require('../models/voucherTypeModel');

exports.upsertVoucherTypes = async (req, res) => {
  const voucherTypes = req.body.Data;

  if (!Array.isArray(voucherTypes)) {
    return res.status(400).json({ error: 'Input should be an array of voucher type entries' });
  }

  try {
    const result = await VoucherType.upsertVoucherType(voucherTypes);
    res.status(200).json({ message: 'Voucher type data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into voucher type:', err);
    res.status(500).json({ error: 'Failed to upsert voucher type data', details: err.message });
  }
};
