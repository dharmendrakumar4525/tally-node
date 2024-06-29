const Ledger = require('../models/ledgerModel');

exports.upsertLedgers = async (req, res) => {
  const ledgers = req.body.Data;

  if (!Array.isArray(ledgers)) {
    return res.status(400).json({ error: 'Input should be an array of ledger entries' });
  }

  try {
    const result = await Ledger.upsertLedger(ledgers);
    res.status(200).json({ message: 'Ledger data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into ledger:', err);
    res.status(500).json({ error: 'Failed to upsert ledger data', details: err.message });
  }
};
