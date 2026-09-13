/**
 * AUSHADHI NIRMAN - ISOLATED MODULE 5 ENGINE
 */
(function() {
  function getDb() {
    return window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  }

  async function loadNirmanData() {
    const db = getDb();
    if (!db || typeof db.from !== 'function') {
      setTimeout(loadNirmanData, 400);
      return;
    }

    try {
      const { data: raw } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
      const tbRaw = document.getElementById('tbody-raw-materials') || document.getElementById('nrm-tb-raw');
      if (tbRaw && raw) {
        tbRaw.innerHTML = raw.map(r => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
            <td style="padding:0.5rem;">${r.id}</td>
            <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
            <td style="padding:0.5rem;">${r.category}</td>
            <td style="padding:0.5rem;">${r.stock} ${r.unit}</td>
            <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 0} ${r.unit}</td>
            <td style="padding:0.5rem; color:#10b981;">₹${r.stock > 0 ? (r.purchase_rate / r.stock).toFixed(2) : '0.00'}</td>
            <td style="padding:0.5rem; text-align:center;">
              <button onclick="if(confirm('Delete?')) getDb().from('raw_materials').delete().eq('id','${r.id}').then(loadAushadhiNirmanData);" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem; color:white;">No raw materials found.</td></tr>';
      }

      const { data: rec } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
      const tbRec = document.getElementById('tbody-master-recipes') || document.getElementById('nrm-tb-recipes');
      if (tbRec && rec) {
        tbRec.innerHTML = rec.map(r => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
            <td style="padding:0.5rem; font-weight:bold;">${r.name || r.medicine_name}</td>
            <td style="padding:0.5rem;">${r.barcode || '-'}</td>
            <td style="padding:0.5rem; color:#ef4444;">₹${parseFloat(r.cop||0).toFixed(2)}</td>
            <td style="padding:0.5rem; color:#10b981;">₹${parseFloat(r.selling_price||0).toFixed(2)}</td>
            <td style="padding:0.5rem; font-size:0.8rem;">${r.ingredients || '-'}</td>
            <td style="padding:0.5rem; text-align:center;">
              <button onclick="if(confirm('Delete?')) getDb().from('master_recipes').delete().eq('id','${r.id}').then(loadAushadhiNirmanData);" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="6" style="text-align:center; padding:1rem; color:white;">No recipes found.</td></tr>';
      }
    } catch (e) {
      console.error("Aushadhi Nirman load error:", e);
    }
  }

  window.loadAushadhiNirmanData = loadNirmanData;

  // Event listener hooks into tab switches without overwriting global switchTab
  document.addEventListener('click', function(e) {
    const item = e.target.closest('[onclick*="switchTab"]');
    if (item && item.getAttribute('onclick').includes('5')) {
      setTimeout(loadNirmanData, 200);
    }
  });

  document.addEventListener('DOMContentLoaded', loadNirmanData);
})();
