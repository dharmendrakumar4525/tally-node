const db = require('../config/db');

async function createLedgerGroupTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ledger_group (
      guid INT AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(255) UNIQUE NOT NULL,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      primary_group VARCHAR(255),
      is_revenue VARCHAR(10),
      is_deemedpositive VARCHAR(10),
      is_reserved VARCHAR(255),
      affects_gross_profit VARCHAR(10),
      sort_position INT
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating ledger group table: ' + err.message);
  }
}

exports.upsertLedgerGroup = async (ledgerGroups) => {
  await createLedgerGroupTable();

  const sqlInsert = `
    INSERT INTO ledger_group (uid, alterid, name, parent, primary_group, is_revenue, is_deemedpositive, is_reserved, affects_gross_profit, sort_position)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      primary_group = VALUES(primary_group),
      is_revenue = VALUES(is_revenue),
      is_deemedpositive = VALUES(is_deemedpositive),
      is_reserved = VALUES(is_reserved),
      affects_gross_profit = VALUES(affects_gross_profit),
      sort_position = VALUES(sort_position);
  `;

  const values = ledgerGroups.map(group => [
    group.uid,
    group.alterid || '',
    group.name || '',
    group.parent || '',
    group.primary_group || '',
    group.is_revenue || 'No',
    group.is_deemedpositive || 'No',
    group.is_reserved || '',
    group.affects_gross_profit || 'No',
    group.sort_position || 0,
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting ledger group data: ' + err.message);
  }
};
