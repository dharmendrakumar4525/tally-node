const db = require('../config/db');

async function createVoucherTypeTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS voucher_type (
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      numbering_method VARCHAR(50),
      is_deemedpositive VARCHAR(10),
      affects_stock VARCHAR(10)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating voucher type table: ' + err.message);
  }
}

exports.upsertVoucherType = async (voucherTypes) => {
  await createVoucherTypeTable();

  const sqlInsert = `
    INSERT INTO voucher_type (guid, alterid, name, parent, numbering_method, is_deemedpositive, affects_stock)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      numbering_method = VALUES(numbering_method),
      is_deemedpositive = VALUES(is_deemedpositive),
      affects_stock = VALUES(affects_stock);
  `;

  const values = voucherTypes.map(type => [
    type.guid,
    type.alterid || '',
    type.name || '',
    type.parent || '',
    type.numbering_method || '',
    type.is_deemedpositive || 'No',
    type.affects_stock || 'No'
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting voucher type data: ' + err.message);
  }
};
