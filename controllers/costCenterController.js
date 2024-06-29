const CostCenter = require('../models/costCenterModel');

exports.upsertCostCenters = async (req, res) => {
  const costCenters = req.body.Data;

  if (!Array.isArray(costCenters)) {
    return res.status(400).json({ error: 'Input should be an array of cost center entries' });
  }

  try {
    const result = await CostCenter.upsertCostCenter(costCenters);
    res.status(200).json({ message: 'Cost center data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into cost center:', err);
    res.status(500).json({ error: 'Failed to upsert cost center data', details: err.message });
  }
};
