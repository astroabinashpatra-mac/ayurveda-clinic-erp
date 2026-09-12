with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace POS Customer form inputs with Dropdown Selection (OTC vs Registered Patient)
old_pos_customer_section = '''      <div class="form-grid grid-3" style="margin-bottom:0.75rem;">
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
      </div>'''

new_pos_customer_section = '''      <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
        <div class="form-group">
          <label>CUSTOMER TYPE *</label>
          <select id="pos-customer-type" class="form-control" onchange="togglePosCustomerType(this.value)">
            <option value="otc">Over The Counter Sale</option>
            <option value="registered">Registered Patient</option>
          </select>
        </div>
        <div class="form-group">
          <label>PAYMENT MODE *</label>
          <select id="pos-pay-mode" class="form-control">
            <option>Cash</option>
            <option>UPI / QR</option>
            <option>Card</option>
          </select>
        </div>
      </div>

      <!-- Option 1: Over The Counter Sale Fields -->
      <div id="pos-otc-fields" class="form-grid grid-2" style="margin-bottom:0.75rem;">
        <div class="form-group">
          <label>CUSTOMER NAME *</label>
          <input type="text" id="pos-cust-name" class="form-control" value="Walk-in Customer" />
        </div>
        <div class="form-group">
          <label>CUSTOMER MOBILE NO *</label>
          <input type="text" id="pos-cust-mobile" class="form-control" placeholder="10-digit mobile" />
        </div>
      </div>

      <!-- Option 2: Registered Patient Autocomplete -->
      <div id="pos-reg-fields" class="form-group" style="margin-bottom:0.75rem; display:none;">
        <label>SELECT REGISTERED PATIENT (AUTO-COMPLETE) *</label>
        <input type="text" id="pos-p-search" list="dl-pos-patients" class="form-control" placeholder="Type Patient Name or Mobile No..." oninput="onPosPatientSelect()" />
        <datalist id="dl-pos-patients"></datalist>
        <input type="hidden" id="pos-reg-patient-id" />
      </div>'''

if old_pos_customer_section in html:
    html = html.replace(old_pos_customer_section, new_pos_customer_section)

# Add helper JS functions for POS Customer Toggle and Autocomplete handling
pos_js_helpers = '''    function togglePosCustomerType(type) {
      if (type === 'registered') {
        document.getElementById('pos-otc-fields').style.display = 'none';
        document.getElementById('pos-reg-fields').style.display = 'block';
        renderPosPatientDataList();
      } else {
        document.getElementById('pos-otc-fields').style.display = 'grid';
        document.getElementById('pos-reg-fields').style.display = 'none';
        document.getElementById('pos-cust-name').value = 'Walk-in Customer';
        document.getElementById('pos-cust-mobile').value = '';
        document.getElementById('pos-p-search').value = '';
        document.getElementById('pos-reg-patient-id').value = '';
      }
    }

    function renderPosPatientDataList() {
      const dl = document.getElementById('dl-pos-patients');
      if (dl) {
        dl.innerHTML = db.patients.map(p => `<option value="${p.full_name} (${p.mobile_no})">${p.uhid} | Age: ${p.age} | ${p.prakriti}</option>`).join('');
      }
    }

    function onPosPatientSelect() {
      const val = document.getElementById('pos-p-search').value.toLowerCase();
      const pat = db.patients.find(p => `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || p.mobile_no === val || p.full_name.toLowerCase() === val);
      if (pat) {
        document.getElementById('pos-cust-name').value = pat.full_name;
        document.getElementById('pos-cust-mobile').value = pat.mobile_no;
        document.getElementById('pos-reg-patient-id').value = pat.id;
      }
    }'''

if 'function populatePosDropdown()' in html:
    html = html.replace('function populatePosDropdown() {', pos_js_helpers + '\n\n    function populatePosDropdown() {\n      togglePosCustomerType("otc");')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("POS Customer selector (OTC / Registered Patient Autocomplete) updated successfully.")
