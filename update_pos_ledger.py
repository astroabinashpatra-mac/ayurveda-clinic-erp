with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Replace POS Modal HTML with live Tax, Discount (Dual Mode %/₹), and Payment Collection controls
old_pos_modal = '''  <!-- MODAL: POS RETAIL COUNTER -->
  <div id="md-pos" class="modal-overlay">
    <div class="modal-container" style="max-width: 800px;">
      <div class="modal-header"><h3>🛒 Pharmacy Retail POS Counter</h3><button class="modal-close" onclick="closeModal('md-pos')">✕</button></div>
      <div class="form-grid grid-2">
        <div class="form-group">
          <label>CUSTOMER TYPE</label>
          <select id="pos-cust-type" class="form-control" onchange="togglePosCustType(this.value)">
            <option value="otc">Over The Counter Sale</option>
            <option value="registered">Registered Patient</option>
          </select>
        </div>
        <div class="form-group"><label>PAYMENT MODE</label><select id="pos-pay-mode" class="form-control"><option>Cash</option><option>UPI / QR</option><option>Card</option></select></div>
      </div>
      <div id="pos-otc-box" class="form-grid grid-2">
        <div class="form-group"><label>CUSTOMER NAME</label><input type="text" id="pos-cust-name" class="form-control" value="Walk-in Customer" /></div>
        <div class="form-group"><label>MOBILE NO</label><input type="text" id="pos-cust-mobile" class="form-control" placeholder="10 digits" /></div>
      </div>
      <div id="pos-reg-box" class="form-group" style="display:none;">
        <label>SELECT REGISTERED PATIENT</label>
        <input type="text" id="pos-p-search" list="dl-pos-patients" class="form-control" oninput="onPosPatientSelect()" placeholder="Search patient..." />
        <datalist id="dl-pos-patients"></datalist>
      </div>
      <div style="background:var(--bg-dark); padding:0.75rem; border-radius:6px; margin-top:0.5rem;">
        <div class="form-grid grid-4" style="align-items:end;">
          <div class="form-group" style="grid-column:span 2;"><label>SELECT MEDICINE</label><select id="pos-med-select" class="form-control"></select></div>
          <div class="form-group"><label>QTY</label><input type="number" id="pos-qty" class="form-control" value="1" min="1" /></div>
          <button type="button" class="btn btn-orange" onclick="addPosCartItem()">+ Add</button>
        </div>
        <table class="data-table" style="margin-top:0.5rem;"><tbody id="tbl-pos-cart"></tbody></table>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
        <h2 id="pos-grand-total" style="color:var(--accent-green);">₹0.00</h2>
        <button class="btn btn-green" onclick="checkoutPosSale()">💳 Complete Sale & Print</button>
      </div>
    </div>
  </div>'''

new_pos_modal = '''  <!-- ADVANCED POS RETAIL COUNTER WITH TAX, DISCOUNT & PARTIAL PAYMENT LEDGER -->
  <div id="md-pos" class="modal-overlay">
    <div class="modal-container" style="max-width: 900px;">
      <div class="modal-header">
        <h3>🛒 Pharmacy Retail POS Counter & Billing</h3>
        <button class="modal-close" onclick="closeModal('md-pos')">✕</button>
      </div>
      
      <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
        <div class="form-group">
          <label>CUSTOMER TYPE *</label>
          <select id="pos-cust-type" class="form-control" onchange="togglePosCustType(this.value)">
            <option value="otc">Over The Counter Sale</option>
            <option value="registered">Registered Patient (EMR Directory)</option>
          </select>
        </div>
        <div class="form-group">
          <label>PAYMENT MODE *</label>
          <select id="pos-pay-mode" class="form-control">
            <option>Cash</option>
            <option>UPI / QR</option>
            <option>Card</option>
            <option>Credit / Due</option>
          </select>
        </div>
      </div>

      <div id="pos-otc-box" class="form-grid grid-2" style="margin-bottom:0.75rem;">
        <div class="form-group"><label>CUSTOMER NAME *</label><input type="text" id="pos-cust-name" class="form-control" value="Walk-in Customer" /></div>
        <div class="form-group"><label>MOBILE NO *</label><input type="text" id="pos-cust-mobile" class="form-control" placeholder="10-digit mobile" /></div>
      </div>

      <div id="pos-reg-box" class="form-group" style="margin-bottom:0.75rem; display:none;">
        <label>SEARCH REGISTERED PATIENT (EMR DIRECTORY) *</label>
        <input type="text" id="pos-p-search" list="dl-pos-patients" class="form-control" oninput="onPosPatientSelect()" placeholder="Type Patient Name, Mobile No, or UHID..." />
        <datalist id="dl-pos-patients"></datalist>
        <input type="hidden" id="pos-patient-id" />
      </div>

      <div style="background:var(--bg-dark); padding:0.85rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.5rem;">SELECT MEDICINES / ITEMS</span>
        <div class="form-grid grid-4" style="align-items:end;">
          <div class="form-group" style="grid-column:span 2;">
            <label>MEDICINE STOCK ITEM *</label>
            <select id="pos-med-select" class="form-control"></select>
          </div>
          <div class="form-group"><label>QUANTITY *</label><input type="number" id="pos-qty" class="form-control" value="1" min="1" /></div>
          <button type="button" class="btn btn-orange" onclick="addPosCartItem()">+ Add to Bill</button>
        </div>
        <table class="data-table" style="margin-top:0.5rem;">
          <thead>
            <tr><th>Item Name</th><th>Batch</th><th>Unit Price</th><th>Qty</th><th>Total (₹)</th><th>Action</th></tr>
          </thead>
          <tbody id="tbl-pos-cart"></tbody>
        </table>
      </div>

      <!-- TAX, DISCOUNT & PART PAYMENT CALCULATION PANEL -->
      <div style="background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:1rem;">
        <div class="form-grid grid-4">
          <div class="form-group">
            <label>DISCOUNT MODE</label>
            <select id="pos-disc-type" class="form-control" onchange="onPosDiscountModeChange()">
              <option value="percent">Percentage (%)</option>
              <option value="amount">Amount (₹)</option>
            </select>
          </div>
          <div class="form-group">
            <label id="pos-disc-label">DISCOUNT VALUE *</label>
            <input type="number" step="0.01" id="pos-disc-val" class="form-control" value="0" onkeyup="calculatePosTotals()" onchange="calculatePosTotals()" />
          </div>
          <div class="form-group">
            <label>TAX / GST (%) *</label>
            <input type="number" step="0.01" id="pos-tax-percent" class="form-control" value="0" onkeyup="calculatePosTotals()" onchange="calculatePosTotals()" />
          </div>
          <div class="form-group">
            <label>AMOUNT PAYING NOW (₹) *</label>
            <input type="number" step="0.01" id="pos-paid-amt" class="form-control" style="font-weight:bold; color:var(--accent-green);" onkeyup="calculatePosTotals()" onchange="calculatePosTotals()" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:0.5rem; margin-top:0.75rem; background:var(--bg-dark); padding:0.75rem; border-radius:6px; font-size:0.8rem;">
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">SUBTOTAL</span><b id="pos-lbl-subtotal">₹0.00</b></div>
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">DISCOUNT</span><b id="pos-lbl-discount" style="color:#ef4444;">-₹0.00</b></div>
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">TAX (GST)</span><b id="pos-lbl-tax" style="color:var(--accent-blue);">+₹0.00</b></div>
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">GRAND TOTAL</span><b id="pos-lbl-grandtotal" style="font-size:1rem; color:var(--text-main);">₹0.00</b></div>
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">PAID NOW</span><b id="pos-lbl-paid" style="color:var(--accent-green);">₹0.00</b></div>
          <div><span style="color:var(--text-muted); font-size:0.65rem; display:block;">BALANCE DUE</span><b id="pos-lbl-due" style="color:var(--accent-orange);">₹0.00</b></div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal('md-pos')">Cancel</button>
        <button class="btn btn-green" style="font-size:0.95rem; padding:0.65rem 1.5rem;" onclick="checkoutPosSale()">💳 Complete Checkout & Print</button>
      </div>
    </div>
  </div>'''

if old_pos_modal in html:
    html = html.replace(old_pos_modal, new_pos_modal)

# 2. Update Billing Module HTML with Pending Payment Ledger sub-tabs and Search
old_billing_mod = '''    <!-- MODULE 7: BILLING -->
    <div id="mod-billing" class="module-section">
      <div class="section-header"><h2>💰 Central Integrated Billing Counter</h2></div>
      <table class="data-table">
        <thead><tr><th>BILL NO</th><th>RX NO</th><th>PATIENT NAME</th><th>TOTAL (₹)</th><th>PAID (₹)</th><th>BALANCE DUE (₹)</th><th>STATUS</th><th>ACTION</th></tr></thead>
        <tbody id="tbl-billing"></tbody>
      </table>
    </div>'''

new_billing_mod = '''    <!-- MODULE 7: CENTRAL INTEGRATED BILLING & PENDING PAYMENT LEDGER -->
    <div id="mod-billing" class="module-section">
      <div class="section-header">
        <div>
          <h2>💰 Central Billing & Pending Payment Ledger</h2>
          <span style="font-size:0.75rem; color:var(--text-muted)">Track all sales invoices, search patient outstanding dues, collect partial or full payments.</span>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="tab-btn active" id="btn-bill-filter-all" onclick="filterBillingLedger('All', this)">All Invoices</button>
          <button class="tab-btn" id="btn-bill-filter-pending" onclick="filterBillingLedger('Pending', this)">⚠️ Pending Payment Ledger</button>
          <button class="tab-btn" id="btn-bill-filter-paid" onclick="filterBillingLedger('Paid', this)">✅ Paid Invoices</button>
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <input type="text" id="bill-search-input" class="form-control" placeholder="🔍 Search patient ledger by Patient Name, UHID, Mobile No, or Bill No..." onkeyup="renderBilling()" />
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>BILL NO</th>
            <th>DATE</th>
            <th>PATIENT NAME / UHID</th>
            <th>MOBILE</th>
            <th>GRAND TOTAL</th>
            <th>PAID AMOUNT</th>
            <th>OUTSTANDING DUE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody id="tbl-billing"></tbody>
      </table>
    </div>'''

if old_billing_mod in html:
    html = html.replace(old_billing_mod, new_billing_mod)

# 3. Add Advanced Calculation, Patient EMR Fetching, and Payment Ledger JavaScript
js_pos_billing_engine = '''
    let activeBillingLedgerFilter = 'All';

    function populatePosPatientDatalist() {
      const dl = document.getElementById('dl-pos-patients');
      if (!dl) return;
      dl.innerHTML = db.patients.map(p => 
        `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti}</option>`
      ).join('');
    }

    function onPosPatientSelect() {
      const val = (document.getElementById('pos-p-search')?.value || '').toLowerCase();
      const pat = db.patients.find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        document.getElementById('pos-cust-name').value = pat.full_name;
        document.getElementById('pos-cust-mobile').value = pat.mobile_no;
        document.getElementById('pos-patient-id').value = pat.id;
      }
    }

    function togglePosCustType(type) {
      document.getElementById('pos-otc-box').style.display = type === 'otc' ? 'grid' : 'none';
      document.getElementById('pos-reg-box').style.display = type === 'registered' ? 'block' : 'none';
      if (type === 'registered') {
        populatePosPatientDatalist();
      } else {
        document.getElementById('pos-cust-name').value = 'Walk-in Customer';
        document.getElementById('pos-cust-mobile').value = '';
        document.getElementById('pos-patient-id').value = '';
      }
    }

    function onPosDiscountModeChange() {
      const mode = document.getElementById('pos-disc-type').value;
      document.getElementById('pos-disc-label').innerText = mode === 'percent' ? 'DISCOUNT (%) *' : 'DISCOUNT AMOUNT (₹) *';
      calculatePosTotals();
    }

    function calculatePosTotals() {
      const subtotal = posCart.reduce((acc, c) => acc + c.total, 0);
      const discMode = document.getElementById('pos-disc-type')?.value || 'percent';
      let discVal = Number(document.getElementById('pos-disc-val')?.value) || 0;
      let taxPercent = Number(document.getElementById('pos-tax-percent')?.value) || 0;

      let discAmt = 0;
      let discPct = 0;

      if (discMode === 'percent') {
        discPct = discVal;
        discAmt = (subtotal * discPct) / 100;
      } else {
        discAmt = discVal;
        discPct = subtotal > 0 ? (discAmt / subtotal) * 100 : 0;
      }

      if (discAmt > subtotal) discAmt = subtotal;

      const taxableAmt = subtotal - discAmt;
      const taxAmt = (taxableAmt * taxPercent) / 100;
      const grandTotal = Math.max(0, taxableAmt + taxAmt);

      let paidAmtInput = document.getElementById('pos-paid-amt');
      let paidAmt = Number(paidAmtInput?.value);

      // Auto default paid amount to grand total if blank
      if (isNaN(paidAmt) || paidAmt === 0 && !paidAmtInput.dataset.userEdited) {
        paidAmt = grandTotal;
        if (paidAmtInput) paidAmtInput.value = grandTotal.toFixed(2);
      }

      const balanceDue = Math.max(0, grandTotal - paidAmt);

      document.getElementById('pos-lbl-subtotal').innerText = '₹' + subtotal.toFixed(2);
      document.getElementById('pos-lbl-discount').innerText = `-₹${discAmt.toFixed(2)} (${discPct.toFixed(1)}%)`;
      document.getElementById('pos-lbl-tax').innerText = `+₹${taxAmt.toFixed(2)} (${taxPercent}%)`;
      document.getElementById('pos-lbl-grandtotal').innerText = '₹' + grandTotal.toFixed(2);
      document.getElementById('pos-lbl-paid').innerText = '₹' + paidAmt.toFixed(2);
      document.getElementById('pos-lbl-due').innerText = '₹' + balanceDue.toFixed(2);

      return { subtotal, discPct, discAmt, taxPercent, taxAmt, grandTotal, paidAmt, balanceDue };
    }

    async function checkoutPosSale() {
      if (!posCart.length) return alert('Please add at least 1 medicine/item to the bill.');

      const custName = document.getElementById('pos-cust-name')?.value || 'Walk-in Customer';
      const custMobile = document.getElementById('pos-cust-mobile')?.value || 'N/A';
      const patientId = document.getElementById('pos-patient-id')?.value || null;
      const payMode = document.getElementById('pos-pay-mode')?.value || 'Cash';

      const calc = calculatePosTotals();
      const billNo = 'BILL-' + Math.floor(100000 + Math.random() * 900000);

      const status = calc.balanceDue === 0 ? 'Paid' : (calc.paidAmt > 0 ? 'Partial' : 'Unpaid');

      // Deduct inventory stock
      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, med.stock - item.qty);
          if (sbClient) {
            try { await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode); } catch(e){}
          }
        }
      }

      const billPayload = {
        bill_no: billNo,
        rx_no: 'POS',
        patient_id: patientId,
        patient_name: custName,
        mobile_no: custMobile,
        bill_type: 'POS Retail',
        subtotal: calc.subtotal,
        discount_percent: calc.discPct,
        discount_amount: calc.discAmt,
        tax_percent: calc.taxPercent,
        tax_amount: calc.taxAmt,
        total_amount: calc.grandTotal,
        paid_amount: calc.paidAmt,
        balance_due: calc.balanceDue,
        payment_status: status,
        items: posCart
      };

      if (sbClient) {
        try { await sbClient.from('billing').insert([billPayload]); } catch(e){}
      }
      db.billing.unshift({ ...billPayload, id: 'b-' + Date.now(), created_at: new Date().toISOString() });

      if (calc.balanceDue > 0) {
        alert(`⚠️ Sale Completed with Outstanding Balance!\n• Bill No: ${billNo}\n• Total: ₹${calc.grandTotal.toFixed(2)}\n• Paid Now: ₹${calc.paidAmt.toFixed(2)}\n• Balance Due: ₹${calc.balanceDue.toFixed(2)}\n\nRecord added to Pending Payment Ledger.`);
      } else {
        alert(`✅ Sale Settled in Full!\nBill No: ${billNo}\nTotal Paid: ₹${calc.grandTotal.toFixed(2)}`);
      }

      posCart = [];
      closeModal('md-pos');
      init();
    }

    /* PENDING PAYMENT LEDGER FUNCTIONS */
    function filterBillingLedger(status, btn) {
      activeBillingLedgerFilter = status;
      document.querySelectorAll('#mod-billing .tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderBilling();
    }

    function renderBilling() {
      const q = (document.getElementById('bill-search-input')?.value || '').toLowerCase();
      const tbl = document.getElementById('tbl-billing');
      if (!tbl) return;

      let filtered = db.billing.filter(b => 
        (b.bill_no || '').toLowerCase().includes(q) ||
        (b.patient_name || '').toLowerCase().includes(q) ||
        (b.mobile_no || '').includes(q)
      );

      if (activeBillingLedgerFilter === 'Pending') {
        filtered = filtered.filter(b => Number(b.balance_due) > 0);
      } else if (activeBillingLedgerFilter === 'Paid') {
        filtered = filtered.filter(b => Number(b.balance_due) === 0);
      }

      tbl.innerHTML = filtered.map(b => {
        const total = Number(b.total_amount) || 0;
        const paid = Number(b.paid_amount) || 0;
        const due = Number(b.balance_due) || 0;
        const isPaid = due === 0;

        const statusBadge = isPaid 
          ? `<span style="background:rgba(16,185,129,0.15); color:#10b981; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;">PAID</span>`
          : (paid > 0 
            ? `<span style="background:rgba(245,158,11,0.15); color:#f59e0b; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;">PARTIAL DUE</span>`
            : `<span style="background:rgba(239,68,68,0.15); color:#ef4444; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;">UNPAID</span>`);

        return `
          <tr>
            <td><b>${b.bill_no}</b></td>
            <td>${b.created_at ? new Date(b.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</td>
            <td><b>${b.patient_name}</b></td>
            <td>${b.mobile_no || 'N/A'}</td>
            <td>₹${total.toFixed(2)}</td>
            <td>₹${paid.toFixed(2)}</td>
            <td><b style="color:var(--accent-orange); font-size:0.9rem;">₹${due.toFixed(2)}</b></td>
            <td>${statusBadge}</td>
            <td>
              ${isPaid 
                ? `<span style="color:#10b981; font-weight:bold; font-size:0.75rem;">✅ Fully Settled</span>` 
                : `<button class="btn btn-green" style="padding:2px 8px; font-size:0.75rem;" onclick="openPaymentModal('${b.id}')">💳 Collect Payment</button>`
              }
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="9" style="text-align:center;">No bills found in ledger.</td></tr>';
    }

    async function savePayment(e) {
      e.preventDefault();
      const id = document.getElementById('pay-bill-id').value;
      const b = db.billing.find(x => x.id === id); if (!b) return;

      const collectAmt = Number(document.getElementById('pay-collect-amt').value) || 0;
      if (collectAmt <= 0) return alert('Enter valid payment amount');

      const oldPaid = Number(b.paid_amount) || 0;
      const oldDue = Number(b.balance_due) || 0;

      if (collectAmt > oldDue) return alert(`Payment cannot exceed outstanding balance due of ₹${oldDue.toFixed(2)}`);

      const newPaid = oldPaid + collectAmt;
      const newDue = Math.max(0, oldDue - collectAmt);
      const newStatus = newDue === 0 ? 'Paid' : 'Partial';

      b.paid_amount = newPaid;
      b.balance_due = newDue;
      b.payment_status = newStatus;

      if (sbClient) {
        try {
          await sbClient.from('billing').update({ paid_amount: newPaid, balance_due: newDue, payment_status: newStatus }).eq('id', id);
        } catch(err){}
      }

      if (newDue === 0) {
        alert(`✅ Payment of ₹${collectAmt} collected!\nBill ${b.bill_no} is now fully settled and moved out of Pending Payment Ledger.`);
      } else {
        alert(`✅ Partial payment of ₹${collectAmt} recorded!\nRemaining Balance Due: ₹${newDue.toFixed(2)}`);
      }

      closeModal('md-pay');
      renderBilling();
      updateDashboardStats();
    }'''

if 'async function checkoutPosSale()' in html:
    start_pos = html.find('function populatePosPatientDatalist()')
    end_pos = html.find('/* SCHEDULE */')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + js_pos_billing_engine + '\n\n    ' + html[end_pos:]

# Hook cart total calculation on item addition/removal
if 'function renderPosCart()' in html:
    html = html.replace('renderPosCart();', 'renderPosCart(); calculatePosTotals();')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("POS Tax/Discount engine and Pending Payment Ledger successfully updated.")
