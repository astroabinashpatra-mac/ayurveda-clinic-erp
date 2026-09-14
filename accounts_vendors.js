
// Safe helper to insert records into accounts_vendors regardless of table schema
window.safeInsertAccounts = async function(payload) {
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db) return { error: { message: "Database client missing" } };

  // First try inserting full payload
  let { data, error } = await window.safeInsertAccounts(payload);
  
  // Fallback if 'type' column doesn't exist in table schema
  if (error && (error.message.includes('type') || error.code === '42703')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.type;
    delete fallbackPayload.mode;
    return await db.from('accounts_vendors').insert([fallbackPayload]);
  }
  return { data, error };
};

// ==========================================
// MODULE 11: ACCOUNTS & VENDORS FULL ENGINE
// ==========================================

window.accState = {
  vendors: [],
  ledger: [],
  filteredLedger: [],
  filteredVendors: []
};

// --- MODAL INJECTOR ---
function ensureAccountsModals() {
  let container = document.getElementById('acc-modals-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'acc-modals-container';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <!-- MODAL: REGISTER VENDOR -->
    <div id="modal-register-vendor" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 520px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid #334155; padding-bottom: 0.8rem;">
          <h3 style="color: white; margin: 0; font-size: 1.15rem;">+ Register Supplier / Vendor</h3>
          <button onclick="window.closeRegisterVendorModal()" style="background: none; border: none; color: #9ca3af; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label for="vnd-name" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">Company / Vendor Name *</label>
          <input name="vnd-name"   type="text" id="vnd-name" placeholder="e.g. Dabur India Ltd / Apex Lab Supplies" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label for="vnd-cat" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">Category</label>
            <select name="vnd-cat"   id="vnd-cat" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
              <option value="Raw Material Supplier">Raw Material Supplier</option>
              <option value="Herbal Pharma">Herbal Pharma</option>
              <option value="Equipment & Instruments">Equipment & Instruments</option>
              <option value="Clinical Services">Clinical Services</option>
              <option value="Maintenance & Utilities">Maintenance & Utilities</option>
              <option value="General Vendor">General Vendor</option>
            </select>
          </div>
          <div>
            <label for="vnd-mobile" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">Mobile Number *</label>
            <input name="vnd-mobile"   type="text" id="vnd-mobile" placeholder="e.g. 9876543210" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label for="vnd-email" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">Email ID</label>
            <input name="vnd-email"   type="email" id="vnd-email" placeholder="vendor@example.com" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div>
            <label for="vnd-gst" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">GST No.</label>
            <input name="vnd-gst"   type="text" id="vnd-gst" placeholder="e.g. 21AAAAA0000A1Z5" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label for="vnd-address" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">Address</label>
          <textarea name="vnd-address"   id="vnd-address" rows="2" placeholder="Full business address..." style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="window.closeRegisterVendorModal()" style="padding: 0.6rem 1.2rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px; font-weight: 500;">Cancel</button>
          <button onclick="window.saveVendor()" style="background: #ea580c; color: white; padding: 0.6rem 1.2rem; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Save Vendor</button>
        </div>
      </div>
    </div>

    <!-- MODAL: RECORD LEDGER ENTRY -->
    <div id="modal-record-ledger" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 500px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid #334155; padding-bottom: 0.8rem;">
          <h3 style="color: white; margin: 0; font-size: 1.15rem;">Record Expense Entry</h3>
          <button onclick="window.closeRecordLedgerModal()" style="background: none; border: none; color: #9ca3af; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label for="ldr-date" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">DATE *</label>
            <input name="ldr-date"   type="date" id="ldr-date" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div>
            <label for="ldr-type" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">TYPE *</label>
            <select name="ldr-type"   id="ldr-type" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
              <option value="Expense Outflow">✓ Expense Outflow</option>
              <option value="Income Inflow">Income Inflow</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label for="ldr-particulars" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">PARTICULARS / CATEGORY *</label>
          <input name="ldr-particulars"   type="text" id="ldr-particulars" placeholder="e.g. Raw Material Purchase / Electricity Bill / Patient Fee" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <label for="ldr-amount" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">AMOUNT (₹) *</label>
            <input name="ldr-amount"   type="number" step="0.01" id="ldr-amount" placeholder="0.00" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div>
            <label for="ldr-mode" style="color: #9ca3af; font-size: 0.8rem; display: block; margin-bottom: 0.3rem;">PAYMENT MODE</label>
            <select name="ldr-mode"   id="ldr-mode" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
              <option value="Cash">Cash</option>
              <option value="UPI / Online">UPI / Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="window.closeRecordLedgerModal()" style="padding: 0.6rem 1.2rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px; font-weight: 500;">Cancel</button>
          <button onclick="window.saveLedgerEntry()" style="background: #ea580c; color: white; padding: 0.6rem 1.2rem; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Save Ledger Entry</button>
        </div>
      </div>
    </div>
  `;
}

// --- VENDOR MODAL HANDLERS ---
window.openRegisterVendorModal = function() {
  ensureAccountsModals();
  if (document.getElementById('vnd-name')) document.getElementById('vnd-name').value = '';
  if (document.getElementById('vnd-mobile')) document.getElementById('vnd-mobile').value = '';
  if (document.getElementById('vnd-email')) document.getElementById('vnd-email').value = '';
  if (document.getElementById('vnd-gst')) document.getElementById('vnd-gst').value = '';
  if (document.getElementById('vnd-address')) document.getElementById('vnd-address').value = '';
  
  const m = document.getElementById('modal-register-vendor');
  if (m) m.style.display = 'flex';
};

window.closeRegisterVendorModal = function() {
  const m = document.getElementById('modal-register-vendor');
  if (m) m.style.display = 'none';
};

// --- LEDGER MODAL HANDLERS ---
window.openRecordLedgerModal = function() {
  ensureAccountsModals();
  if (document.getElementById('ldr-date')) document.getElementById('ldr-date').value = new Date().toISOString().split('T')[0];
  if (document.getElementById('ldr-particulars')) document.getElementById('ldr-particulars').value = '';
  if (document.getElementById('ldr-amount')) document.getElementById('ldr-amount').value = '';
  
  const m = document.getElementById('modal-record-ledger');
  if (m) m.style.display = 'flex';
};

window.closeRecordLedgerModal = function() {
  const m = document.getElementById('modal-record-ledger');
  if (m) m.style.display = 'none';
};

// --- DB READ / WRITE OPERATIONS ---
window.saveVendor = async function() {
  const name = document.getElementById('vnd-name')?.value?.trim();
  const cat = document.getElementById('vnd-cat')?.value;
  const mobile = document.getElementById('vnd-mobile')?.value?.trim();
  const email = document.getElementById('vnd-email')?.value?.trim();
  const gst = document.getElementById('vnd-gst')?.value?.trim();
  const address = document.getElementById('vnd-address')?.value?.trim();

  if (!name) return alert("Please enter company / vendor name.");
  if (!mobile) return alert("Please enter mobile number.");

  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return alert("Database connection not ready.");

  const payload = {
    id: 'VND-' + Date.now(),
    company_name: name,
    category: cat,
    mobile: mobile,
    email: email || '',
    gst_no: gst || '',
    address: address || '',
    created_at: new Date().toISOString()
  };

  try {
    let { error } = await db.from('vendors').insert([payload]);
    if (error && (error.message.includes('relation') || error.code === '42P01')) {
      const altPayload = {
        id: payload.id,
        type: 'Vendor_Registration',
        title: name,
        category: cat,
        amount: 0,
        mode: mobile,
        status: gst || 'Active',
        created_at: payload.created_at
      };
      const res = await window.safeInsertAccounts(altPayload);
      error = res.error;
    }

    if (error) return alert("Save Vendor Error: " + error.message);

    alert("Vendor registered successfully!");
    window.closeRegisterVendorModal();
    window.loadVendors();
  } catch(err) {
    console.error("Save Vendor Exception:", err);
    alert("Operation failed: " + err.message);
  }
};

window.loadVendors = async function() {
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return;

  try {
    let vendors = [];
    const { data, error } = await db.from('vendors').select('*').order('created_at', { ascending: false });
    
    if (!error && data) {
      vendors = data;
    } else {
      const alt = await db.from('accounts_vendors').select('*').eq('type', 'Vendor_Registration').order('created_at', { ascending: false });
      if (alt.data) {
        vendors = alt.data.map(a => ({
          id: a.id,
          company_name: a.title,
          category: a.category,
          mobile: a.mode,
          email: '',
          gst_no: a.status,
          address: ''
        }));
      }
    }

    window.accState.vendors = vendors;
    window.renderVendorsTable();
  } catch(err) {
    console.error("Error loading vendors:", err);
  }
};

window.renderVendorsTable = function() {
  const tb = document.getElementById('tbody-vendors');
  if (!tb) return;

  const search = (document.getElementById('acc-vendor-search')?.value || '').toLowerCase();
  const rows = (window.accState.vendors || []).filter(v => {
    if (!search) return true;
    return (v.company_name || '').toLowerCase().includes(search) ||
           (v.mobile || '').includes(search) ||
           (v.gst_no || '').toLowerCase().includes(search) ||
           (v.category || '').toLowerCase().includes(search);
  });

  if (rows.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No vendors registered yet. Click + Register Vendor to add one.</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(v => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: white;">
      <td style="padding: 0.65rem; font-size: 0.8rem; color: #9ca3af;">${v.id || '-'}</td>
      <td style="padding: 0.65rem; font-weight: bold;">${v.company_name || '-'}</td>
      <td style="padding: 0.65rem;">${v.category || '-'}</td>
      <td style="padding: 0.65rem; font-size: 0.85rem;">
        📞 ${v.mobile || '-'}<br>
        <span style="color: #9ca3af;">✉️ ${v.email || '-'}</span>
      </td>
      <td style="padding: 0.65rem; font-family: monospace; color: #f59e0b;">${v.gst_no || '-'}</td>
      <td style="padding: 0.65rem; font-size: 0.85rem; color: #cbd5e1;">${v.address || '-'}</td>
      <td style="padding: 0.65rem; text-align: center;">
        <button onclick="window.deleteVendor('${v.id}')" style="background: #dc2626; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; cursor: pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
};

window.deleteVendor = async function(id) {
  if (!confirm("Delete vendor record?")) return;
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db) return alert("Database not ready.");

  await db.from('vendors').delete().eq('id', id);
  await db.from('accounts_vendors').delete().eq('id', id);
  alert("Vendor deleted!");
  window.loadVendors();
};

window.saveLedgerEntry = async function() {
  const dt = document.getElementById('ldr-date')?.value || new Date().toISOString().split('T')[0];
  const type = document.getElementById('ldr-type')?.value || 'Expense Outflow';
  const particulars = document.getElementById('ldr-particulars')?.value?.trim();
  const amount = parseFloat(document.getElementById('ldr-amount')?.value || 0);
  const mode = document.getElementById('ldr-mode')?.value || 'Cash';

  if (!particulars) return alert("Please enter particulars / category.");
  if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return alert("Database connection not ready.");

  const payload = {
    id: 'TXN-' + Date.now(),
    date: dt,
    type: type,
    title: particulars,
    category: particulars,
    amount: amount,
    mode: mode,
    status: 'Paid',
    created_at: new Date(dt).toISOString()
  };

  try {
    const { error } = await window.safeInsertAccounts(payload);
    if (error) return alert("Save Ledger Error: " + error.message);

    alert("Ledger entry saved successfully!");
    window.closeRecordLedgerModal();
    window.loadAccounts();
  } catch(err) {
    console.error("Save Ledger Exception:", err);
    alert("Operation failed: " + err.message);
  }
};

window.loadAccounts = async function() {
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return;

  try {
    const { data, error } = await db.from('accounts_vendors').select('*').order('created_at', { ascending: false });
    if (error) return console.error("Accounts Fetch Error:", error.message);

    window.accState.ledger = data || [];
    window.applyAccountsFilters();
  } catch(err) {
    console.error("Error loading accounts:", err);
  }
};

window.applyAccountsFilters = function() {
  const search = (document.getElementById('acc-ledger-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('acc-filter-type')?.value || '';
  const periodFilter = document.getElementById('acc-filter-period')?.value || 'all';
  const now = new Date();

  window.accState.filteredLedger = (window.accState.ledger || []).filter(item => {
    const titleText = (item.title || item.category || '').toLowerCase();
    if (search && !titleText.includes(search) && !(item.id || '').toLowerCase().includes(search)) return false;

    const itemType = (item.type || 'Expense Outflow').toLowerCase();
    if (typeFilter === 'debit' && !itemType.includes('outflow') && !itemType.includes('expense') && !itemType.includes('debit')) return false;
    if (typeFilter === 'credit' && !itemType.includes('inflow') && !itemType.includes('income') && !itemType.includes('credit')) return false;

    if (periodFilter !== 'all') {
      const itemDate = new Date(item.date || item.created_at || Date.now());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (periodFilter === 'today' && itemDate < todayStart) return false;
      if (periodFilter === 'yesterday') {
        const yest = new Date(todayStart); yest.setDate(yest.getDate() - 1);
        if (itemDate < yest || itemDate >= todayStart) return false;
      }
      if (periodFilter === 'this_week') {
        const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        if (itemDate < weekStart) return false;
      }
      if (periodFilter === 'last_month') {
        const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        if (itemDate < lmStart || itemDate > lmEnd) return false;
      }
      if (periodFilter === '3_months') {
        const m3 = new Date(todayStart); m3.setMonth(m3.getMonth() - 3);
        if (itemDate < m3) return false;
      }
      if (periodFilter === '6_months') {
        const m6 = new Date(todayStart); m6.setMonth(m6.getMonth() - 6);
        if (itemDate < m6) return false;
      }
      if (periodFilter === 'current_fy') {
        const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const fyStart = new Date(fyStartYear, 3, 1);
        const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
        if (itemDate < fyStart || itemDate > fyEnd) return false;
      }
      if (periodFilter === 'last_fy') {
        const fyStartYear = (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1) - 1;
        const fyStart = new Date(fyStartYear, 3, 1);
        const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
        if (itemDate < fyStart || itemDate > fyEnd) return false;
      }
    }
    return true;
  });

  window.renderAccountsTable();
};

window.renderAccountsTable = function() {
  const tb = document.getElementById('tbody-accounts');
  if (!tb) return;

  const rows = window.accState.filteredLedger;
  if (!rows || rows.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No financial ledger entries found for selected filters.</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(a => {
    const isOutflow = (a.type || 'Expense Outflow').toLowerCase().includes('outflow') || (a.type || '').toLowerCase().includes('expense') || (a.type || '').toLowerCase().includes('debit');
    const badge = isOutflow 
      ? '<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Expense Outflow</span>'
      : '<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Income Inflow</span>';
    
    const dt = a.date || (a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '-');

    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: white;">
        <td style="padding: 0.65rem; font-size: 0.8rem; color: #9ca3af;">${a.id || '-'}</td>
        <td style="padding: 0.65rem;">${dt}</td>
        <td style="padding: 0.65rem;">${badge}</td>
        <td style="padding: 0.65rem; font-weight: bold;">${a.title || a.category || '-'}</td>
        <td style="padding: 0.65rem; font-weight: bold; color: ${isOutflow ? '#ef4444' : '#10b981'};">₹${parseFloat(a.amount || 0).toFixed(2)}</td>
        <td style="padding: 0.65rem; color: #f59e0b;">${a.mode || 'Cash'}</td>
        <td style="padding: 0.65rem; text-align: center;">
          <button onclick="window.deleteAccountEntry('${a.id}')" style="background: #dc2626; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; cursor: pointer;">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.deleteAccountEntry = async function(id) {
  if (!confirm("Delete ledger transaction entry?")) return;
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db) return alert("Database not ready.");

  await db.from('accounts_vendors').delete().eq('id', id);
  window.loadAccounts();
};

window.printAccountsStatement = function() {
  const data = window.accState.filteredLedger || [];
  if (data.length === 0) return alert("No transactions available under current filters to print.");

  const periodText = document.getElementById('acc-filter-period')?.selectedOptions[0]?.text || 'All Time';
  const typeText = document.getElementById('acc-filter-type')?.selectedOptions[0]?.text || 'All Types';

  let totalDebit = 0, totalCredit = 0;
  data.forEach(d => {
    const isOutflow = (d.type || 'Expense Outflow').toLowerCase().includes('outflow') || (d.type || '').toLowerCase().includes('expense');
    const amt = parseFloat(d.amount || 0);
    if (isOutflow) totalDebit += amt; else totalCredit += amt;
  });

  const printWindow = window.open('', '_blank');
  let tableRows = '';
  data.forEach(d => {
    const isOutflow = (d.type || 'Expense Outflow').toLowerCase().includes('outflow') || (d.type || '').toLowerCase().includes('expense');
    const dt = d.date || (d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : '-');
    tableRows += `<tr><td>${dt}</td><td style="font-weight:bold; color:${isOutflow?'#dc2626':'#16a34a'};">${isOutflow?'EXPENSE OUTFLOW':'INCOME INFLOW'}</td><td>${d.title||d.category||'-'}</td><td>₹${parseFloat(d.amount||0).toFixed(2)}</td><td>${d.mode||'Cash'}</td></tr>`;
  });

  printWindow.document.write(`<html><head><title>Accounts Ledger Statement</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;}</style></head><body><h2>AASU AROGYAM - Clinic Expense & Financial Ledger Statement</h2><p>Period: ${periodText} | Filter: ${typeText}</p><table><thead><tr><th>Date</th><th>Type</th><th>Particulars / Category</th><th>Amount</th><th>Mode</th></tr></thead><tbody>${tableRows}</tbody></table><h3>Total Inflow: ₹${totalCredit.toFixed(2)} | Total Outflow: ₹${totalDebit.toFixed(2)} | Net Balance: ₹${(totalCredit - totalDebit).toFixed(2)}</h3><p style="margin-top:40px; border-top:1px solid #ccc; padding-top:10px;">Designed and Developed by U3S Web Developer, 7992616555</p></body></html>`);
  printWindow.document.close();
  printWindow.print();
};

document.addEventListener('DOMContentLoaded', () => {
  ensureAccountsModals();
  setTimeout(() => {
    window.loadVendors();
    window.loadAccounts();
  }, 400);
});


// ==========================================
// CENTRAL BILLING TO ACCOUNTS SYNC ENGINE
// ==========================================

window.syncBillToAccounts = async function(billData) {
  if (!billData || !billData.amount) return;
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return;

  const amt = parseFloat(billData.amount || 0);
  if (isNaN(amt) || amt <= 0) return;

  const isPending = (billData.status || '').toLowerCase() === 'pending';
  const txnId = 'BILL-TXN-' + Date.now();
  const dt = billData.date || new Date().toISOString().split('T')[0];

  const payload = {
    id: txnId,
    date: dt,
    type: isPending ? 'Pending Ledger' : 'Income Inflow',
    title: `Patient Bill #${billData.invoice_no || 'INV-' + Date.now()} (${billData.patient_name || 'Clinical Patient'})`,
    category: 'Patient Billing & Invoices',
    amount: amt,
    mode: billData.mode || 'Cash',
    status: isPending ? 'Pending' : 'Paid',
    created_at: new Date(dt).toISOString()
  };

  try {
    const { error } = await window.safeInsertAccounts(payload);
    if (error) {
      console.error("Billing -> Accounts Sync Error:", error.message);
    } else {
      console.log("Invoice synced to Accounts & Vendors ledger:", payload);
      if (typeof window.loadAccounts === 'function') {
        window.loadAccounts();
      }
    }
  } catch (err) {
    console.error("Billing -> Accounts Sync Exception:", err);
  }
};

// Global DOM Interceptor for Module 7 Billing Submissions
document.addEventListener('submit', function(e) {
  const form = e.target;
  if (!form) return;
  const fid = (form.id || '').toLowerCase();
  
  if (fid.includes('bill') || fid.includes('invoice') || fid.includes('central-billing')) {
    setTimeout(() => {
      const patientName = document.getElementById('bill-patient-name')?.value || 
                          document.getElementById('patient-name')?.value || 
                          document.getElementById('billing-patient')?.value || 'Clinical Patient';
      const invNo = document.getElementById('bill-invoice-no')?.value || 
                    document.getElementById('invoice-no')?.value || '';
      const amt = document.getElementById('bill-total-amount')?.value || 
                  document.getElementById('bill-amount')?.value || 
                  document.getElementById('total-amount')?.value || 0;
      const mode = document.getElementById('bill-payment-mode')?.value || 
                   document.getElementById('payment-mode')?.value || 'Cash';
      const status = document.getElementById('bill-status')?.value || 'Paid';

      window.syncBillToAccounts({
        invoice_no: invNo,
        patient_name: patientName,
        amount: amt,
        mode: mode,
        status: status
      });
    }, 400);
  }
}, true);
