const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Function to generate a consistent GUID based on the content of the entry
function generateConsistentGuid(entry) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(entry));
  return hash.digest('hex');
}

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

  const createCategoryAllocationTableQuery = `
    CREATE TABLE IF NOT EXISTS category_allocation (
      guid VARCHAR(255) PRIMARY KEY,
      ledger_entry_guid VARCHAR(255),
      Name VARCHAR(255),
      Amount DECIMAL(15, 2),
      FOREIGN KEY (ledger_entry_guid) REFERENCES ledger_entries(guid) ON DELETE CASCADE
    )
  `;

  const createCostCentreAllocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS costcentre_allocations (
      guid VARCHAR(255) PRIMARY KEY,
      category_allocation_guid VARCHAR(255),
      ledger VARCHAR(255),
      costcentre VARCHAR(255),
      Amount DECIMAL(15, 2),
      FOREIGN KEY (category_allocation_guid) REFERENCES category_allocation(guid) ON DELETE CASCADE
    )
  `;

  try {
    const pool = await db();
    await pool.query(createVoucherTableQuery);
    await pool.query(createInventoryEntriesTableQuery);
    await pool.query(createBatchAllocationsTableQuery);
    await pool.query(createLedgerEntriesTableQuery);
    await pool.query(createBillAllocationsTableQuery);
    await pool.query(createCategoryAllocationTableQuery); // Added execution for category_allocation
    await pool.query(createCostCentreAllocationsTableQuery); // Added execution for costcentre_allocations
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

  const sqlInsertCategoryAllocation = `
    INSERT INTO category_allocation (guid, ledger_entry_guid, Name, Amount)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      Name = VALUES(Name),
      Amount = VALUES(Amount);
  `;

  const sqlInsertCostCentreAllocations = `
    INSERT INTO costcentre_allocations (guid, category_allocation_guid, ledger, costcentre, Amount)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      ledger = VALUES(ledger),
      costcentre = VALUES(costcentre),
      Amount = VALUES(Amount);
  `;

  const voucherValues = vouchers.map(voucher => [
    voucher.companyid,
    voucher.guid,
    voucher.alterid,
    voucher.voucher_number,
    voucher.date,
    voucher.reference_number || '',
    voucher.reference_date || null,
    voucher.party_name || '',
    voucher.voucher_type || '',
    parseFloat(voucher.Voucher_Total) || 0,
    voucher.place_of_supply || '',
    voucher.is_invoice || '',
    voucher.narration || ''
  ]);

  const inventoryEntriesValues = [];
  const batchAllocationsValues = [];
  const ledgerEntriesValues = [];
  const billAllocationsValues = [];
  const CategoryAllocationValues = [];
  const CostCentreAllocationsValues = [];

  vouchers.forEach(voucher => {
    if (voucher.InventoryEntries && Array.isArray(voucher.InventoryEntries)) {
      voucher.InventoryEntries.forEach(entry => {
        const entryGuid = generateConsistentGuid({
          voucher_guid: voucher.guid,
          item: entry.item,
          quantity: entry.quantity,
          rate: entry.Rate,
          amount: entry.amount,
          discount_percent: entry.DiscountPercent,
          godown: entry.godown,
          batch_name: entry.BatchName,
          additional_amount: entry.additional_amount,
          tracking_number: entry.tracking_number,
          order_number: entry.order_number,
          order_duedate: entry.order_duedate
        });

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
            const batchGuid = generateConsistentGuid({
              inventory_entry_guid: entryGuid,
              item: batch.item,
              name: batch.name,
              godown: batch.godown,
              quantity: batch.quantity,
              amount: batch.amount,
              tracking_number: batch.tracking_number
            });

            batchAllocationsValues.push([
              batchGuid,
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
        const ledgerEntryGuid = generateConsistentGuid({
          voucher_guid: voucher.guid,
          ledger_name: entry.LedgerName,
          amount: entry.Amount,
          group_name: entry.GroupName,
          is_deemed_positive: entry.IsDeemedPositive,
          is_party_ledger: entry.IsPartyLedger,
          gst_rate: entry.GSTRate,
          hsn_code: entry.HSNCode,
          cess_rate: entry.Cess_Rate
        });

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
            const billGuid = generateConsistentGuid({
              ledger_entry_guid: ledgerEntryGuid,
              ledger: bill.ledger,
              billtype: bill.billtype,
              name: bill.name,
              amount: bill.amount
            });

            billAllocationsValues.push([
              billGuid,
              ledgerEntryGuid,
              bill.ledger || '',
              bill.billtype || '',
              bill.name || '',
              parseFloat(bill.amount) || 0
            ]);
          });
        }

        if (entry.CategoryAllocation && Array.isArray(entry.CategoryAllocation)) {
          entry.CategoryAllocation.forEach(category => {
            const categoryGuid = generateConsistentGuid({
              ledger_entry_guid: ledgerEntryGuid,
              Name: category.Name,
              Amount: category.Amount
            });

            CategoryAllocationValues.push([
              categoryGuid,
              ledgerEntryGuid,
              category.Name || '',
              parseFloat(category.Amount) || 0
            ]);

            if (category.CostCentreAllocations && Array.isArray(category.CostCentreAllocations)) {
              category.CostCentreAllocations.forEach(costCentre => {
                const costCentreGuid = generateConsistentGuid({
                  category_allocation_guid: categoryGuid,
                  ledger: costCentre.ledger,
                  costcentre: costCentre.costcentre,
                  Amount: costCentre.Amount
                });

                CostCentreAllocationsValues.push([
                  costCentreGuid,
                  categoryGuid,
                  costCentre.ledger || '',
                  costCentre.costcentre || '',
                  parseFloat(costCentre.Amount) || 0
                ]);
              });
            }
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
    if (CategoryAllocationValues.length > 0) {
      await pool.query(sqlInsertCategoryAllocation, [CategoryAllocationValues]);
    }
    if (CostCentreAllocationsValues.length > 0) {
      await pool.query(sqlInsertCostCentreAllocations, [CostCentreAllocationsValues]);
    }
  } catch (err) {
    throw new Error('Error upserting voucher data: ' + err.message);
  }
}

module.exports = { upsertVoucher };
