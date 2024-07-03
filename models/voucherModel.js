const moment = require('moment');
const db = require('../config/db');

async function createVoucherTables() {
  const createVoucherTableQuery = `
    CREATE TABLE IF NOT EXISTS voucher (
      guid VARCHAR(255) PRIMARY KEY,
      alterid INT,
      voucher_number VARCHAR(255),
      date DATE,
      reference_number VARCHAR(255),
      reference_date DATE,
      party_name VARCHAR(255),
      voucher_type VARCHAR(255),
      Voucher_Total DECIMAL(15, 2),
      place_of_supply VARCHAR(255),
      is_invoice VARCHAR(10),
      narration TEXT
    );
  `;

  const createInventoryEntriesTableQuery = `
    CREATE TABLE IF NOT EXISTS inventory_entry (
      guid VARCHAR(255) PRIMARY KEY,
      voucher_guid VARCHAR(255),
      item VARCHAR(255),
      quantity DECIMAL(15, 2),
      rate DECIMAL(15, 2),
      amount DECIMAL(15, 2),
      discount_percent DECIMAL(5, 2),
      godown VARCHAR(255),
      batch_name VARCHAR(255),
      additional_amount DECIMAL(15, 2),
      tracking_number VARCHAR(255),
      order_number VARCHAR(255),
      order_due_date DATE,
      FOREIGN KEY (voucher_guid) REFERENCES voucher(guid) ON DELETE CASCADE
    );
  `;

  try {
    const pool = await db();
    await pool.query(createVoucherTableQuery);
    await pool.query(createInventoryEntriesTableQuery);
  } catch (err) {
    throw new Error('Error creating tables: ' + err.message);
  }
}

exports.upsertVouchers = async (vouchers) => {
  await createVoucherTables();

  const sqlInsertVoucher = `
    INSERT INTO voucher (guid, alterid, voucher_number, date, reference_number, reference_date, party_name, voucher_type, Voucher_Total, place_of_supply, is_invoice, narration)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      voucher_number = VALUES(voucher_number),
      date = VALUES(date),
      reference_number = VALUES(reference_number),
      reference_date = VALUES(reference_date),
      party_name = VALUES(party_name),
      voucher_type = VALUES(voucher_type),
      Voucher_Total = VALUES(Voucher_Total),
      place_of_supply = VALUES(place_of_supply),
      is_invoice = VALUES(is_invoice),
      narration = VALUES(narration);
  `;

  const sqlInsertInventoryEntry = `
    INSERT INTO inventory_entry (guid, voucher_guid, item, quantity, rate, amount, discount_percent, godown, batch_name, additional_amount, tracking_number, order_number, order_due_date)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      item = VALUES(item),
      quantity = VALUES(quantity),
      rate = VALUES(rate),
      amount = VALUES(amount),
      discount_percent = VALUES(discount_percent),
      godown = VALUES(godown),
      batch_name = VALUES(batch_name),
      additional_amount = VALUES(additional_amount),
      tracking_number = VALUES(tracking_number),
      order_number = VALUES(order_number),
      order_due_date = VALUES(order_due_date);
  `;

  const voucherValues = vouchers.map(voucher => [
    voucher.guid,
    voucher.alterid,
    voucher.voucher_number,
    moment(voucher.date, 'YYYY-MM-DD').format('YYYY-MM-DD'), // Format date correctly
    voucher.reference_number || '',
    voucher.reference_date ? moment(voucher.reference_date, 'YYYY-MM-DD').format('YYYY-MM-DD') : null,
    voucher.party_name,
    voucher.voucher_type,
    parseFloat(voucher.Voucher_Total),
    voucher.place_of_supply,
    voucher.is_invoice,
    voucher.narration || ''
  ]);

  const inventoryEntryValues = vouchers.reduce((acc, voucher) => {
    if (voucher.InventoryEntries && Array.isArray(voucher.InventoryEntries)) {
      voucher.InventoryEntries.forEach(inventory => {
        const orderDueDate = inventory.order_duedate ? moment(inventory.order_duedate, 'YYYY-MM-DD').format('YYYY-MM-DD') : null;
        acc.push([
          inventory.guid,
          voucher.guid,
          inventory.item,
          parseFloat(inventory.quantity),
          parseFloat(inventory.Rate),
          parseFloat(inventory.amount),
          parseFloat(inventory.DiscountPercent) || 0,
          inventory.godown,
          inventory.BatchName,
          parseFloat(inventory.additional_amount) || 0,
          inventory.tracking_number,
          inventory.order_number,
          orderDueDate
        ]);
      });
    }
    return acc;
  }, []);

  try {
    const pool = await db();
    await pool.query(sqlInsertVoucher, [voucherValues]);
    if (inventoryEntryValues.length > 0) {
      await pool.query(sqlInsertInventoryEntry, [inventoryEntryValues]);
    }
  } catch (err) {
    throw new Error('Error upserting voucher data: ' + err.message);
  }
};
