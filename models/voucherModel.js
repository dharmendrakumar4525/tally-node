const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function createVoucherTable() {
  const createVoucherTableQuery = `
    CREATE TABLE IF NOT EXISTS voucher (
      companyid VARCHAR(255) NOT NULL,
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
    )
  `;

  const createInventoryEntriesTableQuery = `
    CREATE TABLE IF NOT EXISTS inventory_entries (
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
      order_duedate DATE,
      FOREIGN KEY (voucher_guid) REFERENCES voucher(guid) ON DELETE CASCADE
    )
  `;

  const createBatchAllocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS batch_allocations (
      guid VARCHAR(255) PRIMARY KEY,
      inventory_entry_guid VARCHAR(255),
      item VARCHAR(255),
      name VARCHAR(255),
      godown VARCHAR(255),
      quantity DECIMAL(15, 2),
      amount DECIMAL(15, 2),
      tracking_number VARCHAR(255),
      FOREIGN KEY (inventory_entry_guid) REFERENCES inventory_entries(guid) ON DELETE CASCADE
    )
  `;

  const createLedgerEntriesTableQuery = `
    CREATE TABLE IF NOT EXISTS ledger_entries (
      guid VARCHAR(255) PRIMARY KEY,
      voucher_guid VARCHAR(255),
      ledger_name VARCHAR(255),
      amount DECIMAL(15, 2),
      group_name VARCHAR(255),
      is_deemed_positive VARCHAR(10),
      is_party_ledger VARCHAR(10),
      gst_rate VARCHAR(255),
      hsn_code VARCHAR(255),
      cess_rate VARCHAR(255),
      FOREIGN KEY (voucher_guid) REFERENCES voucher(guid) ON DELETE CASCADE
    )
  `;

  const createBillAllocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS bill_allocations (
      guid VARCHAR(255) PRIMARY KEY,
      ledger_entry_guid VARCHAR(255),
      ledger VARCHAR(255),
      billtype VARCHAR(255),
      name VARCHAR(255),
      amount DECIMAL(15, 2),
      FOREIGN KEY (ledger_entry_guid) REFERENCES ledger_entries(guid) ON DELETE CASCADE
    )
  `;

  try {
    const pool = await db();
    await pool.query(createVoucherTableQuery);
    await pool.query(createInventoryEntriesTableQuery);
    await pool.query(createBatchAllocationsTableQuery);
    await pool.query(createLedgerEntriesTableQuery);
    await pool.query(createBillAllocationsTableQuery);
  } catch (err) {
    throw new Error('Error creating voucher tables: ' + err.message);
  }
}

async function upsertVoucher(vouchers) {
  await createVoucherTable();

  const sqlInsertVoucher = `
    INSERT INTO voucher (companyid, guid, alterid, voucher_number, date, reference_number, reference_date, party_name, voucher_type, Voucher_Total, place_of_supply, is_invoice, narration)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      companyid = VALUES(companyid),
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

  const sqlInsertInventoryEntries = `
    INSERT INTO inventory_entries (guid, voucher_guid, item, quantity, rate, amount, discount_percent, godown, batch_name, additional_amount, tracking_number, order_number, order_duedate)
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
      order_duedate = VALUES(order_duedate);
  `;

  const sqlInsertBatchAllocations = `
    INSERT INTO batch_allocations (guid, inventory_entry_guid, item, name, godown, quantity, amount, tracking_number)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      item = VALUES(item),
      name = VALUES(name),
      godown = VALUES(godown),
      quantity = VALUES(quantity),
      amount = VALUES(amount),
      tracking_number = VALUES(tracking_number);
  `;

  const sqlInsertLedgerEntries = `
    INSERT INTO ledger_entries (guid, voucher_guid, ledger_name, amount, group_name, is_deemed_positive, is_party_ledger, gst_rate, hsn_code, cess_rate)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      ledger_name = VALUES(ledger_name),
      amount = VALUES(amount),
      group_name = VALUES(group_name),
      is_deemed_positive = VALUES(is_deemed_positive),
      is_party_ledger = VALUES(is_party_ledger),
      gst_rate = VALUES(gst_rate),
      hsn_code = VALUES(hsn_code),
      cess_rate = VALUES(cess_rate);
  `;

  const sqlInsertBillAllocations = `
    INSERT INTO bill_allocations (guid, ledger_entry_guid, ledger, billtype, name, amount)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      ledger = VALUES(ledger),
      billtype = VALUES(billtype),
      name = VALUES(name),
      amount = VALUES(amount);
  `;

  const voucherValues = vouchers.map(voucher => [
    voucher.companyid,
    voucher.guid,
    voucher.alterid || 0,
    voucher.voucher_number || '',
    voucher.date || null,
    voucher.reference_number || '',
    voucher.reference_date || null,
    voucher.party_name || '',
    voucher.voucher_type || '',
    parseFloat(voucher.Voucher_Total) || 0,
    voucher.place_of_supply || '',
    voucher.is_invoice || 'No',
    voucher.narration || ''
  ]);

  const inventoryEntriesValues = [];
  const batchAllocationsValues = [];
  const ledgerEntriesValues = [];
  const billAllocationsValues = [];

  vouchers.forEach(voucher => {
    if (voucher.InventoryEntries && Array.isArray(voucher.InventoryEntries)) {
      voucher.InventoryEntries.forEach(entry => {
        const entryGuid = entry.guid || uuidv4();
        inventoryEntriesValues.push([
          entryGuid,
          voucher.guid,
          entry.item || '',
          parseFloat(entry.quantity) || 0,
          parseFloat(entry.Rate) || 0,
          parseFloat(entry.amount) || 0,
          parseFloat(entry.DiscountPercent) || 0,
          entry.godown || '',
          entry.BatchName || '',
          parseFloat(entry.additional_amount) || 0,
          entry.tracking_number || '',
          entry.order_number || '',
          entry.order_duedate || null
        ]);

        if (entry.BatchAllocations && Array.isArray(entry.BatchAllocations)) {
          entry.BatchAllocations.forEach(batch => {
            batchAllocationsValues.push([
              batch.guid || uuidv4(),
              entryGuid,
              batch.item || '',
              batch.name || '',
              batch.godown || '',
              parseFloat(batch.quantity) || 0,
              parseFloat(batch.amount) || 0,
              batch.tracking_number || ''
            ]);
          });
        }
      });
    }

    if (voucher.ledgerentries && Array.isArray(voucher.ledgerentries)) {
      voucher.ledgerentries.forEach(entry => {
        const ledgerEntryGuid = uuidv4();
        ledgerEntriesValues.push([
          ledgerEntryGuid,
          voucher.guid,
          entry.LedgerName || '',
          parseFloat(entry.Amount) || 0,
          entry.GroupName || '',
          entry.IsDeemedPositive || 'No',
          entry.IsPartyLedger || 'No',
          entry.GSTRate || '',
          entry.HSNCode || '',
          entry.Cess_Rate || ''
        ]);

        if (entry.BillAllocations && Array.isArray(entry.BillAllocations)) {
          entry.BillAllocations.forEach(bill => {
            billAllocationsValues.push([
              uuidv4(),
              ledgerEntryGuid,
              bill.ledger || '',
              bill.billtype || '',
              bill.name || '',
              parseFloat(bill.amount) || 0
            ]);
          });
        }
      });
    }
  });

  try {
    const pool = await db();
    await pool.query(sqlInsertVoucher, [voucherValues]);
    if (inventoryEntriesValues.length > 0) {
      await pool.query(sqlInsertInventoryEntries, [inventoryEntriesValues]);
    }
    if (batchAllocationsValues.length > 0) {
      await pool.query(sqlInsertBatchAllocations, [batchAllocationsValues]);
    }
    if (ledgerEntriesValues.length > 0) {
      await pool.query(sqlInsertLedgerEntries, [ledgerEntriesValues]);
    }
    if (billAllocationsValues.length > 0) {
      await pool.query(sqlInsertBillAllocations, [billAllocationsValues]);
    }
  } catch (err) {
    throw new Error('Error upserting voucher data: ' + err.message);
  }
};

module.exports = { upsertVoucher };
