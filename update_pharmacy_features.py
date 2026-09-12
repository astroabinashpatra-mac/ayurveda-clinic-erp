with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Herbal Pharmacy Section HTML to include Sub-Tabs (Inventory vs Sales History)
old_pharmacy_header = '''    <!-- MODULE 6: HERBAL PHARMACY -->
    <div id="mod-pharmacy" class="module-section">
      <div class="section-header">
        <h2>💊 Herbal Pharmacy Management System</h2>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-orange" onclick="openModal('md-pos')">🛒 POS Retail Counter</button>
          <button class="btn btn-blue" onclick="openPharmacyStockModal()">+ Add/Purchase Stock</button>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>BARCODE</th><th>MEDICINE NAME</th><th>BATCH CODE</th><th>EXPIRY</th><th>SELLING PRICE</th><th>STOCK</th><th>ACTIONS</th></tr></thead>
        <tbody id="tbl-pharmacy"></tbody>
      </table>
    </div>'''

new_pharmacy_header = '''    <!-- MODULE 6: HERBAL PHARMACY MANAGEMENT SYSTEM -->
    <div id="mod-pharmacy" class="module-section">
      <div class="section-header">
        <div>
          <h2>💊 Herbal Pharmacy & Sales Desk</h2>
          <span style="font-size:0.75rem; color:var(--text-muted)">Manage live inventory stock, edit items, review POS sales history, print bills & send WhatsApp receipts.</span>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="tab-btn active" id="btn-ph-tab-stock" onclick="switchPharmacyView('stock', this)">📦 Inventory Stock</button>
          <button class="tab-btn" id="btn-ph-tab-sales" onclick="switchPharmacyView('sales', this)">📋 Sales History & Receipts</button>
          <button class="btn btn-orange" onclick="openModal('md-pos')">🛒 POS Retail Counter</button>
          <button class="btn btn-blue" onclick="openPharmacyStockModal()">+ Add/Purchase Stock</button>
        </div>
      </div>

      <!-- INVENTORY VIEW -->
      <div id="ph-view-stock">
        <table class="data-table">
          <thead><tr><th>BARCODE</th><th>MEDICINE NAME</th><th>BATCH CODE</th><th>EXPIRY</th><th>VENDOR</th><th>PURCHASE RATE</th><th>SELLING PRICE</th><th>STOCK</th><th>ACTIONS</th></tr></thead>
          <tbody id="tbl-pharmacy"></tbody>
        </table>
      </div>

      <!-- SALES HISTORY VIEW -->
      <div id="ph-view-sales" style="display:none;">
        <div style="margin-bottom:1rem;">
          <input type="text" id="ph-sales-search" class="form-control" placeholder="Search sales by Bill No, Customer Name, or Mobile..." onkeyup="renderPharmacySalesHistory()" />
        </div>
        <table class="data-table">
          <thead><tr><th>BILL NO</th><th>DATE</th><th>CUSTOMER NAME</th><th>MOBILE</th><th>PAYMENT MODE</th><th>TOTAL AMOUNT</th><th>ACTIONS</th></tr></thead>
          <tbody id="tbl-pharmacy-sales"></tbody>
        </table>
      </div>
    </div>'''

if old_pharmacy_header in html:
    html = html.replace(old_pharmacy_header, new_pharmacy_header)

# 2. Add Printable POS Receipt Sheet at bottom of HTML before </body>
pos_receipt_printable = '''
  <!-- PRINTABLE POS RETAIL RECEIPT SHEET -->
  <div id="print-pos-sheet" style="display:none;">
    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 0.5rem; margin-bottom: 1rem;">
      <h2 style="font-size: 1.4rem; margin-bottom: 0.2rem;">AASU AROGYAM HERBAL PHARMACY</h2>
      <p style="font-size: 0.85rem;">Hospital Road, Janla, Odisha | Phone: +91 7992616555</p>
      <p style="font-size: 0.8rem; font-weight: bold; margin-top:0.2rem;">RETAIL PHARMACY CASH MEMO</p>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.75rem;">
      <div>
        <p><b>Bill No:</b> <span id="pos-pr-billno"></span></p>
        <p><b>Customer:</b> <span id="pos-pr-custname"></span></p>
      </div>
      <div>
        <p><b>Date:</b> <span id="pos-pr-date"></span></p>
        <p><b>Mobile:</b> <span id="pos-pr-mobile"></span></p>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size:0.85rem;">
      <thead>
        <tr style="border-bottom: 1px solid #000; text-align: left;">
          <th style="padding: 4px;">Item Name</th>
          <th style="padding: 4px;">Batch</th>
          <th style="padding: 4px;">Rate</th>
          <th style="padding: 4px;">Qty</th>
          <th style="padding: 4px;">Total</th>
        </tr>
      </thead>
      <tbody id="pos-pr-tbl-body"></tbody>
    </table>
    <div style="border-top: 1px solid #000; padding-top: 0.5rem; text-align: right; font-size: 0.95rem;">
      <p><b>Grand Total: <span id="pos-pr-total"></span></b></p>
    </div>
    <div style="margin-top: 1.5rem; text-align: center; font-size: 0.8rem;">
      <p>Thank you for choosing AASU AROGYAM! Get Well Soon 🙏</p>
    </div>
  </div>
'''

if '</body' in html and 'print-pos-sheet' not in html:
    html = html.replace('</body>', pos_receipt_printable + '\n</body>')

# 3. Add JS Functions for View Switching, Edit Button Rendering, Sales History, Print & WhatsApp
js_updates = '''
    function switchPharmacyView(view, btn) {
      document.getElementById('ph-view-stock').style.display = view === 'stock' ? 'block' : 'none';
      document.getElementById('ph-view-sales').style.display = view === 'sales' ? 'block' : 'none';
      document.getElementById('btn-ph-tab-stock').classList.remove('active');
      document.getElementById('btn-ph-tab-sales').classList.remove('active');
      if (btn) btn.classList.add('active');
      if (view === 'sales') renderPharmacySalesHistory();
    }

    function renderPharmacy() {
      const tbl = document.getElementById('tbl-pharmacy');
      if (!tbl) return;
      tbl.innerHTML = db.pharmacy.map(p => `
        <tr>
          <td><code>${p.barcode}</code></td>
          <td><b>${p.name}</b></td>
          <td>${p.batch_code}</td>
          <td>${p.expiry}</td>
          <td>${p.vendor_name || 'General Supplier'}</td>
          <td>₹${p.purchase_rate || 0}</td>
          <td><b>₹${p.price}</b></td>
          <td><b>${p.stock} units</b></td>
          <td>
            <button class="btn btn-blue" style="padding:2px 8px; font-size:0.75rem;" onclick="editPharmacyStock('${p.id||p.barcode}')">Edit</button>
            <button class="btn btn-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="delPharmacyStock('${p.id||p.barcode}')">Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="9" style="text-align:center;">No stock items found.</td></tr>';
    }

    function editPharmacyStock(id) {
      const item = db.pharmacy.find(p => (p.id && p.id === id) || p.barcode === id);
      if (!item) return alert('Stock item not found');
      document.getElementById('ph-item-id').value = item.id || item.barcode;
      document.getElementById('ph-name').value = item.name;
      document.getElementById('ph-barcode').value = item.barcode;
      document.getElementById('ph-batch').value = item.batch_code;
      document.getElementById('ph-expiry').value = item.expiry;
      if (document.getElementById('ph-purchase-rate')) document.getElementById('ph-purchase-rate').value = item.purchase_rate || 0;
      document.getElementById('ph-price').value = item.price;
      document.getElementById('ph-stock-qty').value = item.stock;
      populateVendorDropdown();
      if (document.getElementById('ph-vendor-select') && item.vendor_name) {
        document.getElementById('ph-vendor-select').value = item.vendor_name;
      }
      openModal('md-pharmacy-stock');
    }

    function renderPharmacySalesHistory() {
      const q = (document.getElementById('ph-sales-search')?.value || '').toLowerCase();
      const tbl = document.getElementById('tbl-pharmacy-sales');
      if (!tbl) return;

      const sales = db.billing.filter(b => b.bill_type === 'POS Retail' || b.rx_no === 'POS');
      const filtered = sales.filter(s => 
        (s.bill_no || '').toLowerCase().includes(q) ||
        (s.patient_name || '').toLowerCase().includes(q) ||
        (s.mobile_no || '').includes(q)
      );

      tbl.innerHTML = filtered.map(s => `
        <tr>
          <td><b>${s.bill_no}</b></td>
          <td>${s.created_at ? new Date(s.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</td>
          <td><b>${s.patient_name}</b></td>
          <td>${s.mobile_no || 'N/A'}</td>
          <td><span class="tab-btn" style="padding:2px 6px; font-size:0.65rem;">${s.pay_mode || 'Cash'}</span></td>
          <td><b>₹${s.total_amount}</b></td>
          <td>
            <button class="btn btn-secondary" style="padding:2px 8px; font-size:0.75rem;" onclick="printPosInvoice('${s.bill_no}')">🖨️ Print Bill</button>
            <button class="btn btn-green" style="padding:2px 8px; font-size:0.75rem;" onclick="whatsappPosInvoice('${s.bill_no}')">💬 WhatsApp</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align:center;">No POS sales recorded yet.</td></tr>';
    }

    function printPosInvoice(billNo) {
      const sale = db.billing.find(b => b.bill_no === billNo);
      if (!sale) return alert('Bill record not found');

      document.getElementById('pos-pr-billno').innerText = sale.bill_no;
      document.getElementById('pos-pr-custname').innerText = sale.patient_name;
      document.getElementById('pos-pr-date').innerText = sale.created_at ? new Date(sale.created_at).toLocaleDateString() : new Date().toLocaleDateString();
      document.getElementById('pos-pr-mobile').innerText = sale.mobile_no || 'N/A';
      document.getElementById('pos-pr-total').innerText = '₹' + sale.total_amount;

      let items = sale.items || [];
      let html = items.map(i => `
        <tr>
          <td style="padding:4px;">${i.name}</td>
          <td style="padding:4px;">${i.batch_code || '-'}</td>
          <td style="padding:4px;">₹${i.price}</td>
          <td style="padding:4px;">${i.qty}</td>
          <td style="padding:4px;">₹${i.total}</td>
        </tr>
      `).join('');

      document.getElementById('pos-pr-tbl-body').innerHTML = html || `<tr><td colspan="5">Retail Medicines Purchase</td></tr>`;

      const printArea = document.getElementById('print-pos-sheet');
      printArea.style.display = 'block';
      window.print();
      printArea.style.display = 'none';
    }

    function whatsappPosInvoice(billNo) {
      const sale = db.billing.find(b => b.bill_no === billNo);
      if (!sale) return alert('Bill record not found');
      if (!sale.mobile_no || sale.mobile_no === 'N/A') return alert('Customer mobile number is missing');

      let msg = `💊 *AASU AROGYAM HERBAL PHARMACY* 💊%0A`;
      msg += `*Retail Cash Memo Invoice*%0A%0A`;
      msg += `*Bill No:* ${sale.bill_no}%0A`;
      msg += `*Customer Name:* ${sale.patient_name}%0A`;
      msg += `*Total Paid:* ₹${sale.total_amount}%0A%0A`;
      msg += `*Items Purchased:*%0A`;

      if (sale.items && sale.items.length) {
        sale.items.forEach(i => {
          msg += `• ${i.name} (Qty: ${i.qty}) - ₹${i.total}%0A`;
        });
      }

      msg += `%0A_Thank you for your visit! Wish you good health._ 🙏`;
      window.open(`https://api.whatsapp.com/send?phone=91${sale.mobile_no}&text=${msg}`);
    }
'''

if 'async function checkoutPosSale()' in html:
    start_pos = html.find('async function checkoutPosSale()')
    html = html[:start_pos] + js_updates + '\n\n    ' + html[start_pos:]

old_checkout = '''    async function checkoutPosSale() {
      if (!posCart.length) return alert('Cart empty');
      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, med.stock - item.qty);
          if (sbClient) await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode);
        }
      }
      alert('Sale Completed & Stock Deducted!');
      posCart = []; closeModal('md-pos'); init();
    }'''

new_checkout = '''    async function checkoutPosSale() {
      if (!posCart.length) return alert('Cart empty');
      const custName = document.getElementById('pos-cust-name')?.value || 'Walk-in Customer';
      const custMobile = document.getElementById('pos-cust-mobile')?.value || 'N/A';
      const payMode = document.getElementById('pos-pay-mode')?.value || 'Cash';
      const grandTotal = posCart.reduce((a,c) => a + c.total, 0);
      const billNo = 'POS-' + Math.floor(100000 + Math.random() * 900000);

      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, med.stock - item.qty);
          if (sbClient) await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode);
        }
      }

      const billPayload = {
        bill_no: billNo,
        rx_no: 'POS',
        patient_name: custName,
        mobile_no: custMobile,
        bill_type: 'POS Retail',
        total_amount: grandTotal,
        paid_amount: grandTotal,
        balance_due: 0,
        payment_status: 'Paid',
        items: posCart
      };

      if (sbClient) {
        try { await sbClient.from('billing').insert([billPayload]); } catch(e){}
      }
      db.billing.unshift({ ...billPayload, created_at: new Date().toISOString(), pay_mode: payMode });

      if (confirm(`✅ POS Sale Completed!\nBill No: ${billNo}\nTotal: ₹${grandTotal}\n\nWould you like to PRINT the customer receipt right now?`)) {
        printPosInvoice(billNo);
      }

      posCart = [];
      closeModal('md-pos');
      init();
    }'''

if old_checkout in html:
    html = html.replace(old_checkout, new_checkout)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Herbal Pharmacy Edit button restored, Sales History tab, POS print receipt, and WhatsApp bill features deployed.")
