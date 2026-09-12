with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Unified Autocomplete Datalist Population & Event Binding Functions
js_autocompletes = '''
    function populateAllAutocompletes() {
      populateRxPatientDatalist();
      populatePosPatientDatalist();
      populateVendorDatalist();
    }

    /* E-Prescription Desk Autocomplete */
    function populateRxPatientDatalist() {
      const dl = document.getElementById('dl-patients');
      if (!dl) return;
      dl.innerHTML = (db.patients || []).map(p => 
        `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti || 'N/A'}</option>`
      ).join('');
    }

    function onRxPatientSelect() {
      const val = (document.getElementById('rx-p-search')?.value || '').toLowerCase();
      const pat = (db.patients || []).find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        document.getElementById('rx-patient-id').value = pat.id;
        if (document.getElementById('rx-v-mobile')) document.getElementById('rx-v-mobile').value = pat.mobile_no || '';
        if (document.getElementById('rx-v-age')) document.getElementById('rx-v-age').value = pat.age || '';
        if (document.getElementById('rx-v-gender')) document.getElementById('rx-v-gender').value = pat.gender || '';
        if (document.getElementById('rx-v-prakriti')) document.getElementById('rx-v-prakriti').value = pat.prakriti || '';
        if (document.getElementById('rx-v-weight')) document.getElementById('rx-v-weight').value = pat.weight || '';
        if (document.getElementById('rx-v-bp')) document.getElementById('rx-v-bp').value = pat.bp || '120/80';
        if (document.getElementById('rx-v-pulse')) document.getElementById('rx-v-pulse').value = pat.pulse || '72';
      }
    }

    /* Pharmacy POS Registered Patient Autocomplete */
    function populatePosPatientDatalist() {
      const dl = document.getElementById('dl-pos-patients');
      if (!dl) return;
      dl.innerHTML = (db.patients || []).map(p => 
        `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti || 'N/A'}</option>`
      ).join('');
    }

    function onPosPatientSelect() {
      const val = (document.getElementById('pos-p-search')?.value || '').toLowerCase();
      const pat = (db.patients || []).find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        if (document.getElementById('pos-cust-name')) document.getElementById('pos-cust-name').value = pat.full_name;
        if (document.getElementById('pos-cust-mobile')) document.getElementById('pos-cust-mobile').value = pat.mobile_no;
        if (document.getElementById('pos-patient-id')) document.getElementById('pos-patient-id').value = pat.id;
      }
    }

    /* Vendor / Supplier Autocomplete */
    function populateVendorDatalist() {
      const dl = document.getElementById('dl-vendors');
      if (!dl) return;
      const vendors = (db.accounts || []).filter(a => a.entity_type === 'Vendor' || a.entity_type === 'Supplier');
      if (vendors.length > 0) {
        dl.innerHTML = vendors.map(v => `<option value="${v.title}">${v.title} (${v.category || 'Vendor'})</option>`).join('');
      } else {
        dl.innerHTML = '<option value="General Supplier"><option value="Direct Manufacturing / Internal">';
      }
    }
'''

# 2. Inject JS functions before init() execution
if 'function populateAllAutocompletes' not in html:
    start_pos = html.find('async function init()')
    if start_pos != -1:
        html = html[:start_pos] + js_autocompletes + '\n\n    ' + html[start_pos:]

# 3. Ensure init() calls populateAllAutocompletes() on boot
if 'updateDashboardStats();' in html and 'populateAllAutocompletes();' not in html:
    html = html.replace('updateDashboardStats();', 'updateDashboardStats();\n      populateAllAutocompletes();')

# 4. Ensure openModal updates datalists when launching modals
old_open_modal = "function openModal(id) {"
new_open_modal = "function openModal(id) {\n      populateAllAutocompletes();"
if old_open_modal in html and 'populateAllAutocompletes();' not in html.split('function openModal(id) {')[1][:100]:
    html = html.replace(old_open_modal, new_open_modal, 1)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Autocomplete datalists successfully restored and bound across all modules.")
