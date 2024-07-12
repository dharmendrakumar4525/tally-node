const db = require('../config/db');

async function createCostCenterTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS cost_center (
      companyid VARCHAR(255) NOT NULL,
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      category VARCHAR(255)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating cost center table: ' + err.message);
  }
}

exports.upsertCostCenter = async (costCenters) => {
  await createCostCenterTable();

  const sqlInsert = `
    INSERT INTO cost_center (companyid, guid, alterid, name, parent, category)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      companyid = VALUES(companyid),
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      category = VALUES(category);
  `;

  const values = costCenters.map(center => [
    center.companyid,
    center.guid,
    center.alterid || '',
    center.name || '',
    center.parent || '',
    center.category || ''
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting cost center data: ' + err.message);
  }
};
