/**
 * MODULE 11 - ACCOUNTS & VENDORS FULL ENGINE
 * Features: Financial Ledger, Structured Vendor Directory (GSTIN, Phone, Address), KPIs & Print
 */

function getDb() {
  return window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

window.accState = {
  rawEntries: [],
  filteredEntries: []
};

// Resilient insert helper supporting full vendor & financial schema
window.safeInsertAccounts = async function(payload) {
  const db = getDb();
  if (!db) return { error: { message: "Database client missing" } };

  const fullPayload = {
    id: payload.id || ('ACC-' + Date.now()),
    type: payload.type || 'Expense Outflow',
    title: payload.title || payload.company_name || 'Transaction Entry',
    company_name: payload.company_name || payload.title || '',
    category: payload.category || 'General',
    amount: parseFloat(payload.amount || 0),
    mobile: payload.mobile || '',
    email: payload.email || '',
    gst_no: payload.gst_no || '',
    address: payload.address || '',
    status: payload.status || 'Active',
    mode: payload.mode || 'Cash',
    created_at: payload.created_at || new Date().toISOString()
  };

  let { data, error } = await db.from('accounts_vendors').insert([fullPayload]);
  if (!error) return { data, error: null };

  // Schema fallback for missing optional columns
  const minimalPayload = {
    id: fullPayload.id,
    title: fullPayload.title,
    category: fullPayload.category,
    amount: fullPayload.amount,
    status: fullPayload.status,
    created_at: fullPayload.created_at
  };

  let res = await db.from('accounts_vendors').insert([minimalPayload]);
  if (res.error) {
    res = await db.from('accounts_ledger').insert([minimalPayload]);
  }
  return res;
};

// Inject Extended Vendor & Expense Entry Modal into DOM
function ensureAccountsModals() {
  let container = document.getElementById('acc-modals-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'acc-modals-container';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div id="modal-record-ledger" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 560px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid #334155; padding-bottom: 0.8rem;">
          <h3 style="color: white; margin: 0; font-size: 1.15rem;">+ Record Expense / Vendor Directory Entry</h3>
          <button type="button" onclick="window.closeRecordLedgerModal()" style="background: none; border: none; color: #ef4444; font-size: 1.5rem; cursor: pointer; font-weight: bold;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">ENTRY TYPE *</label>
            <select id="ldr-type" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Vendor Registration">Vendor Registration</option>
              <option value="Expense Outflow">Expense Outflow</option>
              <option value="Income Inflow">Income Inflow</option>
            </select>
          </div>
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">CATEGORY</label>
            <select id="ldr-cat" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Raw Material Supplier">Raw Material Supplier</option>
              <option value="Herbal Pharma">Herbal Pharma</option>
              <option value="Equipment & Instruments">Equipment & Instruments</option>
              <option value="Clinical Services">Clinical Services</option>
              <option value="Maintenance & Utilities">Maintenance & Utilities</option>
              <option value="General Vendor">General Vendor</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">COMPANY / VENDOR NAME / TITLE *</label>
          <input type="text" id="ldr-title" placeholder="e.g. Dabur India Ltd / Apex Lab Supplies / Electricity Bill" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>

        <!-- Vendor Directory Specific Fields -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">MOBILE NUMBER</label>
            <input type="text" id="ldr-mobile" placeholder="e.g. 9876543210" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">EMAIL ID</label>
            <input type="email" id="ldr-email" placeholder="vendor@example.com" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">GSTIN / TAX NO.</label>
            <input type="text" id="ldr-gst" placeholder="e.g. 21AAAAA0000A1Z5" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div>
            <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">AMOUNT (₹) / OPENING BAL</label>
            <input type="number" step="0.01" id="ldr-amount" placeholder="0.00" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">BUSINESS ADDRESS</label>
          <textarea id="ldr-address" rows="2" placeholder="Full address..." style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">STATUS</label>
          <select id="ldr-status" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="Active">Active</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
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
  if (document.getElementById('ldr-mobile')) document.getElementById('ldr-mobile').value = '';
  if (document.getElementById('ldr-email')) document.getElementById('ldr-email').value = '';
  if (document.getElementById('ldr-gst')) document.getElementById('ldr-gst').value = '';
  if (document.getElementById('ldr-address')) document.getElementById('ldr-address').value = '';
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
  const type = document.getElementById('ldr-type')?.value || 'Vendor Registration';
  const title = document.getElementById('ldr-title')?.value?.trim();
  const category = document.getElementById('ldr-cat')?.value || 'General Vendor';
  const mobile = document.getElementById('ldr-mobile')?.value?.trim() || '';
  const email = document.getElementById('ldr-email')?.value?.trim() || '';
  const gst = document.getElementById('ldr-gst')?.value?.trim() || '';
  const address = document.getElementById('ldr-address')?.value?.trim() || '';
  const amount = parseFloat(document.getElementById('ldr-amount')?.value || 0);
  const status = document.getElementById('ldr-status')?.value || 'Active';

  if (!title) return alert("Please enter company or vendor name.");

  const { error } = await window.safeInsertAccounts({
    type: type,
    title: title,
    company_name: title,
    category: category,
    mobile: mobile,
    email: email,
    gst_no: gst,
    address: address,
    amount: amount,
    status: status
  });

  if (error) return alert("Save Error: " + error.message);

  alert("Vendor / Expense record saved successfully!");
  window.closeRecordLedgerModal();
  window.loadAccountsData();
};

// Data Fetching
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

// Filter & Search Logic
window.applyAccountsFilters = function() {
  const search = (document.getElementById('acc-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('acc-filter-type')?.value || 'all';
  const periodFilter = document.getElementById('acc-filter-period')?.value || 'all';
  const now = new Date();

  let filtered = (window.accState.rawEntries || []).filter(item => {
    const titleText = (item.title || item.company_name || '').toLowerCase();
    const catText = (item.category || '').toLowerCase();
    const gstText = (item.gst_no || '').toLowerCase();
    const mobileText = (item.mobile || '').toLowerCase();
    const itemType = (item.type || '').toLowerCase();

    if (search && !titleText.includes(search) && !catText.includes(search) && !gstText.includes(search) && !mobileText.includes(search)) return false;

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

// Table Renderer with Contact & GSTIN details for Vendors
window.renderAccountsTable = function() {
  let income = 0, expense = 0;
  
  (window.accState.rawEntries || []).forEach(r => {
    const typeStr = (r.type || 'Expense').toLowerCase();
    const amt = parseFloat(r.amount || 0);
    if (typeStr.includes('outflow') || typeStr.includes('expense')) {
      expense += amt;
    } else if (typeStr.includes('inflow') || typeStr.includes('income')) {
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
    tb.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No records found. Click + Record Expense / Vendor Directory Entry to add one.</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(r => {
    const typeStr = (r.type || 'Vendor Registration').toLowerCase();
    const isOutflow = typeStr.includes('outflow') || typeStr.includes('expense');

    let typeBadge = `<span style="background: rgba(245,158,11,0.2); color: #f59e0b; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Vendor Directory</span>`;
    if (isOutflow) {
      typeBadge = `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Expense Outflow</span>`;
    } else if (typeStr.includes('inflow') || typeStr.includes('income')) {
      typeBadge = `<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Income Inflow</span>`;
    }

    const contactMeta = [
      r.mobile ? `📞 ${r.mobile}` : '',
      r.email ? `✉️ ${r.email}` : '',
      r.gst_no ? `GST: <span style="color:#f59e0b; font-family:monospace;">${r.gst_no}</span>` : ''
    ].filter(Boolean).join(' | ');

    const titleDisplay = `
      <div style="font-weight: bold;">${r.title || r.company_name || '-'}</div>
      ${contactMeta ? `<div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.2rem;">${contactMeta}</div>` : ''}
    `;

    const statusColor = (r.status || 'Active').toLowerCase() === 'paid' || (r.status || '').toLowerCase() === 'active' ? '#10b981' : '#f59e0b';

    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: white;">
        <td style="padding: 0.65rem;">${typeBadge}</td>
        <td style="padding: 0.65rem;">${titleDisplay}</td>
        <td style="padding: 0.65rem; color: #cbd5e1;">${r.category || 'General Vendor'}</td>
        <td style="padding: 0.65rem; font-weight: bold; color: ${isOutflow ? '#ef4444' : '#10b981'};">₹${parseFloat(r.amount || 0).toFixed(2)}</td>
        <td style="padding: 0.65rem;"><span style="color: ${statusColor}; font-weight: bold; font-size: 0.85rem;">${r.status || 'Active'}</span></td>
      </tr>
    `;
  }).join('');
};

window.loadAccounts = window.loadAccountsData;

document.addEventListener('DOMContentLoaded', () => {
  ensureAccountsModals();
  setTimeout(window.loadAccountsData, 400);
});
