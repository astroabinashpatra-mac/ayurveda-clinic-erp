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
window.openMasterRecipeModal = function() {
  if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [], activeRecipe: null };
  window.nrmState.bom = [];
  if (document.getElementById('nrm-rec-name')) document.getElementById('nrm-rec-name').value = '';
  if (document.getElementById('nrm-rec-margin')) document.getElementById('nrm-rec-margin').value = '20';
  const sel = document.getElementById('nrm-rec-sel');
  if (sel) {
    sel.innerHTML = '<option value="">Select Raw Material</option>' + (window.nrmState.raw || []).map(r => `<option value="${r.id}">${r.name} (Stock: ${r.stock}${r.unit})</option>`).join('');
  }
  const modal = document.getElementById('nrm-modal-recipe');
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


// ==========================================
// GUARANTEED DOM MODAL INJECTOR & HANDLERS
// ==========================================
function ensureNirmanModals() {
  if (document.getElementById('nrm-modal-rm')) return;

  const container = document.createElement('div');
  container.id = 'nrm-modals-container';
  container.innerHTML = `
    <!-- MODAL: RAW MATERIAL -->
    <div id="nrm-modal-rm" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 450px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">Add / Edit Raw Material</h3>
        <input type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <select id="nrm-rm-cat" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option>
            <option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
          </select>
          <select id="nrm-rm-unit" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option>
            <option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div><label style="color:#9ca3af; font-size:0.8rem;">Init Qty</label><input type="number" id="nrm-rm-qty" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Reorder</label><input type="number" id="nrm-rm-reorder" value="10" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Cost (₹)</label><input type="number" id="nrm-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="window.closeRawMaterialModal()" style="padding: 0.5rem 1rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px;">Cancel</button>
          <button onclick="window.nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save & Sync Expense</button>
        </div>
      </div>
    </div>

    <!-- MODAL: RECIPE -->
    <div id="nrm-modal-recipe" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 550px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">Create Master Recipe</h3>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <input type="text" id="nrm-rec-name" placeholder="Medicine Name" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
          <input type="number" id="nrm-rec-margin" placeholder="Margin % (e.g. 20)" value="20" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
        </div>

        <div style="background: #0f172a; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
          <h4 style="color: #cbd5e1; margin-top: 0;">Add Raw Materials (BOM)</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select id="nrm-rec-sel" style="flex: 2; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;"></select>
            <input type="number" id="nrm-rec-qty" placeholder="Qty" style="flex: 1; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;">
            <button onclick="window.nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; border-radius:4px; font-weight: bold;">Add</button>
          </div>
          <table style="width: 100%; color: white; text-align: left; font-size: 0.9rem;">
            <thead><tr style="color: #9ca3af; border-bottom: 1px solid #334155;"><th>Item</th><th>Qty</th><th>Action</th></tr></thead>
            <tbody id="nrm-tb-bom"></tbody>
          </table>
          <div id="nrm-cop-preview" style="text-align: right; margin-top: 0.5rem; color: #f59e0b; font-weight: bold;">Est. COP: ₹0.00</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="window.closeMasterRecipeModal()" style="padding: 0.5rem 1rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px;">Cancel</button>
          <button onclick="window.nrmSaveRecipe()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save Recipe</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);
}

window.openRawMaterialModal = function(id = null) {
  ensureNirmanModals();
  const modal = document.getElementById('nrm-modal-rm');
  if (!modal) return;
  if (id && window.nrmState && window.nrmState.raw) {
    const item = window.nrmState.raw.find(r => r.id === id);
    if (item) {
      if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = item.name || '';
      if (document.getElementById('nrm-rm-cat')) document.getElementById('nrm-rm-cat').value = item.category || 'Herbs';
      if (document.getElementById('nrm-rm-unit')) document.getElementById('nrm-rm-unit').value = item.unit || 'gms';
      if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = item.stock || 0;
      if (document.getElementById('nrm-rm-reorder')) document.getElementById('nrm-rm-reorder').value = item.reorder || 10;
      if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = item.purchase_rate || 0;
    }
  } else {
    if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = '';
    if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = '';
    if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = '';
  }
  modal.style.display = 'flex';
};

window.closeRawMaterialModal = function() {
  const modal = document.getElementById('nrm-modal-rm');
  if (modal) modal.style.display = 'none';
};

window.openMasterRecipeModal = function() {
  if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [], activeRecipe: null };
  window.nrmState.bom = [];
  if (document.getElementById('nrm-rec-name')) document.getElementById('nrm-rec-name').value = '';
  if (document.getElementById('nrm-rec-margin')) document.getElementById('nrm-rec-margin').value = '20';
  const sel = document.getElementById('nrm-rec-sel');
  if (sel) {
    sel.innerHTML = '<option value="">Select Raw Material</option>' + (window.nrmState.raw || []).map(r => `<option value="${r.id}">${r.name} (Stock: ${r.stock}${r.unit})</option>`).join('');
  }
  const modal = document.getElementById('nrm-modal-recipe');
  if (modal) modal.style.display = 'flex';
};

window.closeMasterRecipeModal = function() {
  const modal = document.getElementById('nrm-modal-recipe');
  if (modal) modal.style.display = 'none';
};

// ==========================================
// EXPLICIT GLOBAL BINDINGS FOR SAVE & RECIPES
// ==========================================

window.nrmSaveRM = async function() {
  try {
    const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (!db) return alert("Database connection not ready.");

    const name = document.getElementById('nrm-rm-name') ? document.getElementById('nrm-rm-name').value.trim() : '';
    const cat = document.getElementById('nrm-rm-cat') ? document.getElementById('nrm-rm-cat').value : 'Herbs';
    const unit = document.getElementById('nrm-rm-unit') ? document.getElementById('nrm-rm-unit').value : 'gms';
    const qty = document.getElementById('nrm-rm-qty') ? parseFloat(document.getElementById('nrm-rm-qty').value) : 0;
    const reorder = document.getElementById('nrm-rm-reorder') ? parseFloat(document.getElementById('nrm-rm-reorder').value) : 10;
    const cost = document.getElementById('nrm-rm-cost') ? parseFloat(document.getElementById('nrm-rm-cost').value) : 0;

    if (!name || isNaN(qty) || isNaN(cost)) {
      return alert("Please fill in Material Name, Initial Quantity, and Total Cost.");
    }

    const payload = {
      id: 'RAW-' + Date.now(),
      name: name,
      category: cat,
      unit: unit,
      stock: qty,
      reorder: reorder,
      purchase_rate: cost
    };

    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Database Error: " + error.message);

    try {
      await db.from('accounts_vendors').insert([{
        type: 'Expense',
        title: `RM Purchase: ${name}`,
        category: 'Raw Materials',
        amount: cost,
        status: 'Paid'
      }]);
    } catch (e) { console.warn("Accounts sync skipped", e); }

    alert("Raw Material saved & Expense synced to Accounts!");
    const modal = document.getElementById('nrm-modal-rm');
    if (modal) modal.style.display = 'none';

    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
    else if (typeof loadNirmanData === 'function') loadNirmanData();
  } catch (err) {
    alert("Save Error: " + err.message);
  }
};

window.nrmAddBOM = function() {
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = window.nrmState.bom || [];
  
  const sel = document.getElementById('nrm-rec-sel');
  const qtyInput = document.getElementById('nrm-rec-qty');
  if (!sel || !qtyInput) return;
  
  const qty = parseFloat(qtyInput.value);
  if (!sel.value || isNaN(qty) || qty <= 0) return alert("Select a raw material and enter a valid quantity.");

  const rm = (window.nrmState.raw || []).find(r => r.id === sel.value);
  if (rm && qty > parseFloat(rm.stock)) return alert(`Quantity exceeds stock! Available: ${rm.stock}${rm.unit}`);

  const exist = window.nrmState.bom.find(b => b.id === sel.value);
  if (exist) {
    if (rm && (exist.qty + qty) > parseFloat(rm.stock)) return alert(`Exceeds stock! Total available: ${rm.stock}${rm.unit}`);
    exist.qty += qty;
  } else if (rm) {
    window.nrmState.bom.push({
      id: rm.id,
      name: rm.name,
      qty: qty,
      unit: rm.unit,
      unit_cost: parseFloat(rm.stock) > 0 ? (parseFloat(rm.purchase_rate || 0) / parseFloat(rm.stock)) : 0
    });
  }

  qtyInput.value = '';
  window.nrmRenderBOM();
};

window.nrmRenderBOM = function() {
  const tb = document.getElementById('nrm-tb-bom');
  const copPreview = document.getElementById('nrm-cop-preview');
  if (!tb) return;

  let cop = 0;
  tb.innerHTML = (window.nrmState.bom || []).map((b, i) => {
    const itemCost = b.qty * b.unit_cost;
    cop += itemCost;
    return `<tr>
      <td style="padding:0.4rem;">${b.name}</td>
      <td style="padding:0.4rem;">${b.qty}${b.unit}</td>
      <td style="padding:0.4rem;"><button onclick="window.nrmState.bom.splice(${i},1); window.nrmRenderBOM();" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold;">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="3" style="color:#9ca3af; padding:0.5rem; text-align:center;">No ingredients added.</td></tr>';

  if (copPreview) copPreview.innerText = `Est. COP: ₹${cop.toFixed(2)}`;
};

window.nrmSaveRecipe = async function() {
  try {
    const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (!db) return alert("Database connection not ready.");

    const name = document.getElementById('nrm-rec-name') ? document.getElementById('nrm-rec-name').value.trim() : '';
    const margin = document.getElementById('nrm-rec-margin') ? parseFloat(document.getElementById('nrm-rec-margin').value) : 20;

    if (!name || !window.nrmState.bom || window.nrmState.bom.length === 0) {
      return alert("Recipe Name and at least one BOM ingredient are required.");
    }

    let cop = 0;
    window.nrmState.bom.forEach(b => cop += (b.qty * b.unit_cost));
    const mrp = cop + (cop * (margin / 100));

    if (mrp <= cop) return alert("Selling price must strictly exceed production cost (COP).");

    const payload = {
      id: 'REC-' + Date.now(),
      name: name,
      barcode: 'BC-' + Math.floor(100000 + Math.random() * 900000),
      cop: cop,
      profit_margin: margin,
      selling_price: mrp,
      ingredients: JSON.stringify(window.nrmState.bom)
    };

    const { error } = await db.from('master_recipes').insert([payload]);
    if (error) return alert("DB Error: " + error.message);

    alert(`Master Recipe Saved!\nCost of Production (COP): ₹${cop.toFixed(2)}\nSelling Price (MRP): ₹${mrp.toFixed(2)}`);
    const modal = document.getElementById('nrm-modal-recipe');
    if (modal) modal.style.display = 'none';

    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
    else if (typeof loadNirmanData === 'function') loadNirmanData();
  } catch (err) {
    alert("Save Error: " + err.message);
  }
};


// ==========================================
// LIVE AUTOCOMPLETE RECIPE BUILDER
// ==========================================

window.openMasterRecipeModal = async function() {
  if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [], activeRecipe: null };
  window.nrmState.bom = [];

  // Live Sync with Supabase on Modal Open
  const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').order('name', { ascending: true });
      if (data) window.nrmState.raw = data;
    } catch(e) {}
  }

  if (document.getElementById('nrm-rec-name')) document.getElementById('nrm-rec-name').value = '';
  if (document.getElementById('nrm-rec-margin')) document.getElementById('nrm-rec-margin').value = '20';
  if (document.getElementById('nrm-rec-sel')) document.getElementById('nrm-rec-sel').value = '';

  // Populate Autocomplete Datalist
  const dl = document.getElementById('nrm-raw-datalist');
  if (dl && window.nrmState.raw) {
    dl.innerHTML = window.nrmState.raw.map(r => 
      `<option value="${r.name} [ID: ${r.id}] (${r.stock} ${r.unit} available)"></option>`
    ).join('');
  }

  if (typeof window.nrmRenderBOM === 'function') window.nrmRenderBOM();
  const modal = document.getElementById('nrm-modal-recipe');
  if (modal) modal.style.display = 'flex';
};

window.nrmAddBOM = function() {
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = window.nrmState.bom || [];
  
  const input = document.getElementById('nrm-rec-sel');
  const qtyInput = document.getElementById('nrm-rec-qty');
  if (!input || !qtyInput) return;

  const val = input.value.trim();
  const qty = parseFloat(qtyInput.value);

  if (!val || isNaN(qty) || qty <= 0) return alert("Select a raw material from autocomplete search and enter a valid quantity.");

  // Match raw material by ID or Name
  const rm = (window.nrmState.raw || []).find(r => val.includes(r.id) || r.name.toLowerCase() === val.toLowerCase() || val.startsWith(r.name));
  if (!rm) return alert("Raw material not found. Please choose an item from the autocomplete list.");

  if (qty > parseFloat(rm.stock)) return alert(`Quantity exceeds stock! Available: ${rm.stock} ${rm.unit}`);

  const exist = window.nrmState.bom.find(b => b.id === rm.id);
  if (exist) {
    if ((exist.qty + qty) > parseFloat(rm.stock)) return alert(`Exceeds total available stock! Max: ${rm.stock} ${rm.unit}`);
    exist.qty += qty;
  } else {
    window.nrmState.bom.push({
      id: rm.id,
      name: rm.name,
      qty: qty,
      unit: rm.unit,
      unit_cost: parseFloat(rm.stock) > 0 ? (parseFloat(rm.purchase_rate || 0) / parseFloat(rm.stock)) : 0
    });
  }

  input.value = '';
  qtyInput.value = '';
  window.nrmRenderBOM();
};

// Ensure live datalist population on openMasterRecipeModal
window.openMasterRecipeModal = async function() {
  const modal = document.getElementById('nrm-modal-recipe') || document.getElementById('modal-master-recipe');
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = [];

  const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').order('name', { ascending: true });
      if (data) window.nrmState.raw = data;
    } catch(e) {}
  }

  if (document.getElementById('nrm-rec-name')) document.getElementById('nrm-rec-name').value = '';
  if (document.getElementById('nrm-rec-margin')) document.getElementById('nrm-rec-margin').value = '20';
  if (document.getElementById('nrm-rec-sel')) document.getElementById('nrm-rec-sel').value = '';

  const dl = document.getElementById('nrm-raw-datalist');
  if (dl && window.nrmState.raw) {
    dl.innerHTML = window.nrmState.raw.map(r => 
      `<option value="${r.name} [ID: ${r.id}] (${r.stock} ${r.unit} available)"></option>`
    ).join('');
  }

  if (typeof window.nrmRenderBOM === 'function') window.nrmRenderBOM();
  if (modal) modal.style.display = 'flex';
};
