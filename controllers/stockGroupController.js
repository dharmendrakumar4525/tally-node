const StockGroup = require('../models/stockGroupModel');

exports.upsertStockGroups = async (req, res) => {
  const stockGroups = req.body.Data;

  if (!Array.isArray(stockGroups)) {
    return res.status(400).json({ error: 'Input should be an array of stock group entries' });
  }

  try {
    const result = await StockGroup.upsertStockGroup(stockGroups);
    res.status(200).json({ message: 'Stock group data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into stock group:', err);
    res.status(500).json({ error: 'Failed to upsert stock group data', details: err.message });
  }
};
