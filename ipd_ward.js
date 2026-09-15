/**
 * MODULE 14: IPD WARD MANAGEMENT ENGINE (UUID & SUPABASE INTEGRATED)
 * Features: Bed Allocation, Clinical Daily Notes, Running Ledger, and Discharge Engine
 */

window.SUPABASE_URL = window.SUPABASE_URL || "https://apmegpiztygfmltrsgkb.supabase.co";
window.SUPABASE_KEY = window.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbWVncGl6dHlnZm1sdHJzZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTA5OTksImV4cCI6MjEwNDY4Njk5OX0.kutc4qsOtMgN-7ggRS6ObclwmZWhgihf5snkxbIzlmA";

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getIpdDb() {
  if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
  if (window.sbClient && window.sbClient.from) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.from) return supabaseClient;
  
  if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    window.sbClient = window.supabaseClient;
    return window.supabaseClient;
  }
  return null;
}

// 1. Fetch Registered Patients into Datalist
window.populateIpdPatientDatalist = async function() {
  const db = getIpdDb();
  const datalist = document.getElementById('dl-ipd-patients');
  if (!datalist) return;

  let patients = [];
  if (window.db && window.db.patients && window.db.patients.length > 0) {
    patients = window.db.patients;
  } else if (db) {
    try {
      const { data } = await db.from('patients').select('*').order('full_name');
      patients = data || [];
    } catch (err) {
      console.error("Error fetching patient datalist:", err);
    }
  }

  datalist.innerHTML = patients.map(p => 
    `<option value="${p.full_name}">${p.uhid || 'AA-P'} | Mobile: ${p.mobile_no || 'N/A'}</option>`
  ).join('');
};

// 2. Build Allocation Modal Structure
window.ensureCleanModal = function() {
  let modal = document.getElementById('modal-allocate-ipd');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-allocate-ipd';
    modal.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background: #1e293b; width: 480px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; position: relative; color: white;">
      <button type="button" onclick="window.closeAllocateModal()" style="position: absolute; right: 1rem; top: 1rem; background: none; border: none; color: #9ca3af; font-size: 1.2rem; cursor: pointer;">✕</button>
      <h3 style="color: white; margin-top: 0; margin-bottom: 1rem;">Allocate IPD Bed</h3>
      
      <div style="margin-bottom: 0.8rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">BED NO *</label>
        <input type="text" id="ipd-field-bed-no" value="BED-101" placeholder="e.g. BED-101" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 0.8rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">WARD TYPE *</label>
        <select id="ipd-field-ward" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
          <option value="General Ward">General Ward</option>
          <option value="Panchakarma Special">Panchakarma Special</option>
          <option value="Deluxe Suite">Deluxe Suite</option>
        </select>
      </div>

      <div style="margin-bottom: 0.8rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">PATIENT NAME (REGISTERED PATIENTS)</label>
        <input type="text" id="ipd-field-patient" list="dl-ipd-patients" placeholder="Type patient name..." style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        <datalist id="dl-ipd-patients"></datalist>
      </div>

      <div style="margin-bottom: 0.8rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">ATTENDING VAIDYA / DOCTOR</label>
        <input type="text" id="ipd-field-doctor" placeholder="Dr. / Vaidya Name" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">DAILY CHARGE (₹)</label>
        <input type="number" id="ipd-field-rate" value="1500" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <button type="button" onclick="window.submitIpdAllocation()" style="width: 100%; padding: 0.75rem; background: #ea580c; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">Allocate Bed & Post Invoice</button>
    </div>
  `;
};

window.openAllocateModal = function() {
  window.ensureCleanModal();
  window.populateIpdPatientDatalist();
  const modal = document.getElementById('modal-allocate-ipd');
  if (modal) {
    modal.style.display = 'flex';
    const bedNoField = document.getElementById('ipd-field-bed-no');
    if (bedNoField && (!bedNoField.value || bedNoField.value === 'BED-101')) {
      bedNoField.value = 'BED-' + Math.floor(100 + Math.random() * 900);
    }
  }
};

window.closeAllocateModal = function() {
  const modal = document.getElementById('modal-allocate-ipd');
  if (modal) modal.style.display = 'none';
};

// 3. Load Beds and Admissions
window.loadIpdData = async function() {
  const db = getIpdDb();
  if (!db) return;

  try {
    const [bedsRes, admRes] = await Promise.all([
      db.from('ipd_beds').select('*').order('created_at', { ascending: false }),
      db.from('ipd_admissions').select('*').eq('status', 'Admitted')
    ]);

    const beds = bedsRes.data || [];
    const admissions = admRes.data || [];
    window.renderIpdTable(beds, admissions);
  } catch (err) {
    console.error("IPD Fetch Error:", err);
  }
};

window.renderIpdTable = function(beds, admissions) {
  const ipdSection = document.getElementById('mod-ipd') || document.getElementById('ipd');
  if (!ipdSection) return;

  const tbody = ipdSection.querySelector('tbody');
  if (!tbody) return;

  if (!beds || beds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #9ca3af; padding: 2rem;">
          No IPD beds allocated yet. Click <strong>+ Allocate IPD Bed</strong> above to add one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = beds.map(bed => {
    const adm = admissions.find(a => a.bed_id === bed.id);
    const isOccupied = bed.status === 'Occupied' || !!adm;
    const statusColor = isOccupied ? '#ef4444' : '#10b981';
    
    const rawPatientName = adm ? adm.patient_name : (bed.patient_name || '');
    const patientName = rawPatientName.trim() !== '' ? rawPatientName : (isOccupied ? 'Admitted Patient' : '—');
    const admId = adm ? adm.id : bed.id;
    const bedNo = bed.bed_no || bed.room_no || 'BED';
    const admDate = adm ? new Date(adm.admission_date).toLocaleDateString() : (bed.admission_date ? new Date(bed.admission_date).toLocaleDateString() : new Date(bed.created_at || Date.now()).toLocaleDateString());

    return `
      <tr style="border-bottom: 1px solid #334155; font-size: 0.85rem; color: #f8fafc;">
        <td style="padding: 0.75rem; font-weight: bold; color: #ea580c;">${bedNo}</td>
        <td style="padding: 0.75rem; color: #cbd5e1;">${bed.ward_type || bed.ward_name || 'General Ward'}</td>
        <td style="padding: 0.75rem; color: ${isOccupied ? '#ffffff' : '#9ca3af'}; font-weight: ${isOccupied ? 'bold' : 'normal'};">
          ${patientName}
        </td>
        <td style="padding: 0.75rem; color: #9ca3af;">
          ${admDate}
        </td>
        <td style="padding: 0.75rem;">₹${parseFloat(bed.daily_rate || bed.daily_charge || 0).toFixed(2)}</td>
        <td style="padding: 0.75rem;">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <span style="background: rgba(255,255,255,0.05); color: ${statusColor}; border: 1px solid ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
              ${isOccupied ? 'Occupied' : 'Available'}
            </span>
            ${isOccupied ? `
              <button type="button" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="window.manageIpdPatient('${admId}', '${bed.id}', '${bedNo}', '${patientName.replace(/'/g, "\\'")}')">
                🏥 Manage & Discharge
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

// 4. Submit Bed Allocation with Valid UUIDs
window.submitIpdAllocation = async function() {
  const db = getIpdDb();
  if (!db) return alert("Database client initialization failed. Please refresh the page.");

  const bedNo = document.getElementById('ipd-field-bed-no')?.value.trim();
  const ward = document.getElementById('ipd-field-ward')?.value;
  const patient = document.getElementById('ipd-field-patient')?.value.trim();
  const doctor = document.getElementById('ipd-field-doctor')?.value.trim();
  const rate = parseFloat(document.getElementById('ipd-field-rate')?.value || 1500);

  if (!bedNo) return alert("Please enter a bed number.");

  const bedId = generateUUID();
  const isOccupied = patient.length > 0;

  const bedPayload = {
    id: bedId,
    bed_no: bedNo,
    ward_type: ward,
    daily_rate: rate,
    status: isOccupied ? 'Occupied' : 'Available'
  };

  const { error: bedErr } = await db.from('ipd_beds').insert([bedPayload]);
  if (bedErr) return alert("Error saving bed: " + bedErr.message);

  if (isOccupied) {
    const admPayload = {
      id: generateUUID(),
      patient_name: patient,
      doctor_name: doctor,
      bed_id: bedId,
      status: 'Admitted',
      admission_date: new Date().toISOString()
    };
    await db.from('ipd_admissions').insert([admPayload]);

    const billNo = 'BILL-IPD-' + Math.floor(100000 + Math.random() * 900000);
    const billPayload = {
      bill_no: billNo,
      rx_no: bedNo,
      patient_name: patient,
      bill_type: 'IPD Admission',
      subtotal: rate,
      total_amount: rate,
      paid_amount: 0,
      balance_due: rate,
      payment_status: 'Unpaid',
      items: [{ type: 'IPD Ward', item: `IPD Bed Allocation (${bedNo} - ${ward})`, price: rate, qty: 1, total: rate }]
    };

    try {
      await db.from('billing').insert([billPayload]);
      if (window.db && window.db.billing) window.db.billing.unshift({ ...billPayload, id: generateUUID() });
    } catch (bErr) {
      console.error("Billing integration error:", bErr);
    }
  }

  if (document.getElementById('ipd-field-patient')) document.getElementById('ipd-field-patient').value = '';
  if (document.getElementById('ipd-field-doctor')) document.getElementById('ipd-field-doctor').value = '';

  window.closeAllocateModal();
  alert(isOccupied ? "IPD Bed allocated & Invoice posted to Central Billing!" : "IPD Bed allocated successfully!");
  
  window.loadIpdData();
  if (typeof window.renderBilling === 'function') window.renderBilling();
  if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
};

window.submitIpdForm = window.submitIpdAllocation;

// 5. Dynamic Modal for Managing Admitted Patients
window.ensureIpdManageModal = function() {
  let modal = document.getElementById('modal-manage-ipd');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-manage-ipd';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;';
    
    modal.innerHTML = `
      <div style="background: #1e293b; width: 850px; max-width: 95vw; max-height: 90vh; overflow-y: auto; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; position: relative; color: white; box-sizing: border-box;">
        <button type="button" onclick="document.getElementById('modal-manage-ipd').style.display='none'" style="position: absolute; right: 1.5rem; top: 1.5rem; background: none; border: none; color: #9ca3af; font-size: 1.2rem; cursor: pointer;">✕</button>
        
        <h3 style="color: #ea580c; margin-top: 0; margin-bottom: 0.2rem;">🏥 Manage IPD Patient</h3>
        <div style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 1.5rem;" id="ipd-manage-subtitle">Loading patient info...</div>
        
        <input type="hidden" id="ipd-manage-adm-id">
        <input type="hidden" id="ipd-manage-bed-id">
        <input type="hidden" id="ipd-manage-bed-no">

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          
          <!-- LEFT COLUMN: DAILY NOTES & VITALS -->
          <div style="background: #0f172a; padding: 1rem; border-radius: 6px; border: 1px solid #334155;">
            <h4 style="color: #38bdf8; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; font-size:0.9rem;">+ Add Daily Vitals & Notes</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">BP (mmHg)</label>
                <input type="text" id="ipd-note-bp" placeholder="120/80" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">PULSE</label>
                <input type="text" id="ipd-note-pulse" placeholder="72" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">TEMP (°F)</label>
                <input type="text" id="ipd-note-temp" placeholder="98.6" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
            </div>
            
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">DOCTOR'S OBSERVATIONS & INSTRUCTIONS</label>
              <textarea id="ipd-note-doc" rows="2" placeholder="Patient condition..." style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem; box-sizing:border-box;"></textarea>
            </div>
            
            <button type="button" style="width: 100%; padding: 0.5rem; background: #2563eb; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.8rem;" onclick="window.saveIpdDailyNote()">Save Daily Note</button>

            <h4 style="color: #9ca3af; margin-top: 1.25rem; font-size: 0.75rem; text-transform: uppercase;">Clinical Progress History</h4>
            <div id="ipd-notes-history" style="max-height: 180px; overflow-y: auto; font-size: 0.8rem; margin-top: 0.5rem;"></div>
          </div>

          <!-- RIGHT COLUMN: RUNNING BILL & DISCHARGE -->
          <div style="background: #0f172a; padding: 1rem; border-radius: 6px; border: 1px solid #334155;">
            <h4 style="color: #10b981; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; font-size:0.9rem;">+ Add Charge to Running Bill</h4>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">ITEM / THERAPY</label>
                <input type="text" id="ipd-charge-item" placeholder="e.g. Shirodhara" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">PRICE (₹)</label>
                <input type="number" id="ipd-charge-price" value="0" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
              <div>
                <label style="font-size:0.7rem; color:#9ca3af; display:block; margin-bottom:0.2rem;">QTY</label>
                <input type="number" id="ipd-charge-qty" value="1" style="width:100%; padding:0.4rem; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; font-size:0.8rem;">
              </div>
            </div>
            
            <button type="button" style="width: 100%; padding: 0.5rem; background: #059669; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.8rem;" onclick="window.addIpdCharge()">Add Charge to Master Bill</button>

            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(234, 88, 12, 0.1); border: 1px solid #ea580c; border-radius: 6px; text-align: center;">
              <h3 style="color: #ea580c; margin: 0 0 0.5rem 0; font-size: 1.2rem;" id="ipd-running-total">Running Total: ₹0.00</h3>
              <p style="font-size: 0.725rem; color: #cbd5e1; margin-bottom: 1rem;">Discharging releases the bed and finalizes the invoice in Central Billing.</p>
              <button type="button" style="width: 100%; padding: 0.75rem; background: #dc2626; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9rem;" onclick="window.processIpdDischarge()">🏁 Discharge Patient & Finalize</button>
            </div>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
};

// 6. Open Dashboard for Specific Patient
window.manageIpdPatient = async function(admId, bedId, bedNo, patientName) {
  window.ensureIpdManageModal();
  const db = getIpdDb();
  if (!db) return alert("Database offline.");

  document.getElementById('ipd-manage-subtitle').innerText = `Patient: ${patientName} | Bed: ${bedNo}`;
  document.getElementById('ipd-manage-adm-id').value = admId;
  document.getElementById('ipd-manage-bed-id').value = bedId;
  document.getElementById('ipd-manage-bed-no').value = bedNo;

  document.getElementById('modal-manage-ipd').style.display = 'flex';
  
  await window.loadIpdNotes(admId);
  await window.loadIpdRunningBill(bedNo);
};

// 7. Save Daily Vitals & Clinical Note
window.saveIpdDailyNote = async function() {
  const db = getIpdDb();
  if (!db) return alert("Database offline.");

  const admId = document.getElementById('ipd-manage-adm-id').value;
  
  const payload = {
    admission_id: admId,
    vitals: {
      bp: document.getElementById('ipd-note-bp').value,
      pulse: document.getElementById('ipd-note-pulse').value,
      temp: document.getElementById('ipd-note-temp').value
    },
    doctor_notes: document.getElementById('ipd-note-doc').value
  };

  const { error } = await db.from('ipd_daily_notes').insert([payload]);
  if (error) return alert("Error saving note: " + error.message);

  document.getElementById('ipd-note-bp').value = '';
  document.getElementById('ipd-note-pulse').value = '';
  document.getElementById('ipd-note-temp').value = '';
  document.getElementById('ipd-note-doc').value = '';
  
  window.loadIpdNotes(admId);
};

// 8. Fetch & Render Clinical Notes
window.loadIpdNotes = async function(admId) {
  const db = getIpdDb();
  if (!db) return;

  const { data } = await db.from('ipd_daily_notes').select('*').eq('admission_id', admId).order('created_at', { ascending: false });
  
  const container = document.getElementById('ipd-notes-history');
  if (!data || data.length === 0) {
    container.innerHTML = "<p style='color:#64748b; text-align:center;'>No clinical notes found for this admission.</p>";
    return;
  }

  container.innerHTML = data.map(n => `
    <div style="border-bottom: 1px solid #334155; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
      <div style="font-size:0.7rem; color:#ea580c; font-weight:bold;">${new Date(n.created_at).toLocaleString()}</div>
      <div style="color:#cbd5e1; margin: 0.2rem 0;"><b>Vitals:</b> BP: ${n.vitals?.bp||'--'} | Pulse: ${n.vitals?.pulse||'--'} | Temp: ${n.vitals?.temp||'--'}</div>
      <div style="color:#f8fafc;">${n.doctor_notes || 'No doctor note.'}</div>
    </div>
  `).join('');
};

// 9. Append Charge to Master Billing Record
window.addIpdCharge = async function() {
  const db = getIpdDb();
  if (!db) return alert("Database offline.");

  const bedNo = document.getElementById('ipd-manage-bed-no').value;
  const item = document.getElementById('ipd-charge-item').value.trim();
  const price = parseFloat(document.getElementById('ipd-charge-price').value) || 0;
  const qty = parseInt(document.getElementById('ipd-charge-qty').value) || 1;
  const total = price * qty;

  if (!item || total <= 0) return alert("Enter a valid item and price.");

  let { data: billRes } = await db.from('billing')
    .select('*')
    .eq('rx_no', bedNo)
    .eq('payment_status', 'Unpaid')
    .maybeSingle();

  if (!billRes) {
    const billNo = 'BILL-IPD-' + Math.floor(100000 + Math.random() * 900000);
    const rawSubtitle = document.getElementById('ipd-manage-subtitle')?.innerText || '';
    const patientName = rawSubtitle.split('|')[0].replace('Patient:', '').trim() || 'Admitted Patient';
    
    const newBill = {
      bill_no: billNo,
      rx_no: bedNo,
      patient_name: patientName,
      bill_type: 'IPD Admission',
      subtotal: total,
      total_amount: total,
      paid_amount: 0,
      balance_due: total,
      payment_status: 'Unpaid',
      items: [{ type: 'IPD Running Charge', item: item, price: price, qty: qty, total: total }]
    };

    const { error: createErr } = await db.from('billing').insert([newBill]);
    if (createErr) return alert("Error creating initial bill: " + createErr.message);
  } else {
    let items = typeof billRes.items === 'string' ? JSON.parse(billRes.items) : (billRes.items || []);
    items.push({ type: 'IPD Running Charge', item: item, price: price, qty: qty, total: total });

    const newTotal = items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

    const { error } = await db.from('billing').update({
      items: items,
      subtotal: newTotal,
      total_amount: newTotal,
      balance_due: newTotal - (parseFloat(billRes.paid_amount) || 0)
    }).eq('id', billRes.id);

    if (error) return alert("Error appending charge: " + error.message);
  }

  document.getElementById('ipd-charge-item').value = '';
  document.getElementById('ipd-charge-price').value = '0';
  document.getElementById('ipd-charge-qty').value = '1';
  
  alert("Charge appended to master bill!");
  window.loadIpdRunningBill(bedNo);
};

// 10. Fetch Running Bill Total
window.loadIpdRunningBill = async function(bedNo) {
  const db = getIpdDb();
  if (!db) return;

  const { data } = await db.from('billing')
    .select('total_amount')
    .eq('rx_no', bedNo)
    .eq('payment_status', 'Unpaid')
    .maybeSingle();
  
  const runningEl = document.getElementById('ipd-running-total');
  if (runningEl) {
    if (data && data.total_amount !== undefined) {
      runningEl.innerText = `Running Total: ₹${parseFloat(data.total_amount).toFixed(2)}`;
    } else {
      runningEl.innerText = `Running Total: ₹0.00`;
    }
  }
};

// 11. Execute Discharge & Release Bed
window.processIpdDischarge = async function() {
  if (!confirm("Are you sure you want to process discharge? This will free the bed and finalize the invoice.")) return;

  const db = getIpdDb();
  if (!db) return alert("Database offline.");

  const admId = document.getElementById('ipd-manage-adm-id').value;
  const bedId = document.getElementById('ipd-manage-bed-id').value;

  await db.from('ipd_admissions').update({ status: 'Discharged', discharge_date: new Date().toISOString() }).eq('id', admId);
  await db.from('ipd_beds').update({ status: 'Available' }).eq('id', bedId);

  document.getElementById('modal-manage-ipd').style.display = 'none';
  alert("Patient Discharged! Bed is now available.");
  
  window.loadIpdData();
  
  if (typeof window.switchTab === 'function') {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 6) window.switchTab('billing', navItems[6]);
  }
};

// 12. Global Event Binding
document.addEventListener('click', function(e) {
  const target = e.target.closest('button');
  if (target && target.innerText.includes('Allocate IPD Bed')) {
    e.preventDefault();
    window.openAllocateModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.ensureCleanModal();
  window.ensureIpdManageModal();
  setTimeout(window.loadIpdData, 500);
});