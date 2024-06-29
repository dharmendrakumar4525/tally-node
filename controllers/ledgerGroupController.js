const LedgerGroup = require('../models/ledgerGroupModel');

exports.upsertLedgerGroups = async (req, res) => {
  const ledgerGroups = req.body.Data;

  if (!Array.isArray(ledgerGroups)) {
    return res.status(400).json({ error: 'Input should be an array of ledger group entries' });
  }

  try {
    const result = await LedgerGroup.upsertLedgerGroup(ledgerGroups);
    res.status(200).json({ message: 'Ledger group data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into ledger group:', err);
    res.status(500).json({ error: 'Failed to upsert ledger group data', details: err.message });
  }
};

