const db = require('../config/db');

async function createCostCategoryTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS cost_category (
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      allocate_revenue VARCHAR(10),
      allocate_non_revenue VARCHAR(10)
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
  } catch (err) {
    throw new Error('Error creating cost category table: ' + err.message);
  }
}

exports.upsertCostCategory = async (costCategories) => {
  await createCostCategoryTable();

  const sqlInsert = `
    INSERT INTO cost_category (guid, alterid, name, allocate_revenue, allocate_non_revenue)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      allocate_revenue = VALUES(allocate_revenue),
      allocate_non_revenue = VALUES(allocate_non_revenue);
  `;

  const values = costCategories.map(category => [
    category.guid,
    category.alterid || '',
    category.name || '',
    category.allocate_revenue || 'No',
    category.allocate_non_revenue || 'No'
  ]);

  try {
    const pool = await db();
    const [result] = await pool.query(sqlInsert, [values]);
    return result;
  } catch (err) {
    throw new Error('Error upserting cost category data: ' + err.message);
  }
};
