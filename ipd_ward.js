/**
 * MODULE 14: IPD WARD MANAGEMENT ENGINE (DYNAMIC & ROBUST)
 */

function getIpdDb() {
  if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
  if (window.sbClient && window.sbClient.from) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.from) return supabaseClient;
  return null;
}

// 1. Ensure modal element exists and is freshly formatted
window.ensureCleanModal = function() {
  let modal = document.getElementById('modal-allocate-ipd');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-allocate-ipd';
    modal.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background: #1e293b; width: 480px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; position: relative;">
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
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">PATIENT NAME</label>
        <input type="text" id="ipd-field-patient" placeholder="Full Patient Name" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 0.8rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">ATTENDING VAIDYA / DOCTOR</label>
        <input type="text" id="ipd-field-doctor" placeholder="Vaidya Name" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label style="color: #9ca3af; font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.3rem;">DAILY CHARGE (₹)</label>
        <input type="number" id="ipd-field-rate" value="1500" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
      </div>

      <button type="button" onclick="window.submitIpdAllocation()" style="width: 100%; padding: 0.75rem; background: #ea580c; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">Allocate Bed</button>
    </div>
  `;
};

// 2. Modal open/close handlers with input resets
window.openAllocateModal = function() {
  window.ensureCleanModal();
  const modal = document.getElementById('modal-allocate-ipd');
  if (modal) {
    modal.style.display = 'flex';
    // Generate fresh Bed ID suggestion
    const bedNoField = document.getElementById('ipd-field-bed-no');
    if (bedNoField && bedNoField.value === '') {
      bedNoField.value = 'BED-' + Math.floor(100 + Math.random() * 900);
    }
  }
};

window.closeAllocateModal = function() {
  const modal = document.getElementById('modal-allocate-ipd');
  if (modal) modal.style.display = 'none';
};

// 3. Load live bed allocation and admission data
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

// 4. Populate table rows dynamically
window.renderIpdTable = function(beds, admissions) {
  const ipdSection = document.getElementById('mod-ipd') || document.getElementById('ipd');
  if (!ipdSection) return;

  const tbody = ipdSection.querySelector('tbody');
  if (!tbody) return;

  if (beds.length === 0) {
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

    return `
      <tr style="border-bottom: 1px solid #334155; font-size: 0.85rem; color: #f8fafc;">
        <td style="padding: 0.75rem; font-weight: bold; color: #ea580c;">${bed.bed_no}</td>
        <td style="padding: 0.75rem; color: #cbd5e1;">${bed.ward_type || 'General Ward'}</td>
        <td style="padding: 0.75rem; color: ${isOccupied ? '#ffffff' : '#9ca3af'}; font-weight: ${isOccupied ? 'bold' : 'normal'};">
          ${adm ? adm.patient_name : (bed.patient_name || '—')}
        </td>
        <td style="padding: 0.75rem; color: #9ca3af;">
          ${adm ? new Date(adm.admission_date).toLocaleDateString() : new Date(bed.created_at).toLocaleDateString()}
        </td>
        <td style="padding: 0.75rem;">₹${parseFloat(bed.daily_rate || 0).toFixed(2)}</td>
        <td style="padding: 0.75rem;">
          <span style="background: rgba(255,255,255,0.05); color: ${statusColor}; border: 1px solid ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
            ${isOccupied ? 'Occupied' : 'Available'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
};

// 5. Submit form and reset inputs
window.submitIpdAllocation = async function() {
  const db = getIpdDb();
  if (!db) return alert("Database client initializing... Please try again.");

  const bedNo = document.getElementById('ipd-field-bed-no')?.value.trim();
  const ward = document.getElementById('ipd-field-ward')?.value;
  const patient = document.getElementById('ipd-field-patient')?.value.trim();
  const doctor = document.getElementById('ipd-field-doctor')?.value.trim();
  const rate = parseFloat(document.getElementById('ipd-field-rate')?.value || 1500);

  if (!bedNo) return alert("Please enter a bed number.");

  const bedId = 'BED-' + Date.now();
  const isOccupied = patient.length > 0;

  const { error: bedErr } = await db.from('ipd_beds').insert([{
    id: bedId,
    room_no: bedNo,
    bed_no: bedNo,
    ward_type: ward,
    daily_rate: rate,
    status: isOccupied ? 'Occupied' : 'Available'
  }]);

  if (bedErr) return alert("Error saving bed: " + bedErr.message);

  if (isOccupied) {
    await db.from('ipd_admissions').insert([{
      id: 'ADM-' + Date.now(),
      patient_name: patient,
      doctor_name: doctor,
      bed_id: bedId,
      status: 'Admitted',
      admission_date: new Date().toISOString()
    }]);
  }

  // Reset patient & doctor inputs for next allocation
  if (document.getElementById('ipd-field-patient')) document.getElementById('ipd-field-patient').value = '';
  if (document.getElementById('ipd-field-doctor')) document.getElementById('ipd-field-doctor').value = '';

  window.closeAllocateModal();
  alert("IPD Bed allocated successfully!");
  window.loadIpdData();
};

// 6. Global event delegation for trigger button & initial load
document.addEventListener('click', function(e) {
  const target = e.target.closest('button');
  if (target && target.innerText.includes('Allocate IPD Bed')) {
    e.preventDefault();
    window.openAllocateModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.ensureCleanModal();
  setTimeout(window.loadIpdData, 500);
});