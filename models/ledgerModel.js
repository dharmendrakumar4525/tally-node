const db = require('../config/db');

async function createLedgerTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ledger (
      guid VARCHAR(255) PRIMARY KEY,
      alterid VARCHAR(255),
      name VARCHAR(255),
      parent VARCHAR(255),
      alias VARCHAR(255),
      is_revenue VARCHAR(10),
      is_deemedpositive VARCHAR(10),
      opening_balance DECIMAL(15, 2),
      description TEXT,
      mailing_name VARCHAR(255),
      mailing_address TEXT,
      mailing_state VARCHAR(255),
      mailing_country VARCHAR(255),
      mailing_pincode VARCHAR(20),
      email VARCHAR(255),
      it_pan VARCHAR(20),
      gstn VARCHAR(20),
      gst_registration_type VARCHAR(50),
      gst_supply_type VARCHAR(50),
      gst_duty_head VARCHAR(50),
      tax_rate DECIMAL(5, 2),
      bank_account_holder VARCHAR(255),
      bank_account_number VARCHAR(255),
      bank_ifsc VARCHAR(20),
      bank_swift VARCHAR(20),
      bank_name VARCHAR(255),
      bank_branch VARCHAR(255)
    )
  `;

  const createBillAllocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS bill_allocation (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ledger_guid VARCHAR(255),
      bill_date DATE,
      name VARCHAR(255),
      opening_balance DECIMAL(15, 2),
      FOREIGN KEY (ledger_guid) REFERENCES ledger(guid) ON DELETE CASCADE
    )
  `;

  try {
    const pool = await db();
    await pool.query(createTableQuery);
    await pool.query(createBillAllocationsTableQuery);
  } catch (err) {
    throw new Error('Error creating ledger table: ' + err.message);
  }
}

exports.upsertLedger = async (ledgers) => {
  await createLedgerTable();

  const sqlInsertLedger = `
    INSERT INTO ledger (guid, alterid, name, parent, alias, is_revenue, is_deemedpositive, opening_balance, description, mailing_name, mailing_address, mailing_state, mailing_country, mailing_pincode, email, it_pan, gstn, gst_registration_type, gst_supply_type, gst_duty_head, tax_rate, bank_account_holder, bank_account_number, bank_ifsc, bank_swift, bank_name, bank_branch)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      alterid = VALUES(alterid),
      name = VALUES(name),
      parent = VALUES(parent),
      alias = VALUES(alias),
      is_revenue = VALUES(is_revenue),
      is_deemedpositive = VALUES(is_deemedpositive),
      opening_balance = VALUES(opening_balance),
      description = VALUES(description),
      mailing_name = VALUES(mailing_name),
      mailing_address = VALUES(mailing_address),
      mailing_state = VALUES(mailing_state),
      mailing_country = VALUES(mailing_country),
      mailing_pincode = VALUES(mailing_pincode),
      email = VALUES(email),
      it_pan = VALUES(it_pan),
      gstn = VALUES(gstn),
      gst_registration_type = VALUES(gst_registration_type),
      gst_supply_type = VALUES(gst_supply_type),
      gst_duty_head = VALUES(gst_duty_head),
      tax_rate = VALUES(tax_rate),
      bank_account_holder = VALUES(bank_account_holder),
      bank_account_number = VALUES(bank_account_number),
      bank_ifsc = VALUES(bank_ifsc),
      bank_swift = VALUES(bank_swift),
      bank_name = VALUES(bank_name),
      bank_branch = VALUES(bank_branch);
  `;

  const sqlInsertBillAllocation = `
    INSERT INTO bill_allocation (ledger_guid, bill_date, name, opening_balance)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      bill_date = VALUES(bill_date),
      opening_balance = VALUES(opening_balance);
  `;

  const ledgerValues = ledgers.map(ledger => [
    ledger.guid,
    ledger.alterid || '',
    ledger.name || '',
    ledger.parent || '',
    ledger.alias || '',
    ledger.is_revenue || 'No',
    ledger.is_deemedpositive || 'No',
    parseFloat(ledger.opening_balance.replace(/,/g, '')) || 0,
    ledger.description || '',
    ledger.mailing_name || '',
    ledger.mailing_address || '',
    ledger.mailing_state || '',
    ledger.mailing_country || '',
    ledger.mailing_pincode || '',
    ledger.email || '',
    ledger.it_pan || '',
    ledger.gstn || '',
    ledger.gst_registration_type || '',
    ledger.gst_supply_type || '',
    ledger.gst_duty_head || '',
    parseFloat(ledger.tax_rate) || 0,
    ledger.bank_account_holder || '',
    ledger.bank_account_number || '',
    ledger.bank_ifsc || '',
    ledger.bank_swift || '',
    ledger.bank_name || '',
    ledger.bank_branch || ''
  ]);

  const billAllocationValues = [];
  ledgers.forEach(ledger => {
    if (ledger.BillAllocations && Array.isArray(ledger.BillAllocations)) {
      ledger.BillAllocations.forEach(bill => {
        billAllocationValues.push([
          ledger.guid,
          bill.bill_date,
          bill.name,
          parseFloat(bill.opening_balance) || 0
        ]);
      });
    }
  });

  try {
    const pool = await db();
    await pool.query(sqlInsertLedger, [ledgerValues]);
    if (billAllocationValues.length > 0) {
      await pool.query(sqlInsertBillAllocation, [billAllocationValues]);
    }
  } catch (err) {
    throw new Error('Error upserting ledger data: ' + err.message);
  }
};
