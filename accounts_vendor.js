/**
 * MODULE 11 - ACCOUNTS & VENDORS FULL ENGINE
 * Includes: Resilient Supabase Sync, Real-time KPIs, Filter/Search, Statement Printing
 */

function getDb() {
  return window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

window.accState = {
  rawEntries: [],
  filteredEntries: []
};

// Resilient insert helper supporting column fallback across accounts tables
window.safeInsertAccounts = async function(payload) {
  const db = getDb();
  if (!db) return { error: { message: "Database client missing" } };

  const fullPayload = {
    id: payload.id || ('ACC-' + Date.now()),
    type: payload.type || 'Expense Outflow',
    title: payload.title || payload.company_name || 'Transaction Entry',
    category: payload.category || 'General',
    amount: parseFloat(payload.amount || 0),
    status: payload.status || 'Paid',
    mode: payload.mode || 'Cash',
    created_at: payload.created_at || new Date().toISOString()
  };

  let { data, error } = await db.from('accounts_vendors').insert([fullPayload]);
  if (!error) return { data, error: null };

  // Fallback for schema mismatches
  const minimalPayload = {
    id: fullPayload.id,
    title: fullPayload.title,
    category: fullPayload.category,
    amount: fullPayload.amount,
    created_at: fullPayload.created_at
  };

  let res = await db.from('accounts_vendors').insert([minimalPayload]);
  if (res.error) {
    res = await db.from('accounts_ledger').insert([minimalPayload]);
  }
  return res;
};

// Inject Record Entry Modal into DOM
function ensureAccountsModals() {
  let container = document.getElementById('acc-modals-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'acc-modals-container';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div id="modal-record-ledger" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 500px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid #334155; padding-bottom: 0.8rem;">
          <h3 style="color: white; margin: 0; font-size: 1.15rem;">+ Record Expense / Vendor Entry</h3>
          <button type="button" onclick="window.closeRecordLedgerModal()" style="background: none; border: none; color: #ef4444; font-size: 1.5rem; cursor: pointer; font-weight: bold;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">ENTRY TYPE *</label>
            <select id="ldr-type" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Expense Outflow">Expense Outflow</option>
              <option value="Income Inflow">Income Inflow</option>
              <option value="Vendor Registration">Vendor Registration</option>
            </select>
          </div>
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">AMOUNT (₹)</label>
            <input type="number" step="0.01" id="ldr-amount" placeholder="0.00" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">TITLE / VENDOR NAME *</label>
          <input type="text" id="ldr-title" placeholder="e.g. Dabur India Ltd / Raw Material Purchase / Rent" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">CATEGORY</label>
            <select id="ldr-cat" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Raw Materials">Raw Materials</option>
              <option value="Procurement">Procurement</option>
              <option value="Utilities & Rent">Utilities & Rent</option>
              <option value="Clinical Services">Clinical Services</option>
              <option value="General Expense">General Expense</option>
            </select>
          </div>
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">STATUS</label>
            <select id="ldr-status" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="window.closeRecordLedgerModal()" style="padding: 0.6rem 1.2rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px; font-weight: 500;">Cancel</button>
          <button type="button" onclick="window.saveAccountsEntry()" style="background: #ea580c; color: white; padding: 0.6rem 1.2rem; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Save Entry</button>
        </div>
      </div>
    </div>
  `;
}

// Modal Controllers
window.openRecordLedgerModal = function() {
  ensureAccountsModals();
  if (document.getElementById('ldr-title')) document.getElementById('ldr-title').value = '';
  if (document.getElementById('ldr-amount')) document.getElementById('ldr-amount').value = '';
  const m = document.getElementById('modal-record-ledger');
  if (m) m.style.display = 'flex';
};
window.closeRecordLedgerModal = function() {
  const m = document.getElementById('modal-record-ledger');
  if (m) m.style.display = 'none';
};

// Save Entry Function
window.saveAccountsEntry = async function() {
  const type = document.getElementById('ldr-type')?.value || 'Expense Outflow';
  const title = document.getElementById('ldr-title')?.value?.trim();
  const amount = parseFloat(document.getElementById('ldr-amount')?.value || 0);
  const category = document.getElementById('ldr-cat')?.value || 'General';
  const status = document.getElementById('ldr-status')?.value || 'Paid';

  if (!title) return alert("Please enter title or vendor name.");

  const { error } = await window.safeInsertAccounts({
    type: type,
    title: title,
    category: category,
    amount: amount,
    status: status
  });

  if (error) return alert("Save Error: " + error.message);

  alert("Record saved successfully!");
  window.closeRecordLedgerModal();
  window.loadAccountsData();
};

// Data Fetching & Dashboard Update
window.loadAccountsData = async function() {
  const db = getDb();
  if (!db || typeof db.from !== 'function') return;

  try {
    let { data: rows, error } = await db.from('accounts_vendors').select('*').order('created_at', { ascending: false });
    if (error) {
      const fallback = await db.from('accounts_ledger').select('*').order('created_at', { ascending: false });
      rows = fallback.data || [];
    }

    window.accState.rawEntries = rows || [];
    window.applyAccountsFilters();
  } catch (err) {
    console.error("Accounts load exception:", err);
  }
};

// Filter & KPI Calculation Logic
window.applyAccountsFilters = function() {
  const search = (document.getElementById('acc-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('acc-filter-type')?.value || 'all';
  const periodFilter = document.getElementById('acc-filter-period')?.value || 'all';
  const now = new Date();

  let filtered = (window.accState.rawEntries || []).filter(item => {
    const titleText = (item.title || item.company_name || item.particulars || '').toLowerCase();
    const catText = (item.category || '').toLowerCase();
    const itemType = (item.type || 'Expense Outflow').toLowerCase();

    if (search && !titleText.includes(search) && !catText.includes(search)) return false;

    if (typeFilter === 'debit' && !itemType.includes('outflow') && !itemType.includes('expense')) return false;
    if (typeFilter === 'credit' && !itemType.includes('inflow') && !itemType.includes('income') && !itemType.includes('vendor')) return false;

    if (periodFilter !== 'all') {
      const itemDate = new Date(item.created_at || Date.now());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (periodFilter === 'today' && itemDate < todayStart) return false;
      if (periodFilter === 'this_week') {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        if (itemDate < weekStart) return false;
      }
      if (periodFilter === 'this_month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < monthStart) return false;
      }
    }
    return true;
  });

  window.accState.filteredEntries = filtered;
  window.renderAccountsTable();
};

// Table Renderer & KPI Updates
window.renderAccountsTable = function() {
  let income = 0, expense = 0;
  
  (window.accState.rawEntries || []).forEach(r => {
    const typeStr = (r.type || 'Expense').toLowerCase();
    const amt = parseFloat(r.amount || 0);
    if (typeStr.includes('outflow') || typeStr.includes('expense')) {
      expense += amt;
    } else {
      income += amt;
    }
  });

  if (document.getElementById('kpi-income')) document.getElementById('kpi-income').innerText = '₹' + income.toFixed(2);
  if (document.getElementById('kpi-expense')) document.getElementById('kpi-expense').innerText = '₹' + expense.toFixed(2);
  
  const netEl = document.getElementById('kpi-net');
  if (netEl) {
    const net = income - expense;
    netEl.innerText = '₹' + net.toFixed(2);
    netEl.style.color = net >= 0 ? '#10b981' : '#ef4444';
  }

  const tb = document.getElementById('tbody-accounts') || 
             document.querySelector('#mod-accounts table tbody') || 
             document.querySelector('table tbody');

  if (!tb) return;

  const rows = window.accState.filteredEntries;
  if (!rows || rows.length === 0) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No transaction or vendor records found for selected filters.</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(r => {
    const typeStr = (r.type || 'Expense').toLowerCase();
    const isOutflow = typeStr.includes('outflow') || typeStr.includes('expense');

    const typeBadge = isOutflow
      ? `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">${r.type || 'Expense Outflow'}</span>`
      : `<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">${r.type || 'Income / Vendor'}</span>`;

    const statusColor = (r.status || 'Paid').toLowerCase() === 'paid' ? '#10b981' : '#f59e0b';

    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: white;">
        <td style="padding: 0.65rem;">${typeBadge}</td>
        <td style="padding: 0.65rem; font-weight: bold;">${r.title || r.company_name || r.particulars || '-'}</td>
        <td style="padding: 0.65rem; color: #cbd5e1;">${r.category || '-'}</td>
        <td style="padding: 0.65rem; font-weight: bold; color: ${isOutflow ? '#ef4444' : '#10b981'};">₹${parseFloat(r.amount || 0).toFixed(2)}</td>
        <td style="padding: 0.65rem;"><span style="color: ${statusColor}; font-weight: bold; font-size: 0.85rem;">${r.status || 'Paid'}</span></td>
      </tr>
    `;
  }).join('');
};

// Print Statement Functionality
window.printAccountsStatement = function() {
  const data = window.accState.filteredEntries || [];
  if (data.length === 0) return alert("No transactions available to print under current filters.");

  let printRows = '';
  let totalDebit = 0, totalCredit = 0;

  data.forEach(d => {
    const typeStr = (d.type || 'Expense').toLowerCase();
    const isOutflow = typeStr.includes('outflow') || typeStr.includes('expense');
    const amt = parseFloat(d.amount || 0);

    if (isOutflow) totalDebit += amt; else totalCredit += amt;

    printRows += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(d.created_at || Date.now()).toLocaleDateString()}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${isOutflow ? '#dc2626' : '#16a34a'};">${d.type || 'Transaction'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${d.title || d.company_name || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${d.category || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">₹${amt.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${d.status || 'Paid'}</td>
      </tr>
    `;
  });

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>Accounts Ledger Statement</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f3f4f6; border: 1px solid #ddd; padding: 10px; text-align: left; }
          .summary { margin-top: 20px; font-size: 1.1rem; font-weight: bold; background: #f8fafc; padding: 15px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h2>AASU AROGYAM ERP - Financial Ledger Statement</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Title / Vendor</th><th>Category</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>${printRows}</tbody>
        </table>
        <div class="summary">
          Total Inflow: ₹${totalCredit.toFixed(2)} | Total Outflow: ₹${totalDebit.toFixed(2)} | Net Balance: ₹${(totalCredit - totalDebit).toFixed(2)}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};

// Module 7 Billing Sync Listener
window.syncBillToAccounts = async function(billData) {
  if (!billData || !billData.amount) return;
  const amt = parseFloat(billData.amount || 0);
  if (isNaN(amt) || amt <= 0) return;

  await window.safeInsertAccounts({
    type: 'Income Inflow',
    title: `Patient Bill #${billData.invoice_no || 'INV'} (${billData.patient_name || 'Patient'})`,
    category: 'Patient Billing',
    amount: amt,
    status: 'Paid'
  });
  window.loadAccountsData();
};

window.loadAccounts = window.loadAccountsData;

document.addEventListener('DOMContentLoaded', () => {
  ensureAccountsModals();
  setTimeout(window.loadAccountsData, 400);
});