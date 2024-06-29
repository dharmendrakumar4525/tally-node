const Godown = require('../models/godownModel');

exports.upsertGodowns = async (req, res) => {
  const godowns = req.body.Data;

  if (!Array.isArray(godowns)) {
    return res.status(400).json({ error: 'Input should be an array of godown entries' });
  }

  try {
    const result = await Godown.upsertGodown(godowns);
    res.status(200).json({ message: 'Godown data upserted successfully', result });
  } catch (err) {
    console.error('Error upserting data into godown:', err);
    res.status(500).json({ error: 'Failed to upsert godown data', details: err.message });
  }
};
