const Unit = require('../models/unitModel');

exports.upsertUnits = async (req, res) => {
  const units = req.body.Data;

  if (!Array.isArray(units)) {
    return res.status(400).json({ error: 'Input should be an array of unit entries' });
  }

  try {
    const result = await Unit.upsertUnit(units);
    res.status(200).json({ message: 'Unit data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into unit:', err);
    res.status(500).json({ error: 'Failed to upsert unit data', details: err.message });
  }
};
