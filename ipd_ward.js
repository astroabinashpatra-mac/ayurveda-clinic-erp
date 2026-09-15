/**
 * MODULE 14 - IPD WARD MANAGEMENT ENGINE
 * Features: Bed Management, Patient Admission/Discharge, Occupancy KPIs
 */

function getDb() {
  return window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

window.ipdState = {
  beds: [],
  admissions: []
};

// Data Loading Engine
window.loadIpdData = async function() {
  const db = getDb();
  if (!db) return;

  try {
    const [bedsRes, admRes] = await Promise.all([
      db.from('ipd_beds').select('*').order('room_no', { ascending: true }),
      db.from('ipd_admissions').select('*').eq('status', 'Admitted')
    ]);

    window.ipdState.beds = bedsRes.data || [];
    window.ipdState.admissions = admRes.data || [];

    window.renderIpdDashboard();
  } catch (err) {
    console.error("IPD Load Error:", err);
  }
};

// Dynamic Dashboard & Bed Cards Renderer
window.renderIpdDashboard = function() {
  const beds = window.ipdState.beds || [];
  const admissions = window.ipdState.admissions || [];

  const total = beds.length;
  const occupied = beds.filter(b => b.status === 'Occupied').length;
  const available = beds.filter(b => b.status === 'Available').length;
  const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0.0';

  if (document.getElementById('kpi-ipd-total')) document.getElementById('kpi-ipd-total').innerText = total;
  if (document.getElementById('kpi-ipd-occupied')) document.getElementById('kpi-ipd-occupied').innerText = occupied;
  if (document.getElementById('kpi-ipd-available')) document.getElementById('kpi-ipd-available').innerText = available;
  if (document.getElementById('kpi-ipd-rate')) document.getElementById('kpi-ipd-rate').innerText = rate + '%';

  const grid = document.getElementById('ipd-beds-grid');
  if (!grid) return;

  if (beds.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #9ca3af; padding: 2rem; background: #1e293b; border-radius: 8px;">No beds configured yet. Click "+ Add New Bed" to set up your ward layout.</div>';
    return;
  }

  grid.innerHTML = beds.map(bed => {
    const admission = admissions.find(a => a.bed_id === bed.id);
    const isOccupied = bed.status === 'Occupied';
    const isMaintenance = bed.status === 'Maintenance';

    let statusColor = '#10b981';
    if (isOccupied) statusColor = '#ef4444';
    if (isMaintenance) statusColor = '#f59e0b';

    return `
      <div style="background: #1e293b; border: 1px solid #334155; border-top: 4px solid ${statusColor}; border-radius: 8px; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <span style="color: #9ca3af; font-size: 0.75rem; font-weight: bold;">ROOM ${bed.room_no}</span>
            <h3 style="color: white; margin: 0.1rem 0 0 0; font-size: 1.1rem;">Bed ${bed.bed_no}</h3>
          </div>
          <span style="background: rgba(255,255,255,0.05); color: ${statusColor}; border: 1px solid ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
            ${bed.status}
          </span>
        </div>

        <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.8rem;">
          <div><strong>Ward:</strong> ${bed.ward_type || 'General'}</div>
          <div><strong>Tariff:</strong> ₹${parseFloat(bed.daily_rate || 0).toFixed(2)}/day</div>
        </div>

        ${isOccupied && admission ? `
          <div style="background: #0f172a; padding: 0.65rem; border-radius: 6px; margin-bottom: 0.8rem; font-size: 0.8rem; color: white;">
            <div style="color: #ea580c; font-weight: bold; margin-bottom: 0.2rem;">👤 ${admission.patient_name}</div>
            <div style="color: #9ca3af;">Doctor: ${admission.doctor_name || 'Vaidya Unassigned'}</div>
            <div style="color: #9ca3af;">Admitted: ${new Date(admission.admission_date).toLocaleDateString()}</div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          ${!isOccupied ? `
            <button type="button" onclick="window.openAdmitModal('${bed.id}')" style="background: #10b981; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: bold;">Admit Patient</button>
          ` : `
            <button type="button" onclick="window.dischargePatient('${admission?.id}', '${bed.id}')" style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: bold;">Discharge</button>
          `}
        </div>
      </div>
    `;
  }).join('');
};

// Inject IPD Modals into DOM
function ensureIpdModals() {
  let container = document.getElementById('ipd-modals-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ipd-modals-container';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <!-- Add Bed Modal -->
    <div id="modal-add-bed" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 450px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">+ Configure IPD Bed</h3>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">ROOM NUMBER *</label>
          <input type="text" id="bed-room" placeholder="e.g. 101, Deluxe 2" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">BED NUMBER *</label>
          <input type="text" id="bed-no" placeholder="e.g. Bed A, B-01" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">WARD TYPE</label>
          <select id="bed-ward" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="General Ward">General Ward</option>
            <option value="Panchakarma Special">Panchakarma Special</option>
            <option value="Deluxe Private Suite">Deluxe Private Suite</option>
          </select>
        </div>
        <div style="margin-bottom: 1.2rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">DAILY TARIFF (₹)</label>
          <input type="number" id="bed-rate" placeholder="1500" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="document.getElementById('modal-add-bed').style.display='none'" style="padding: 0.5rem 1rem; background: #475569; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button type="button" onclick="window.saveBed()" style="padding: 0.5rem 1rem; background: #ea580c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Bed</button>
        </div>
      </div>
    </div>

    <!-- Patient Admission Modal -->
    <div id="modal-admit-patient" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 480px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">🏥 IPD Patient Admission</h3>
        <input type="hidden" id="adm-target-bed-id">
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">PATIENT NAME *</label>
          <input type="text" id="adm-patient-name" placeholder="Full Patient Name" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">ATTENDING VAIDYA / DOCTOR</label>
          <input type="text" id="adm-doctor" placeholder="Dr. / Vaidya Name" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 1.2rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">PRIMARY DIAGNOSIS / CLINICAL NOTES</label>
          <textarea id="adm-diagnosis" rows="2" placeholder="e.g. Vata Vyadhi / Panchakarma Shodhana" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;"></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="document.getElementById('modal-admit-patient').style.display='none'" style="padding: 0.5rem 1rem; background: #475569; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button type="button" onclick="window.saveAdmission()" style="padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Confirm Admission</button>
        </div>
      </div>
    </div>
  `;
}

// Modal Triggers
window.openAddBedModal = function() {
  ensureIpdModals();
  document.getElementById('modal-add-bed').style.display = 'flex';
};

window.openAdmitModal = function(bedId) {
  ensureIpdModals();
  document.getElementById('adm-target-bed-id').value = bedId;
  document.getElementById('modal-admit-patient').style.display = 'flex';
};

// Database Actions
window.saveBed = async function() {
  const db = getDb();
  if (!db) return;

  const room = document.getElementById('bed-room').value.trim();
  const bedNo = document.getElementById('bed-no').value.trim();
  const ward = document.getElementById('bed-ward').value;
  const rate = parseFloat(document.getElementById('bed-rate').value || 0);

  if (!room || !bedNo) return alert("Please enter room number and bed number.");

  const { error } = await db.from('ipd_beds').insert([{
    id: 'BED-' + Date.now(),
    room_no: room,
    bed_no: bedNo,
    ward_type: ward,
    daily_rate: rate,
    status: 'Available'
  }]);

  if (error) return alert("Save Error: " + error.message);

  document.getElementById('modal-add-bed').style.display = 'none';
  window.loadIpdData();
};

window.saveAdmission = async function() {
  const db = getDb();
  if (!db) return;

  const bedId = document.getElementById('adm-target-bed-id').value;
  const pName = document.getElementById('adm-patient-name').value.trim();
  const doc = document.getElementById('adm-doctor').value.trim();
  const diag = document.getElementById('adm-diagnosis').value.trim();

  if (!pName) return alert("Please enter patient name.");

  // Insert admission
  const { error: admErr } = await db.from('ipd_admissions').insert([{
    id: 'ADM-' + Date.now(),
    patient_name: pName,
    bed_id: bedId,
    doctor_name: doc,
    diagnosis: diag,
    status: 'Admitted',
    admission_date: new Date().toISOString()
  }]);

  if (admErr) return alert("Admission Error: " + admErr.message);

  // Update bed status to Occupied
  await db.from('ipd_beds').update({ status: 'Occupied' }).eq('id', bedId);

  document.getElementById('modal-admit-patient').style.display = 'none';
  window.loadIpdData();
};

window.dischargePatient = async function(admissionId, bedId) {
  if (!confirm("Are you sure you want to discharge this patient?")) return;

  const db = getDb();
  if (!db) return;

  if (admissionId) {
    await db.from('ipd_admissions').update({
      status: 'Discharged',
      discharge_date: new Date().toISOString()
    }).eq('id', admissionId);
  }

  await db.from('ipd_beds').update({ status: 'Available' }).eq('id', bedId);

  alert("Patient discharged successfully.");
  window.loadIpdData();
};

document.addEventListener('DOMContentLoaded', () => {
  ensureIpdModals();
  setTimeout(window.loadIpdData, 500);
});
