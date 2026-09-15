/**
 * MODULE 14: IPD WARD MANAGEMENT ENGINE (TABLE RENDERER)
 */

function getIpdDb() {
  if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
  if (window.sbClient && window.sbClient.from) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.from) return supabaseClient;
  return null;
}

window.ipdState = { beds: [], admissions: [] };

window.loadIpdData = async function() {
  const db = getIpdDb();
  if (!db) return;

  try {
    const [bedsRes, admRes] = await Promise.all([
      db.from('ipd_beds').select('*').order('room_no', { ascending: true }),
      db.from('ipd_admissions').select('*').eq('status', 'Admitted')
    ]);

    window.ipdState.beds = bedsRes.data || [];
    window.ipdState.admissions = admRes.data || [];
    window.renderIpdTable();
  } catch (err) {
    console.error("IPD Load Error:", err);
  }
};

window.renderIpdTable = function() {
  const beds = window.ipdState.beds || [];
  const admissions = window.ipdState.admissions || [];

  // Locate the table body inside the IPD section
  const ipdSection = document.getElementById('mod-ipd') || document.getElementById('ipd');
  if (!ipdSection) return;

  let tbody = ipdSection.querySelector('tbody');
  if (!tbody) {
    const table = ipdSection.querySelector('table');
    if (table) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }
  }

  if (!tbody) return;

  if (beds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #9ca3af; padding: 2rem;">
          No beds allocated yet. Click <strong>+ Allocate IPD Bed</strong> above to set up your ward layout.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = beds.map(bed => {
    const admission = admissions.find(a => a.bed_id === bed.id);
    const isOccupied = bed.status === 'Occupied';
    const statusColor = isOccupied ? '#ef4444' : '#10b981';

    return `
      <tr style="border-bottom: 1px solid #334155; font-size: 0.85rem; color: #f8fafc;">
        <td style="padding: 0.75rem;"><strong>Room ${bed.room_no}</strong> (${bed.bed_no})</td>
        <td style="padding: 0.75rem; color: #cbd5e1;">${bed.ward_type || 'General Ward'}</td>
        <td style="padding: 0.75rem; color: ${isOccupied ? '#ea580c' : '#9ca3af'}; font-weight: ${isOccupied ? 'bold' : 'normal'};">
          ${isOccupied && admission ? admission.patient_name : '—'}
        </td>
        <td style="padding: 0.75rem; color: #9ca3af;">
          ${isOccupied && admission ? new Date(admission.admission_date).toLocaleDateString() : '—'}
        </td>
        <td style="padding: 0.75rem;">₹${parseFloat(bed.daily_rate || 0).toFixed(2)}</td>
        <td style="padding: 0.75rem;">
          <span style="background: rgba(255,255,255,0.05); color: ${statusColor}; border: 1px solid ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
            ${bed.status}
          </span>
        </td>
      </tr>
    `;
  }).join('');
};

// Modals
function ensureIpdModals() {
  if (document.getElementById('modal-add-bed')) return;

  const container = document.createElement('div');
  container.innerHTML = `
    <div id="modal-add-bed" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999; padding: 1rem;">
      <div style="background: #1e293b; width: 450px; max-width: 95vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">+ Allocate New IPD Bed</h3>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">ROOM NUMBER *</label>
          <input type="text" id="bed-room" placeholder="e.g. Room 101" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">BED NUMBER *</label>
          <input type="text" id="bed-no" placeholder="e.g. Bed A" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">WARD TYPE</label>
          <select id="bed-ward" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="General Ward">General Ward</option>
            <option value="Panchakarma Special">Panchakarma Special</option>
            <option value="Deluxe Suite">Deluxe Suite</option>
          </select>
        </div>
        <div style="margin-bottom: 1.2rem;">
          <label style="color: #9ca3af; font-size: 0.8rem; display: block;">DAILY RATE (₹)</label>
          <input type="number" id="bed-rate" placeholder="1500" style="width: 100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="document.getElementById('modal-add-bed').style.display='none'" style="padding: 0.5rem 1rem; background: #475569; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button type="button" onclick="window.saveBed()" style="padding: 0.5rem 1rem; background: #ea580c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Bed</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Hook top "+ Allocate IPD Bed" button to this modal
  const btn = document.querySelector('#mod-ipd button, #ipd button');
  if (btn) btn.onclick = () => document.getElementById('modal-add-bed').style.display = 'flex';
}

window.saveBed = async function() {
  const db = getIpdDb();
  if (!db) return alert("Supabase client unavailable.");

  const room = document.getElementById('bed-room').value.trim();
  const bedNo = document.getElementById('bed-no').value.trim();
  const ward = document.getElementById('bed-ward').value;
  const rate = parseFloat(document.getElementById('bed-rate').value || 0);

  if (!room || !bedNo) return alert("Please enter room and bed number.");

  const { error } = await db.from('ipd_beds').insert([{
    id: 'BED-' + Date.now(),
    room_no: room,
    bed_no: bedNo,
    ward_type: ward,
    daily_rate: rate,
    status: 'Available'
  }]);

  if (error) return alert("Error: " + error.message);

  document.getElementById('modal-add-bed').style.display = 'none';
  window.loadIpdData();
};

document.addEventListener('DOMContentLoaded', () => {
  ensureIpdModals();
  setTimeout(window.loadIpdData, 800);
});
