const db = require('../config/db');

async function createStockGroupTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS stock_group (
      companyid VARCHAR(255) NOT NULL,
      guid INT AUTO_INCREMENT PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating stock group table: ' + err.message);
  }
}

exports.upsertStockGroup = async (stockGroups) => {
  await createStockGroupTable();

  const sqlInsert = `
    INSERT INTO stock_group (companyid, alterid, name, parent)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      companyid = VALUES(companyid),
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent);
  `;

  const values = stockGroups.map(group => [
    group.companyid,
    group.alterid || '',
    group.name || '',
    group.parent || ''
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting stock group data: ' + err.message);
  }
};
