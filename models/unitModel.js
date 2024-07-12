const db = require('../config/db');

async function createUnitTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS unit (
      companyid VARCHAR(255) NOT NULL,
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      formalname VARCHAR(255),
      is_simple_unit ENUM('Yes', 'No'),
      additional_units VARCHAR(255),
      conversion DECIMAL(15, 2)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating unit table: ' + err.message);
  }
}

exports.upsertUnit = async (units) => {
  await createUnitTable();

  const sqlInsert = `
    INSERT INTO unit (
      companyid, guid, alterid, name, formalname, is_simple_unit, additional_units, conversion
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      companyid = VALUES(companyid),
      alterid = VALUES(alterid),
      name = VALUES(name),
      formalname = VALUES(formalname),
      is_simple_unit = VALUES(is_simple_unit),
      additional_units = VALUES(additional_units),
      conversion = VALUES(conversion);
  `;

  const values = units.map(unit => [
    unit.companyid,
    unit.guid,
    unit.alterid || '',
    unit.name || '',
    unit.formalname || '',
    unit.is_simple_unit || 'No',
    unit.additional_units || '',
    parseFloat(unit.conversion) || 0
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting unit data: ' + err.message);
  }
};
