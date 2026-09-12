with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Add Pharmacy Stock Modal HTML to include Supplier/Vendor, Purchase Rate & Selling Price
old_modal = '''  <!-- MODAL: PHARMACY STOCK -->
  <div id="md-pharmacy-stock" class="modal-overlay">
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-header"><h3>Add Pharmacy Stock</h3><button class="modal-close" onclick="closeModal('md-pharmacy-stock')">✕</button></div>
      <form onsubmit="savePharmacyStock(event)">
        <input type="hidden" id="ph-item-id" />
        <div class="form-group"><label>MEDICINE NAME *</label><input type="text" id="ph-name" class="form-control" required /></div>
        <div class="form-grid grid-2">
          <div class="form-group"><label>BARCODE</label><input type="text" id="ph-barcode" class="form-control" required /></div>
          <div class="form-group"><label>BATCH CODE</label><input type="text" id="ph-batch" class="form-control" required /></div>
        </div>
        <div class="form-grid grid-2">
          <div class="form-group"><label>EXPIRY</label><input type="text" id="ph-expiry" class="form-control" required /></div>
          <div class="form-group"><label>PRICE (₹)</label><input type="number" step="0.01" id="ph-price" class="form-control" required /></div>
        </div>
        <div class="form-group"><label>STOCK QUANTITY</label><input type="number" id="ph-stock-qty" class="form-control" required /></div>
        <button type="submit" class="btn btn-orange" style="width:100%; margin-top:1rem;">Save Inventory Item</button>
      </form>
    </div>
  </div>'''

new_modal = '''  <!-- MODAL: PHARMACY STOCK WITH VENDOR, PURCHASE RATE & SELLING PRICE -->
  <div id="md-pharmacy-stock" class="modal-overlay">
    <div class="modal-container" style="max-width: 580px;">
      <div class="modal-header"><h3>+ Add / Purchase Pharmacy Stock</h3><button class="modal-close" onclick="closeModal('md-pharmacy-stock')">✕</button></div>
      <form onsubmit="savePharmacyStock(event)">
        <input type="hidden" id="ph-item-id" />
        <div class="form-group" style="margin-bottom:0.75rem;">
          <label>MEDICINE NAME *</label>
          <input type="text" id="ph-name" class="form-control" placeholder="e.g. Ashwagandha Churna (100g)" required />
        </div>
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group"><label>BARCODE *</label><input type="text" id="ph-barcode" class="form-control" required /></div>
          <div class="form-group"><label>BATCH CODE *</label><input type="text" id="ph-batch" class="form-control" required /></div>
        </div>
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group"><label>EXPIRY (MM/YYYY) *</label><input type="text" id="ph-expiry" class="form-control" placeholder="12/2028" required /></div>
          <div class="form-group">
            <label>SUPPLIER / VENDOR *</label>
            <select id="ph-vendor-select" class="form-control" required></select>
          </div>
        </div>
        <div class="form-grid grid-3" style="margin-bottom:1.25rem;">
          <div class="form-group"><label>PURCHASE RATE (₹) *</label><input type="number" step="0.01" id="ph-purchase-rate" class="form-control" placeholder="e.g. 180" required /></div>
          <div class="form-group"><label>SELLING PRICE (₹) *</label><input type="number" step="0.01" id="ph-price" class="form-control" placeholder="e.g. 350" required /></div>
          <div class="form-group"><label>STOCK QUANTITY *</label><input type="number" id="ph-stock-qty" class="form-control" placeholder="e.g. 50" required /></div>
        </div>
        <button type="submit" class="btn btn-orange" style="width:100%; justify-content:center; font-size:0.9rem;">Save Inventory Item</button>
      </form>
    </div>
  </div>'''

if old_modal in html:
    html = html.replace(old_modal, new_modal)

# 2. Update JavaScript to fetch Vendors dynamically from db.accounts & save fields
new_ph_js = '''    function populateVendorDropdown() {
      const sel = document.getElementById('ph-vendor-select');
      if (!sel) return;
      const vendors = db.accounts.filter(a => a.entity_type === 'Vendor' || a.entity_type === 'Supplier');
      if (vendors.length > 0) {
        sel.innerHTML = vendors.map(v => `<option value="${v.title}">${v.title}</option>`).join('');
      } else {
        sel.innerHTML = '<option value="General Supplier">General Supplier</option><option value="Direct Manufacturing / Internal">Direct Manufacturing / Internal</option>';
      }
    }

    function openPharmacyStockModal() {
      document.getElementById('ph-item-id').value = '';
      document.getElementById('ph-name').value = '';
      document.getElementById('ph-barcode').value = '890' + Math.floor(1000000 + Math.random() * 9000000);
      document.getElementById('ph-batch').value = 'BATCH-' + new Date().getFullYear() + '-09';
      document.getElementById('ph-expiry').value = '12/2028';
      document.getElementById('ph-purchase-rate').value = '';
      document.getElementById('ph-price').value = '';
      document.getElementById('ph-stock-qty').value = '';
      populateVendorDropdown();
      openModal('md-pharmacy-stock');
    }

    async function savePharmacyStock(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('ph-name').value,
        barcode: document.getElementById('ph-barcode').value,
        batch_code: document.getElementById('ph-batch').value,
        expiry: document.getElementById('ph-expiry').value,
        vendor_name: document.getElementById('ph-vendor-select').value,
        purchase_rate: Number(document.getElementById('ph-purchase-rate').value) || 0,
        price: Number(document.getElementById('ph-price').value) || 0,
        stock: Number(document.getElementById('ph-stock-qty').value) || 0
      };
      if (sbClient) await sbClient.from('pharmacy_stock').insert([payload]);
      else db.pharmacy.unshift(payload);
      closeModal('md-pharmacy-stock'); init();
    }'''

if 'function openPharmacyStockModal()' in html:
    start_pos = html.find('function openPharmacyStockModal()')
    end_pos = html.find('async function delPharmacyStock(id)')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + new_ph_js + '\n\n    ' + html[end_pos:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Add Pharmacy Stock modal updated with Purchase Rate, Selling Price, and dynamic Vendor dropdown.")
