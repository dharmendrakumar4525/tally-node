const CostCategory = require('../models/costCategoryModel');

exports.upsertCostCategories = async (req, res) => {
  const costCategories = req.body.Data;

  if (!Array.isArray(costCategories)) {
    return res.status(400).json({ error: 'Input should be an array of cost category entries' });
  }

  try {
    const result = await CostCategory.upsertCostCategory(costCategories);
    res.status(200).json({ message: 'Cost category data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into cost category:', err);
    res.status(500).json({ error: 'Failed to upsert cost category data', details: err.message });
  }
};
