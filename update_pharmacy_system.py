with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Expand Module 6 HTML into full Pharmacy Management System with POS and Inventory controls
old_pharmacy_mod = '''    <!-- MODULE 6: HERBAL PHARMACY -->
    <div id="mod-pharmacy" class="module-section">
      <div class="section-header">
        <h2>💊 Herbal Pharmacy Inventory & Retail Ready Stock</h2>
        <span style="font-size:0.75rem; color:var(--text-muted)">Stock automatically increments when batch production runs in Aushadhi Nirman!</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>BARCODE</th>
            <th>MEDICINE NAME</th>
            <th>BATCH CODE</th>
            <th>EXPIRY (MM/YYYY)</th>
            <th>SELLING PRICE (₹)</th>
            <th>STOCK AVAILABLE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody id="tbl-pharmacy"></tbody>
      </table>
    </div>'''

new_pharmacy_mod = '''    <!-- MODULE 6: COMPLETE HERBAL PHARMACY MANAGEMENT SYSTEM -->
    <div id="mod-pharmacy" class="module-section">
      <div class="section-header">
        <div>
          <h2>💊 Herbal Pharmacy Management System</h2>
          <span style="font-size:0.75rem; color:var(--text-muted)">Real-time stock control, POS counter sales, batch tracking & expiry management.</span>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-orange" onclick="openModal('md-pos')">🛒 POS Retail Counter</button>
          <button class="btn btn-blue" onclick="openPharmacyStockModal()">+ Add/Purchase Stock</button>
        </div>
      </div>

      <!-- Quick Stats Metrics -->
      <div class="form-grid grid-4" style="margin-bottom:1.25rem;">
        <div style="background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark);">
          <span style="font-size:0.65rem; color:var(--text-muted); font-weight:bold;">TOTAL STOCK ITEMS</span>
          <h3 id="ph-stat-total" style="margin-top:0.2rem;">0</h3>
        </div>
        <div style="background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark);">
          <span style="font-size:0.65rem; color:var(--text-muted); font-weight:bold;">TOTAL INVENTORY VALUE</span>
          <h3 id="ph-stat-val" style="color:var(--accent-green); margin-top:0.2rem;">₹0</h3>
        </div>
        <div style="background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark);">
          <span style="font-size:0.65rem; color:var(--text-muted); font-weight:bold;">LOW STOCK WARNINGS</span>
          <h3 id="ph-stat-low" style="color:var(--accent-orange); margin-top:0.2rem;">0</h3>
        </div>
        <div style="background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark);">
          <span style="font-size:0.65rem; color:var(--text-muted); font-weight:bold;">EXPIRING / EXPIRED</span>
          <h3 id="ph-stat-exp" style="color:#ef4444; margin-top:0.2rem;">0</h3>
        </div>
      </div>

      <!-- Search and Filter Bar -->
      <div style="display:flex; gap:0.75rem; margin-bottom:1rem; background:var(--panel-dark); padding:0.75rem; border-radius:8px; border:1px solid var(--border-dark);">
        <input type="text" id="ph-search-input" class="form-control" placeholder="🔍 Search medicine by Name, Barcode, or Batch Code..." onkeyup="renderPharmacy()" />
        <select id="ph-filter-status" class="form-control" style="width:200px;" onchange="renderPharmacy()">
          <option value="All">All Items</option>
          <option value="Low">Low Stock (<= 10)</option>
          <option value="InStock">In Stock (> 10)</option>
        </select>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>BARCODE</th>
            <th>MEDICINE NAME</th>
            <th>BATCH CODE</th>
            <th>EXPIRY</th>
            <th>UNIT PRICE (₹)</th>
            <th>STOCK AVAILABLE</th>
            <th>TOTAL VALUE (₹)</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody id="tbl-pharmacy"></tbody>
      </table>
    </div>'''

if old_pharmacy_mod in html:
    html = html.replace(old_pharmacy_mod, new_pharmacy_mod)

# 2. Add POS Billing & Pharmacy Stock Entry Modals to HTML
modals_code = '''
  <!-- MODAL: PHARMACY POS RETAIL COUNTER -->
  <div id="md-pos" class="modal-overlay">
    <div class="modal-container" style="max-width: 850px;">
      <div class="modal-header">
        <h3>🛒 Pharmacy POS - Over The Counter Sales</h3>
        <button class="modal-close" onclick="closeModal('md-pos')">✕</button>
      </div>
      <div class="form-grid grid-3" style="margin-bottom:0.75rem;">
        <div class="form-group">
          <label>CUSTOMER / PATIENT NAME</label>
          <input type="text" id="pos-cust-name" class="form-control" value="Walk-in Customer" />
        </div>
        <div class="form-group">
          <label>MOBILE NO</label>
          <input type="text" id="pos-cust-mobile" class="form-control" placeholder="10-digit mobile" />
        </div>
        <div class="form-group">
          <label>PAYMENT MODE</label>
          <select id="pos-pay-mode" class="form-control">
            <option>Cash</option>
            <option>UPI / QR</option>
            <option>Card</option>
          </select>
        </div>
      </div>

      <div style="background:var(--bg-dark); border:1px solid var(--border-dark); padding:0.85rem; border-radius:8px; margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.5rem;">SEARCH & ADD MEDICINE TO CART</span>
        <div class="form-grid grid-4" style="align-items:end;">
          <div class="form-group" style="grid-column: span 2;">
            <label>SELECT MEDICINE *</label>
            <select id="pos-med-select" class="form-control" onchange="onPosMedChange()"></select>
          </div>
          <div class="form-group">
            <label>QTY *</label>
            <input type="number" id="pos-qty" class="form-control" value="1" min="1" />
          </div>
          <button type="button" class="btn btn-orange" onclick="addPosCartItem()">+ Add to Bill</button>
        </div>

        <table class="data-table" style="margin-top:0.75rem;">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Medicine Name</th>
              <th>Batch</th>
              <th>Price (₹)</th>
              <th>Qty</th>
              <th>Total (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="tbl-pos-cart"></tbody>
        </table>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--panel-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark);">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted);">TOTAL AMOUNT PAYABLE</span>
          <h2 id="pos-grand-total" style="color:var(--accent-green);">₹0.00</h2>
        </div>
        <button class="btn btn-green" style="font-size:1rem; padding:0.75rem 1.5rem;" onclick="checkoutPosSale()">💳 Complete Sale & Print Receipt</button>
      </div>
    </div>
  </div>

  <!-- MODAL: ADD / EDIT PHARMACY STOCK ITEM -->
  <div id="md-pharmacy-stock" class="modal-overlay">
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-header">
        <h3 id="title-ph-stock">+ Add / Purchase Stock Item</h3>
        <button class="modal-close" onclick="closeModal('md-pharmacy-stock')">✕</button>
      </div>
      <form onsubmit="savePharmacyItem(event)">
        <input type="hidden" id="ph-item-id" />
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group">
            <label>MEDICINE NAME *</label>
            <input type="text" id="ph-name" class="form-control" placeholder="e.g. Ashwagandha Churna (100g)" required />
          </div>
          <div class="form-group">
            <label>BARCODE *</label>
            <input type="text" id="ph-barcode" class="form-control" placeholder="e.g. 8901005" required />
          </div>
        </div>
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group">
            <label>BATCH CODE *</label>
            <input type="text" id="ph-batch" class="form-control" placeholder="e.g. BATCH-2026-09" required />
          </div>
          <div class="form-group">
            <label>EXPIRY (MM/YYYY) *</label>
            <input type="text" id="ph-expiry" class="form-control" placeholder="09/2028" required />
          </div>
        </div>
        <div class="form-grid grid-2" style="margin-bottom:1.25rem;">
          <div class="form-group">
            <label>SELLING PRICE (₹) *</label>
            <input type="number" step="0.01" id="ph-price" class="form-control" required />
          </div>
          <div class="form-group">
            <label>STOCK QUANTITY *</label>
            <input type="number" id="ph-stock-qty" class="form-control" required />
          </div>
        </div>
        <button type="submit" class="btn btn-orange" style="width:100%; justify-content:center;">Save Inventory Item</button>
      </form>
    </div>
  </div>'''

if '</body' in html and 'md-pos' not in html:
    html = html.replace('</body>', modals_code + '\n</body>')

# 3. Add JS functions for POS cart, pharmacy metrics, edit, and delete functions
js_pharmacy = '''    let posCart = [];

    function renderPharmacy() {
      const q = (document.getElementById('ph-search-input')?.value || '').toLowerCase();
      const statusFilter = document.getElementById('ph-filter-status')?.value || 'All';
      const tbl = document.getElementById('tbl-pharmacy');
      if (!tbl) return;

      let items = db.pharmacy.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.barcode || '').toLowerCase().includes(q) || 
        (p.batch_code || '').toLowerCase().includes(q)
      );

      if (statusFilter === 'Low') items = items.filter(p => Number(p.stock) <= 10);
      else if (statusFilter === 'InStock') items = items.filter(p => Number(p.stock) > 10);

      let totalVal = 0;
      let lowCount = 0;
      let expCount = 0;

      items.forEach(p => {
        totalVal += (Number(p.price) || 0) * (Number(p.stock) || 0);
        if (Number(p.stock) <= 10) lowCount++;
      });

      document.getElementById('ph-stat-total').innerText = db.pharmacy.length;
      document.getElementById('ph-stat-val').innerText = '₹' + totalVal.toLocaleString('en-IN');
      document.getElementById('ph-stat-low').innerText = lowCount;
      document.getElementById('ph-stat-exp').innerText = expCount;

      tbl.innerHTML = items.map(p => {
        const stockNum = Number(p.stock) || 0;
        const priceNum = Number(p.price) || 0;
        const isLow = stockNum <= 10;
        const badge = stockNum === 0 
          ? `<span class="badge-low">OUT OF STOCK</span>` 
          : (isLow ? `<span class="badge-low">LOW STOCK (${stockNum})</span>` : `<span class="badge-sufficient">IN STOCK</span>`);

        return `
          <tr>
            <td><code>${p.barcode}</code></td>
            <td><b>${p.name}</b></td>
            <td>${p.batch_code}</td>
            <td>${p.expiry}</td>
            <td>₹${priceNum}</td>
            <td><b>${stockNum} units</b></td>
            <td><b>₹${(stockNum * priceNum).toLocaleString('en-IN')}</b></td>
            <td>${badge}</td>
            <td>
              <button class="btn btn-blue" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editPharmacyStock('${p.id || p.barcode}')">Edit</button>
              <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="delPharmacyStock('${p.id || p.barcode}')">Delete</button>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colSpan="9">No pharmacy items match criteria. Click "+ Add/Purchase Stock" to register items.</td></tr>';
    }

    function openPharmacyStockModal() {
      document.getElementById('ph-item-id').value = '';
      document.getElementById('ph-name').value = '';
      document.getElementById('ph-barcode').value = '890' + Math.floor(1000000 + Math.random() * 9000000);
      document.getElementById('ph-batch').value = 'BATCH-' + new Date().getFullYear() + '-01';
      document.getElementById('ph-expiry').value = '12/2028';
      document.getElementById('ph-price').value = '';
      document.getElementById('ph-stock-qty').value = '';
      document.getElementById('title-ph-stock').innerText = '+ Add / Purchase Stock Item';
      openModal('md-pharmacy-stock');
    }

    function editPharmacyStock(id) {
      const item = db.pharmacy.find(p => p.id === id || p.barcode === id); if (!item) return;
      document.getElementById('ph-item-id').value = item.id || item.barcode;
      document.getElementById('ph-name').value = item.name;
      document.getElementById('ph-barcode').value = item.barcode;
      document.getElementById('ph-batch').value = item.batch_code;
      document.getElementById('ph-expiry').value = item.expiry;
      document.getElementById('ph-price').value = item.price;
      document.getElementById('ph-stock-qty').value = item.stock;
      document.getElementById('title-ph-stock').innerText = '✏️ Edit Stock Item';
      openModal('md-pharmacy-stock');
    }

    async function savePharmacyItem(e) {
      e.preventDefault();
      const id = document.getElementById('ph-item-id').value;
      const payload = {
        name: document.getElementById('ph-name').value,
        barcode: document.getElementById('ph-barcode').value,
        batch_code: document.getElementById('ph-batch').value,
        expiry: document.getElementById('ph-expiry').value,
        price: Number(document.getElementById('ph-price').value) || 0,
        stock: Number(document.getElementById('ph-stock-qty').value) || 0
      };

      if (sbClient) {
        if (id) await sbClient.from('pharmacy_stock').update(payload).eq('id', id);
        else await sbClient.from('pharmacy_stock').insert([payload]);
      } else {
        if (id) {
          const idx = db.pharmacy.findIndex(p => p.id === id || p.barcode === id);
          if (idx !== -1) db.pharmacy[idx] = { ...db.pharmacy[idx], ...payload };
        } else {
          db.pharmacy.unshift(payload);
        }
      }

      alert('Pharmacy Stock Saved Successfully!');
      closeModal('md-pharmacy-stock');
      init();
    }

    async function delPharmacyStock(id) {
      if (!confirm('Delete this stock item permanently?')) return;
      if (sbClient) await sbClient.from('pharmacy_stock').delete().eq('id', id);
      else db.pharmacy = db.pharmacy.filter(p => (p.id !== id && p.barcode !== id));
      init();
    }

    /* POS RETAIL COUNTER FUNCTIONS */
    function populatePosDropdown() {
      const sel = document.getElementById('pos-med-select');
      if (!sel) return;
      sel.innerHTML = db.pharmacy.map(p => `
        <option value="${p.barcode}">${p.name} | Batch: ${p.batch_code} | Price: ₹${p.price} | Stock: ${p.stock}</option>
      `).join('') || '<option value="">No stock available</option>';
    }

    function addPosCartItem() {
      const barcode = document.getElementById('pos-med-select').value;
      const med = db.pharmacy.find(p => p.barcode === barcode); if (!med) return alert('Select item');
      const qty = Number(document.getElementById('pos-qty').value) || 1;

      if (med.stock < qty) return alert(`Insufficient Stock! Only ${med.stock} units available.`);

      const existingIdx = posCart.findIndex(c => c.barcode === barcode);
      if (existingIdx !== -1) {
        if (med.stock < posCart[existingIdx].qty + qty) return alert('Cannot exceed available stock');
        posCart[existingIdx].qty += qty;
        posCart[existingIdx].total = posCart[existingIdx].qty * med.price;
      } else {
        posCart.push({ barcode: med.barcode, name: med.name, batch_code: med.batch_code, price: med.price, qty: qty, total: qty * med.price });
      }

      renderPosCart();
    }

    function renderPosCart() {
      const tbl = document.getElementById('tbl-pos-cart');
      if (!tbl) return;

      let grandTotal = 0;
      tbl.innerHTML = posCart.map((item, idx) => {
        grandTotal += item.total;
        return `
          <tr>
            <td><code>${item.barcode}</code></td>
            <td><b>${item.name}</b></td>
            <td>${item.batch_code}</td>
            <td>₹${item.price}</td>
            <td>${item.qty}</td>
            <td><b>₹${item.total}</b></td>
            <td><button type="button" onclick="posCart.splice(${idx},1);renderPosCart();" style="color:red;border:none;background:none;cursor:pointer;">✕</button></td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Cart is empty. Select medicine above and click "+ Add to Bill".</td></tr>';

      document.getElementById('pos-grand-total').innerText = '₹' + grandTotal.toFixed(2);
    }

    async function checkoutPosSale() {
      if (posCart.length === 0) return alert('Cart is empty!');

      const custName = document.getElementById('pos-cust-name').value || 'Walk-in Customer';
      const custMobile = document.getElementById('pos-cust-mobile').value || 'N/A';
      const payMode = document.getElementById('pos-pay-mode').value;
      const grandTotal = posCart.reduce((a,c) => a + c.total, 0);
      const billNo = 'POS-' + Math.floor(100000 + Math.random() * 900000);

      // Deduct sold quantity from database stock
      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, med.stock - item.qty);
          if (sbClient) {
            await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode);
          }
        }
      }

      // Add to central billing counter
      if (sbClient) {
        await sbClient.from('billing').insert([{
          bill_no: billNo, patient_name: custName, mobile_no: custMobile,
          bill_type: 'POS Retail', total_amount: grandTotal, paid_amount: grandTotal, balance_due: 0, payment_status: 'Paid', items: posCart
        }]);
      } else {
        db.billing.unshift({ id: 'b-' + Date.now(), bill_no: billNo, rx_no: 'POS', patient_name: custName, total_amount: grandTotal, paid_amount: grandTotal, balance_due: 0, payment_status: 'Paid' });
      }

      alert(`✅ Sale Completed!\n• Invoice No: ${billNo}\n• Paid Amount: ₹${grandTotal} via ${payMode}\n• Stock updated automatically.`);
      posCart = [];
      closeModal('md-pos');
      init();
    }'''

if 'function openModal(id)' in html:
    html = html.replace("if (id === 'md-rx') {", "if (id === 'md-pos') { populatePosDropdown(); renderPosCart(); }\n      else if (id === 'md-rx') {")

if 'window.onload = init;' in html:
    html = html.replace('window.onload = init;', js_pharmacy + '\n\n    window.onload = init;')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Herbal Pharmacy complete management system deployed.")
