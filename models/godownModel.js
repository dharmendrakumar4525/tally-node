const db = require('../config/db');

async function createGodownTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS godown (
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      address VARCHAR(255)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating godown table: ' + err.message);
  }
}

exports.upsertGodown = async (godowns) => {
  await createGodownTable();

  const sqlInsert = `
    INSERT INTO godown (guid, alterid, name, parent, address)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      address = VALUES(address);
  `;

  const values = godowns.map(godown => [
    godown.guid,
    godown.alterid || '',
    godown.name || '',
    godown.parent || '',
    godown.address || ''
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting godown data: ' + err.message);
  }
};
