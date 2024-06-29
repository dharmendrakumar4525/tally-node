const StockItem = require('../models/stockItemModel');

exports.upsertStockItems = async (req, res) => {
  const stockItems = req.body.Data;

  if (!Array.isArray(stockItems)) {
    return res.status(400).json({ error: 'Input should be an array of stock item entries' });
  }

  try {
    const result = await StockItem.upsertStockItem(stockItems);
    res.status(200).json({ message: 'Stock item data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into stock item:', err);
    res.status(500).json({ error: 'Failed to upsert stock item data', details: err.message });
  }
};
