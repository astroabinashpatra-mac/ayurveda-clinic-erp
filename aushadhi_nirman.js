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


// ==========================================
// UNIFIED BUTTON HANDLERS FOR MODULE 5
// ==========================================

// 1. Raw Material Modal Handlers
window.openRawMaterialModal = function(id = null) {
  if (typeof injectNirmanModals === 'function') injectNirmanModals();
  const modal = document.getElementById('nrm-modal-rm') || document.getElementById('modal-raw-material');
  if (!modal) return alert("Modal element not found.");

  if (id && window.nrmState && window.nrmState.raw) {
    const item = window.nrmState.raw.find(r => r.id === id);
    if (item) {
      if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = item.name || '';
      if (document.getElementById('nrm-rm-cat')) document.getElementById('nrm-rm-cat').value = item.category || 'Herbs';
      if (document.getElementById('nrm-rm-unit')) document.getElementById('nrm-rm-unit').value = item.unit || 'gms';
      if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = item.stock || 0;
      if (document.getElementById('nrm-rm-reorder')) document.getElementById('nrm-rm-reorder').value = item.reorder || 10;
      if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = item.purchase_rate || 0;
      window.nrmEditingRMId = id;
    }
  } else {
    window.nrmEditingRMId = null;
    if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = '';
    if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = '';
    if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = '';
  }
  modal.style.display = 'flex';
};

window.closeRawMaterialModal = function() {
  const modal = document.getElementById('nrm-modal-rm') || document.getElementById('modal-raw-material');
  if (modal) modal.style.display = 'none';
};

window.editRawMaterial = function(id) {
  window.openRawMaterialModal(id);
};

window.deleteRawMaterial = function(id) {
  if (!confirm("Are you sure you want to delete this raw material?")) return;
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db) return alert("Database connection not ready.");
  db.from('raw_materials').delete().eq('id', id).then(() => {
    alert("Raw Material deleted.");
    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
    else if (typeof loadNirmanData === 'function') loadNirmanData();
  }).catch(err => alert("Delete failed: " + err.message));
};

// 2. Master Recipe Modal Handlers
window.openMasterRecipeModal = function(id = null) {
  if (typeof injectNirmanModals === 'function') injectNirmanModals();
  const modal = document.getElementById('nrm-modal-recipe') || document.getElementById('modal-master-recipe');
  if (modal) modal.style.display = 'flex';
};

window.closeMasterRecipeModal = function() {
  const modal = document.getElementById('nrm-modal-recipe') || document.getElementById('modal-master-recipe');
  if (modal) modal.style.display = 'none';
};

window.editMasterRecipe = function(id) {
  window.openMasterRecipeModal(id);
};

window.deleteMasterRecipe = function(id) {
  if (!confirm("Are you sure you want to delete this master recipe?")) return;
  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db) return alert("Database connection not ready.");
  db.from('master_recipes').delete().eq('id', id).then(() => {
    alert("Master recipe deleted.");
    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
    else if (typeof loadNirmanData === 'function') loadNirmanData();
  }).catch(err => alert("Delete failed: " + err.message));
};

// 3. Batch Production Handlers
window.executeBatchProduction = function(id = null) {
  if (id && typeof nrmOpenBatch === 'function') {
    nrmOpenBatch(id);
  } else {
    const recipes = (window.nrmState && window.nrmState.recipes) ? window.nrmState.recipes : [];
    if (recipes.length === 0) return alert("No master recipes found to execute production.");
    const text = recipes.map((r, i) => `${i+1}. ${r.name || r.medicine_name}`).join('\n');
    const sel = prompt("Enter Recipe Number for batch production:\n" + text);
    if (!sel) return;
    const target = recipes[parseInt(sel) - 1];
    if (target && typeof nrmOpenBatch === 'function') nrmOpenBatch(target.id);
  }
};

window.openBatchProductionModal = window.executeBatchProduction;
