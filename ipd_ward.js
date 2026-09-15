/**
 * MODULE 14: IPD WARD MANAGEMENT ENGINE
 * Directly persistent modal data binder for Supabase
 */

function getIpdDb() {
  if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
  if (window.sbClient && window.sbClient.from) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.from) return supabaseClient;
  return null;
}

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

window.submitIpdAllocation = async function() {
  const db = getIpdDb();
  if (!db) return alert("Database client initializing... Please try again in a moment.");

  // Direct element lookup with fallback to generic inputs
  const bedNoInput = document.getElementById('ipd-field-bed-no') || document.querySelector('input[placeholder*="BED-"]');
  const wardSelect = document.getElementById('ipd-field-ward') || document.querySelector('select');
  const patientInput = document.getElementById('ipd-field-patient') || document.querySelector('input[placeholder*="Patient"]');
  const doctorInput = document.getElementById('ipd-field-doctor') || document.querySelector('input[placeholder*="Vaidya"]');
  const rateInput = document.getElementById('ipd-field-rate') || document.querySelector('input[type="number"]');

  const bedNo = bedNoInput ? bedNoInput.value.trim() : 'BED-' + Math.floor(100 + Math.random() * 900);
  const wardType = wardSelect ? wardSelect.value : 'General Ward';
  const patientName = patientInput ? patientInput.value.trim() : '';
  const doctorName = doctorInput ? doctorInput.value.trim() : '';
  const dailyRate = rateInput ? parseFloat(rateInput.value) || 1500 : 1500;

  if (!bedNo) return alert("Please enter a bed number.");

  const bedId = 'BED-' + Date.now();
  const isOccupied = patientName.length > 0;

  // 1. Insert Bed Record
  const { error: bedErr } = await db.from('ipd_beds').insert([{
    id: bedId,
    room_no: bedNo,
    bed_no: bedNo,
    ward_type: wardType,
    daily_rate: dailyRate,
    status: isOccupied ? 'Occupied' : 'Available'
  }]);

  if (bedErr) return alert("Error creating bed: " + bedErr.message);

  // 2. Insert Admission Record if Patient Name provided
  if (isOccupied) {
    await db.from('ipd_admissions').insert([{
      id: 'ADM-' + Date.now(),
      patient_name: patientName,
      doctor_name: doctorName,
      bed_id: bedId,
      status: 'Admitted',
      admission_date: new Date().toISOString()
    }]);
  }

  // Close Modal
  const visibleModals = document.querySelectorAll('div[style*="display: flex"], div[style*="display:block"], .modal-overlay');
  visibleModals.forEach(m => {
    if (m.innerText.includes('Allocate IPD Bed')) m.style.display = 'none';
  });

  alert("IPD Bed allocated successfully!");
  window.loadIpdData();
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const allocBtns = document.querySelectorAll('button');
    allocBtns.forEach(b => {
      if (b.innerText.trim() === 'Allocate Bed') {
        b.onclick = (e) => {
          e.preventDefault();
          window.submitIpdAllocation();
        };
      }
    });
    window.loadIpdData();
  }, 500);
});
