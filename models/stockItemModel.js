const db = require('../config/db');

async function createStockItemTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS stock_item (
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      alias VARCHAR(255),
      part_number VARCHAR(255),
      Unit VARCHAR(255),
      AlternateUnit VARCHAR(255),
      Conversion DECIMAL(15, 2),
      opening_balance DECIMAL(15, 2),
      opening_rate DECIMAL(15, 2),
      opening_value DECIMAL(15, 2),
      gst_type_of_supply VARCHAR(50),
      gst_hsn_code VARCHAR(50),
      gst_rate DECIMAL(5, 2),
      gst_taxability VARCHAR(50),
      applicable_from_date DATE,
      hsn_description VARCHAR(255),
      rate DECIMAL(15, 2),
      is_rcm_applicable VARCHAR(10),
      nature_of_transaction VARCHAR(255),
      nature_of_goods VARCHAR(255),
      supply_type VARCHAR(255),
      taxability VARCHAR(50)
    )
  `;

  const createBatchAllocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS batch_allocation (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stock_item_guid VARCHAR(255),
      item VARCHAR(255),
      opening_balance DECIMAL(15, 2),
      opening_rate DECIMAL(15, 2),
      opening_value DECIMAL(15, 2),
      godown VARCHAR(255),
      manufactured_on DATE,
      FOREIGN KEY (stock_item_guid) REFERENCES stock_item(guid) ON DELETE CASCADE
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
    await pool.query(createBatchAllocationsTableQuery);
  } catch (err) {
    throw new Error('Error creating stock item table: ' + err.message);
  }
}

exports.upsertStockItem = async (stockItems) => {
  await createStockItemTable();

  const sqlInsertStockItem = `
    INSERT INTO stock_item (
      guid, alterid, name, parent, alias, part_number, Unit, AlternateUnit, Conversion,
      opening_balance, opening_rate, opening_value, gst_type_of_supply, gst_hsn_code, gst_rate,
      gst_taxability, applicable_from_date, hsn_description, rate, is_rcm_applicable,
      nature_of_transaction, nature_of_goods, supply_type, taxability
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      alias = VALUES(alias),
      part_number = VALUES(part_number),
      Unit = VALUES(Unit),
      AlternateUnit = VALUES(AlternateUnit),
      Conversion = VALUES(Conversion),
      opening_balance = VALUES(opening_balance),
      opening_rate = VALUES(opening_rate),
      opening_value = VALUES(opening_value),
      gst_type_of_supply = VALUES(gst_type_of_supply),
      gst_hsn_code = VALUES(gst_hsn_code),
      gst_rate = VALUES(gst_rate),
      gst_taxability = VALUES(gst_taxability),
      applicable_from_date = VALUES(applicable_from_date),
      hsn_description = VALUES(hsn_description),
      rate = VALUES(rate),
      is_rcm_applicable = VALUES(is_rcm_applicable),
      nature_of_transaction = VALUES(nature_of_transaction),
      nature_of_goods = VALUES(nature_of_goods),
      supply_type = VALUES(supply_type),
      taxability = VALUES(taxability);
  `;

  const sqlInsertBatchAllocation = `
    INSERT INTO batch_allocation (
      stock_item_guid, item, opening_balance, opening_rate, opening_value, godown, manufactured_on
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      item = VALUES(item),
      opening_balance = VALUES(opening_balance),
      opening_rate = VALUES(opening_rate),
      opening_value = VALUES(opening_value),
      godown = VALUES(godown),
      manufactured_on = VALUES(manufactured_on);
  `;

  const stockItemValues = stockItems.map(item => [
    item.guid,
    item.alterid || '',
    item.name || '',
    item.parent || '',
    item.alias || '',
    item.part_number || '',
    item.Unit || '',
    item.AlternateUnit || '',
    parseFloat(item.Conversion) || 0,
    parseFloat(item.opening_balance) || 0,
    parseFloat(item.opening_rate) || 0,
    parseFloat(item.opening_value) || 0,
    item.gst_type_of_supply || '',
    item.gst_hsn_code || '',
    parseFloat(item.gst_rate) || 0,
    item.gst_taxability || '',
    new Date(item['applicable_from date']),
    item.hsn_description || '',
    parseFloat(item.rate) || 0,
    item.is_rcm_applicable || '',
    item.nature_of_transaction || '',
    item.nature_of_goods || '',
    item.supply_type || '',
    item.taxability || ''
  ]);

  const batchAllocationValues = [];
  stockItems.forEach(item => {
    if (item.BatchAllocations && Array.isArray(item.BatchAllocations)) {
      item.BatchAllocations.forEach(batch => {
        batchAllocationValues.push([
          item.guid,
          batch.item || '',
          parseFloat(batch.opening_balance) || 0,
          parseFloat(batch.opening_rate) || 0,
          parseFloat(batch.opening_value) || 0,
          batch.godown || '',
          batch['manufactured_on date'] ? new Date(batch['manufactured_on date']) : null
        ]);
      });
    }
  });

  try {
    const pool = await db();
    await pool.query(sqlInsertStockItem, [stockItemValues]);
    if (batchAllocationValues.length > 0) {
      await pool.query(sqlInsertBatchAllocation, [batchAllocationValues]);
    }
  } catch (err) {
    throw new Error('Error upserting stock item data: ' + err.message);
  }
};
