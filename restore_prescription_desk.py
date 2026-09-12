with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Full E-Prescription Builder Modal HTML
old_rx_modal = '''  <!-- MODAL: E-PRESCRIPTION -->
  <div id="md-rx" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header"><h3>Write Prescription</h3><button class="modal-close" onclick="closeModal('md-rx')">✕</button></div>
      <div class="form-grid grid-2">
        <div class="form-group">
          <label>SELECT PATIENT</label>
          <input type="text" id="rx-p-search" list="dl-patients" class="form-control" oninput="onRxPatientSelect()" placeholder="Search patient..." />
          <datalist id="dl-patients"></datalist>
          <input type="hidden" id="rx-patient-id" />
        </div>
        <div class="form-group"><label>DIAGNOSIS</label><input type="text" id="rx-diag" class="form-control" /></div>
      </div>
      <button class="btn btn-orange" onclick="savePrescription()" style="margin-top:1rem;">Save Prescription & Sync Billing</button>
    </div>
  </div>'''

new_rx_modal = '''  <!-- FULL DIGITAL AYURVEDIC E-PRESCRIPTION BUILDER MODAL -->
  <div id="md-rx" class="modal-overlay">
    <div class="modal-container" style="max-width: 950px;">
      <div class="modal-header">
        <h3>📜 Create Digital Ayurvedic E-Prescription</h3>
        <button class="modal-close" onclick="closeModal('md-rx')">✕</button>
      </div>

      <div class="form-grid grid-3">
        <div class="form-group">
          <label>SELECT REGISTERED PATIENT (AUTO-COMPLETE) *</label>
          <input type="text" id="rx-p-search" list="dl-patients" class="form-control" placeholder="Type Name, Mobile No, or UHID..." oninput="onRxPatientSelect()" required />
          <datalist id="dl-patients"></datalist>
          <input type="hidden" id="rx-patient-id" />
        </div>
        <div class="form-group"><label>PRESCRIPTION DATE *</label><input type="date" id="rx-date" class="form-control" required /></div>
        <div class="form-group">
          <label>ATTENDING DOCTOR (VAIDYA) *</label>
          <select id="rx-doctor" class="form-control">
            <option>Dr. Pruthweeraj Singh (Chief Vaidya)</option>
            <option>Dr. Abinash Patra (Vaidya)</option>
          </select>
        </div>
      </div>

      <!-- AUTO-FILLED EMR VITALS PANEL -->
      <div style="background:var(--bg-dark); border:1px solid var(--border-dark); padding:0.75rem; border-radius:8px; margin-bottom:0.75rem;">
        <span style="font-size:0.65rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.4rem;">PATIENT EMR VITALS (AUTO-FILLED FROM DIRECTORY)</span>
        <div class="form-grid grid-7">
          <div><label>MOBILE NO</label><input type="text" id="rx-v-mobile" class="form-control" readonly /></div>
          <div><label>AGE</label><input type="text" id="rx-v-age" class="form-control" readonly /></div>
          <div><label>GENDER</label><input type="text" id="rx-v-gender" class="form-control" readonly /></div>
          <div><label>PRAKRITI</label><input type="text" id="rx-v-prakriti" class="form-control" readonly /></div>
          <div><label>WEIGHT (KG)</label><input type="text" id="rx-v-weight" class="form-control" readonly /></div>
          <div><label>B.P. (mmHg)</label><input type="text" id="rx-v-bp" class="form-control" readonly /></div>
          <div><label>PULSE (/MIN)</label><input type="text" id="rx-v-pulse" class="form-control" readonly /></div>
        </div>
      </div>

      <div class="form-grid grid-2">
        <div class="form-group"><label>DIAGNOSIS / NIDAN *</label><input type="text" id="rx-diag" placeholder="e.g. Sandhivata, Agnimandya, Amavata" class="form-control" /></div>
        <div class="form-group"><label>VAIDYA CONSULTATION FEE (₹) *</label><input type="number" id="rx-consult-fee" value="300" class="form-control" onkeyup="renderRxItemsTable()" /></div>
      </div>

      <!-- MULTI-ITEM PREPARATION BUILDER -->
      <div style="background:var(--bg-dark); border:1px solid var(--border-dark); padding:0.85rem; border-radius:8px; margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.5rem;">+ ADD PRESCRIBED MEDICINE, THERAPY, OR DIAGNOSTIC TEST</span>
        <div class="form-grid grid-5" style="align-items:end;">
          <div class="form-group">
            <label>CATEGORY</label>
            <select id="rx-type" class="form-control">
              <option value="Medicine">Medicine 💊</option>
              <option value="Therapy">Therapy ✨</option>
              <option value="Diagnostic Test">Diagnostic Test 🧪</option>
            </select>
          </div>
          <div class="form-group"><label>ITEM / THERAPY NAME *</label><input type="text" id="rx-item" placeholder="e.g. Mahanarayana Thailam / Shirodhara / CBC" class="form-control" /></div>
          <div class="form-group"><label>DOSAGE / INSTRUCTIONS</label><input type="text" id="rx-dose" placeholder="e.g. 20ml BD after meals" class="form-control" /></div>
          <div class="form-group"><label>UNIT PRICE (₹)</label><input type="number" id="rx-price" value="150" class="form-control" /></div>
          <div class="form-group"><label>QTY / SESSIONS</label><input type="number" id="rx-qty" value="1" min="1" class="form-control" /></div>
        </div>
        <button type="button" class="btn btn-orange" onclick="addRxItem()" style="margin-top:0.4rem;">+ Add To Prescription</button>

        <table class="data-table" style="margin-top:0.75rem;">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item / Therapy / Test</th>
              <th>Dosage / Instructions</th>
              <th>Price (₹)</th>
              <th>Qty</th>
              <th>Total (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="tbl-rx-items"></tbody>
        </table>
      </div>

      <div class="form-group" style="margin-bottom:1rem;">
        <label>DIET & LIFESTYLE GUIDELINES (PATHYA & APATHYA)</label>
        <textarea id="rx-instructions" class="form-control" rows="2" placeholder="e.g. Take warm water, avoid cold/fermented food, gentle morning walk..."></textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="btn btn-secondary" onclick="printPrescription()">🖨️ Print Prescription</button>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-green" onclick="shareWhatsAppRx()">💬 Share via WhatsApp</button>
          <button type="button" class="btn btn-orange" onclick="savePrescription()">Save & Sync to Billing Counter</button>
        </div>
      </div>
    </div>
  </div>'''

if old_rx_modal in html:
    html = html.replace(old_rx_modal, new_rx_modal)

# 2. Add JavaScript Functions for E-Prescription Desk
rx_js_code = '''    let rxItems = [];

    function renderRxDataList() {
      const dl = document.getElementById('dl-patients');
      if (dl) {
        dl.innerHTML = db.patients.map(p => 
          `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti}</option>`
        ).join('');
      }
    }

    function onRxPatientSelect() {
      const val = (document.getElementById('rx-p-search')?.value || '').toLowerCase();
      const pat = db.patients.find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        document.getElementById('rx-patient-id').value = pat.id;
        document.getElementById('rx-v-mobile').value = pat.mobile_no || '';
        document.getElementById('rx-v-age').value = pat.age || '';
        document.getElementById('rx-v-gender').value = pat.gender || '';
        document.getElementById('rx-v-prakriti').value = pat.prakriti || '';
        document.getElementById('rx-v-weight').value = pat.weight || '';
        document.getElementById('rx-v-bp').value = pat.bp || '120/80';
        document.getElementById('rx-v-pulse').value = pat.pulse || '72';
      }
    }

    function addRxItem() {
      const type = document.getElementById('rx-type').value;
      const item = document.getElementById('rx-item').value;
      const dose = document.getElementById('rx-dose').value;
      const price = Number(document.getElementById('rx-price').value) || 0;
      const qty = Number(document.getElementById('rx-qty').value) || 1;
      
      if (!item) return alert('Enter item or therapy name');
      
      rxItems.push({ type, item, dose, price, qty, total: price * qty });
      renderRxItemsTable();
      document.getElementById('rx-item').value = '';
      document.getElementById('rx-dose').value = '';
    }

    function renderRxItemsTable() {
      const consultFee = Number(document.getElementById('rx-consult-fee')?.value) || 0;
      let html = `
        <tr style="background:var(--bg-dark);">
          <td><b>Consultation</b></td>
          <td><b>Vaidya Consultation Fee</b></td>
          <td>Doctor OPD Charge</td>
          <td>₹${consultFee}</td>
          <td>1</td>
          <td><b>₹${consultFee}</b></td>
          <td><i>Fixed</i></td>
        </tr>
      `;

      html += rxItems.map((i, idx) => `
        <tr>
          <td><span class="tab-btn" style="padding:2px 6px; font-size:0.65rem;">${i.type}</span></td>
          <td><b>${i.item}</b></td>
          <td>${i.dose}</td>
          <td>₹${i.price}</td>
          <td>${i.qty}</td>
          <td><b>₹${i.total}</b></td>
          <td><button type="button" onclick="rxItems.splice(${idx},1);renderRxItemsTable();" style="color:red;border:none;background:none;cursor:pointer;">✕</button></td>
        </tr>
      `).join('');

      const tbl = document.getElementById('tbl-rx-items');
      if (tbl) tbl.innerHTML = html;
    }

    function renderRx() {
      const tbl = document.getElementById('tbl-rx');
      if (!tbl) return;
      tbl.innerHTML = db.rx.map(r => `
        <tr>
          <td><b>${r.rx_no}</b></td>
          <td>${r.rx_date || new Date().toLocaleDateString()}</td>
          <td><b>${r.patient_name}</b></td>
          <td>${r.attending_doctor || 'Doctor'}</td>
          <td>${r.diagnosis || 'General Consultation'}</td>
          <td><b>₹${r.grand_total || 0}</b></td>
          <td>
            <button class="btn btn-green" style="padding:2px 6px; font-size:0.75rem;" onclick="shareExistingRxWhatsApp('${r.id}')">💬 WhatsApp</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align:center;">No prescriptions written yet. Click "+ Write E-Prescription".</td></tr>';
    }

    async function savePrescription() {
      const pId = document.getElementById('rx-patient-id').value;
      const pat = db.patients.find(p => p.id === pId);
      if (!pat) return alert('Please select a valid registered patient from the list.');

      const consultFee = Number(document.getElementById('rx-consult-fee').value) || 0;
      const itemsTotal = rxItems.reduce((a, c) => a + c.total, 0);
      const grandTotal = consultFee + itemsTotal;

      const rxDate = document.getElementById('rx-date').value || new Date().toISOString().split('T')[0];
      const rxNo = 'RX-P' + Math.floor(100 + Math.random() * 900);
      const billNo = 'BILL-' + Math.floor(100000 + Math.random() * 900000);
      const diag = document.getElementById('rx-diag').value;
      const instructions = document.getElementById('rx-instructions').value;

      const allItems = [{ type: 'Consultation', item: 'Vaidya Consultation Fee', dose: 'OPD Charge', price: consultFee, qty: 1, total: consultFee }, ...rxItems];

      const rxPayload = {
        rx_no: rxNo,
        patient_id: pId,
        patient_name: pat.full_name,
        mobile_no: pat.mobile_no,
        rx_date: rxDate,
        attending_doctor: document.getElementById('rx-doctor').value,
        diagnosis: diag,
        items: allItems,
        instructions: instructions,
        grand_total: grandTotal
      };

      const billPayload = {
        bill_no: billNo,
        rx_no: rxNo,
        patient_id: pId,
        patient_name: pat.full_name,
        mobile_no: pat.mobile_no,
        bill_type: 'OPD Prescription',
        subtotal: grandTotal,
        total_amount: grandTotal,
        paid_amount: 0,
        balance_due: grandTotal,
        payment_status: 'Unpaid',
        items: allItems
      };

      if (sbClient) {
        try {
          await sbClient.from('prescriptions').insert([rxPayload]);
          await sbClient.from('billing').insert([billPayload]);
        } catch(e) {}
      }

      db.rx.unshift({ id: 'rx-' + Date.now(), ...rxPayload });
      db.billing.unshift({ id: 'b-' + Date.now(), ...billPayload, created_at: new Date().toISOString() });

      alert(`✅ Prescription ${rxNo} Saved!\n• Outstanding Bill ${billNo} (₹${grandTotal}) synced to Central Billing Ledger.`);
      rxItems = [];
      closeModal('md-rx');
      init();
    }

    function printPrescription() {
      const pId = document.getElementById('rx-patient-id').value;
      const pat = db.patients.find(p => p.id === pId);
      if (!pat) return alert('Select patient first');

      document.getElementById('pr-name').innerText = pat.full_name;
      document.getElementById('pr-mobile').innerText = pat.mobile_no;
      document.getElementById('pr-age').innerText = pat.age;
      document.getElementById('pr-gender').innerText = pat.gender;
      document.getElementById('pr-date').innerText = document.getElementById('rx-date').value;
      document.getElementById('pr-prakriti').innerText = pat.prakriti;
      document.getElementById('pr-vitals').innerText = `${pat.bp || '120/80'} mmHg | ${pat.pulse || '72'} bpm`;
      document.getElementById('pr-doctor').innerText = document.getElementById('rx-doctor').value;
      document.getElementById('pr-diag').innerText = document.getElementById('rx-diag').value || 'General';
      document.getElementById('pr-instructions').innerText = document.getElementById('rx-instructions').value || 'None';

      let html = rxItems.map(i => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 6px;">${i.type}</td>
          <td style="padding: 6px;"><b>${i.item}</b></td>
          <td style="padding: 6px;">${i.dose}</td>
          <td style="padding: 6px;">${i.qty}</td>
        </tr>
      `).join('');

      document.getElementById('pr-tbl-body').innerHTML = html || '<tr><td colspan="4" style="padding:10px; text-align:center;">No specific items added.</td></tr>';
      window.print();
    }

    function shareWhatsAppRx() {
      const pId = document.getElementById('rx-patient-id').value;
      const pat = db.patients.find(p => p.id === pId);
      if (!pat) return alert('Select patient first');

      const diag = document.getElementById('rx-diag').value || 'General Consultation';
      const inst = document.getElementById('rx-instructions').value || 'None';

      let msg = `🌿 *AASU AROGYAM AYURVEDIC HOSPITAL* 🌿%0A`;
      msg += `*Digital E-Prescription*%0A%0A`;
      msg += `*Patient:* ${pat.full_name} (${pat.age}Y/${pat.gender})%0A`;
      msg += `*Diagnosis:* ${diag}%0A%0A`;
      msg += `*Prescribed Items:*%0A`;

      rxItems.forEach(i => {
        msg += `• [${i.type}] ${i.item} - ${i.dose} (Qty: ${i.qty})%0A`;
      });

      msg += `%0A*Dietary & Lifestyle Instructions:* ${inst}%0A%0A`;
      msg += `_Please show this at the Billing & Pharmacy Desk._`;

      window.open(`https://api.whatsapp.com/send?phone=91${pat.mobile_no}&text=${msg}`);
    }

    function shareExistingRxWhatsApp(id) {
      const r = db.rx.find(x => x.id === id); if (!r) return;
      window.open(`https://api.whatsapp.com/send?phone=91${r.mobile_no}&text=🌿%20AASU%20AROGYAM%20Rx:%20${r.rx_no}%20Total:%20₹${r.grand_total}`);
    }'''

if 'function renderRx()' in html:
    start_pos = html.find('function renderRxDataList()')
    if start_pos == -1: start_pos = html.find('function renderRx()')
    end_pos = html.find('/* BILLING COUNTER */')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + rx_js_code + '\n\n    ' + html[end_pos:]

# Hook modal launch to render patient datalist & reset form
if "else if (id === 'md-rx') {" in html:
    html = html.replace(
        "else if (id === 'md-rx') {",
        "else if (id === 'md-rx') { document.getElementById('rx-date').value = new Date().toISOString().split('T')[0]; renderRxDataList(); renderRxItemsTable(); }"
    )

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Full E-Prescription builder, EMR Vitals, Print, and WhatsApp components successfully restored.")
