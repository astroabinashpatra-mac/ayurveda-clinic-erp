
const formatIngredients = (ingList) => {
  if (!ingList) return "-";
  let items = typeof ingList === "string" ? JSON.parse(ingList) : ingList;
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map(ing => {
    const name = ing.name || ing.raw_name || ing.item_name || ing.title || "Item";
    const qty = ing.qty ?? ing.req_qty ?? ing.quantity ?? "";
    const unit = ing.unit || "g";
    return `${name} (${qty} ${unit})`;
  }).join(", ");
};

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
      const { data: raw } = await db.from('raw_materials').select('*');
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

      const { data: rec } = await db.from('master_recipes').select('*');
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
        <input name="nrm-rm-name"  type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <select name="nrm-rm-cat"  id="nrm-rm-cat" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option>
            <option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
          </select>
          <select name="nrm-rm-unit"  id="nrm-rm-unit" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option>
            <option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div><label for="nrm-rm-qty" style="color:#9ca3af; font-size:0.8rem;">Init Qty</label><input name="nrm-rm-qty"   type="number" id="nrm-rm-qty" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-reorder" style="color:#9ca3af; font-size:0.8rem;">Reorder</label><input name="nrm-rm-reorder"   type="number" id="nrm-rm-reorder" value="10" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-cost" style="color:#9ca3af; font-size:0.8rem;">Cost (₹)</label><input name="nrm-rm-cost"   type="number" id="nrm-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          
          <button onclick="window.nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save & Sync Expense</button>
        </div>
      </div>
    </div>

    <!-- MODAL: RECIPE -->
    <div id="nrm-modal-recipe" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 550px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">Create Master Recipe<button type="button" id="btn-close-recipe-x" onclick="event.preventDefault(); event.stopPropagation(); if(window.closeMasterRecipeModal){window.closeMasterRecipeModal()} else{const m = this.closest('.modal, [id*=\'modal\']'); if(m) m.style.display=\'none\';}" style="position: absolute; top: 16px; right: 16px; background: #ef4444; color: white; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center; z-index: 9999;">✕</button></h3>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <input name="nrm-rec-name"  type="text" id="nrm-rec-name" placeholder="Medicine Name" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
          <input name="nrm-rec-margin"  type="number" id="nrm-rec-margin" placeholder="Margin % (e.g. 20)" value="20" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
        </div>

        <div style="background: #0f172a; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
          <h4 style="color: #cbd5e1; margin-top: 0;">Add Raw Materials (BOM)</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select name="nrm-rec-sel"  id="nrm-rec-sel" style="flex: 2; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;"></select>
            <input name="nrm-rec-qty"  type="number" id="nrm-rec-qty" placeholder="Qty" style="flex: 1; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;">
            <button onclick="window.nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; border-radius:4px; font-weight: bold;">Add</button>
          </div>
          <table style="width: 100%; color: white; text-align: left; font-size: 0.9rem;">
            <thead><tr style="color: #9ca3af; border-bottom: 1px solid #334155;"><th>Item</th><th>Qty</th><th>Action</th></tr></thead>
            <tbody id="nrm-tb-bom"></tbody>
          </table>
          <div id="nrm-cop-preview" style="text-align: right; margin-top: 0.5rem; color: #f59e0b; font-weight: bold;">Est. COP: ₹0.00</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          
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


// ==========================================
// BULLETPROOF RAW MATERIAL UPDATE ENGINE
// ==========================================
window.nrmSaveRM = async function() {
  const name = document.getElementById('nrm-rm-name')?.value?.trim();
  const cat = document.getElementById('nrm-rm-cat')?.value || 'Herbs';
  const unit = document.getElementById('nrm-rm-unit')?.value || 'kg';
  const qty = parseFloat(document.getElementById('nrm-rm-qty')?.value || 0);
  const cost = parseFloat(document.getElementById('nrm-rm-cost')?.value || 0);

  if (!name) return alert("Please enter material name.");

  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return alert("Database client not ready.");

  // Payload containing ONLY columns existing in Supabase raw_materials table
  const cleanPayload = {
    name: name,
    category: cat,
    unit: unit,
    stock: qty
  };

  try {
    if (window.nrmEditingRMId) {
      // UPDATE: Transmit only name, category, unit, stock
      const { error } = await db.from('raw_materials').update(cleanPayload).eq('id', window.nrmEditingRMId);
      if (error) return alert("Update error: " + error.message);
      alert("Raw material updated successfully!");
    } else {
      // INSERT: New ID + core payload
      const newId = 'RAW-' + Date.now();
      const { error } = await db.from('raw_materials').insert([{ id: newId, ...cleanPayload }]);
      if (error) return alert("Save error: " + error.message);

      if (cost > 0 && typeof window.safeInsertAccounts === 'function') {
        await window.safeInsertAccounts({
          title: `Raw Material Purchase: ${name}`,
          category: 'Aushadhi Nirman Procurement',
          amount: cost,
          status: 'Paid',
          created_at: new Date().toISOString()
        });
      }
      alert("Raw material created successfully!");
    }

    window.closeRawMaterialModal();
    if (typeof window.loadAushadhiNirmanData === 'function') {
      window.loadAushadhiNirmanData();
    } else {
      location.reload();
    }
  } catch(err) {
    console.error("Save RM Error:", err);
    alert("Operation failed: " + err.message);
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


// ==========================================
// BULLETPROOF MASTER RECIPE MODAL OPENER
// ==========================================
window.openMasterRecipeModal = async function() {
  try {
    if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
    
    let modal = document.getElementById('nrm-modal-recipe') || document.getElementById('modal-master-recipe');
    if (!modal) {
      ensureNirmanModals();
      modal = document.getElementById('nrm-modal-recipe');
    }

    window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
    window.nrmState.bom = [];

    // Fetch latest raw materials from Supabase to refresh datalist
    const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (db && typeof db.from === 'function') {
      try {
        const { data } = await db.from('raw_materials').select('*').order('name', { ascending: true });
        if (data) window.nrmState.raw = data;
      } catch(e) {}
    }

    // Reset Form Fields
    const nameEl = document.getElementById('nrm-rec-name') || document.getElementById('rec-name');
    const marginEl = document.getElementById('nrm-rec-margin') || document.getElementById('rec-margin');
    const selEl = document.getElementById('nrm-rec-sel');
    
    if (nameEl) nameEl.value = '';
    if (marginEl) marginEl.value = '20';
    if (selEl) selEl.value = '';

    // Populate Autocomplete Datalist
    const dl = document.getElementById('nrm-raw-datalist');
    if (dl && window.nrmState.raw) {
      dl.innerHTML = window.nrmState.raw.map(r => 
        `<option value="${r.name} [ID: ${r.id}] (${r.stock} ${r.unit} available)"></option>`
      ).join('');
    }

    if (typeof window.nrmRenderBOM === 'function') window.nrmRenderBOM();

    if (modal) {
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
    } else {
      alert("Error: Master Recipe Modal element not found in DOM.");
    }
  } catch (err) {
    console.error("Crash in openMasterRecipeModal:", err);
    alert("Modal Error: " + err.message);
  }
};

window.nrmOpenMasterRecipeModal = window.openMasterRecipeModal;


// GLOBAL EVENT DELEGATION FOR MASTER RECIPE & MODAL BUTTONS
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button, .btn');
  if (!btn) return;

  const text = (btn.innerText || btn.textContent || '').trim();
  const onclickAttr = btn.getAttribute('onclick') || '';

  if (text.includes('Add Master Recipe') || onclickAttr.includes('MasterRecipeModal') || onclickAttr.includes('openMasterRecipe')) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window.openMasterRecipeModal === 'function') {
      window.openMasterRecipeModal();
    }
  }
}, true);


// ==========================================
// REBUILT MASTER RECIPE MODAL & HANDLERS
// ==========================================

function ensureNirmanModals() {
  let container = document.getElementById('nrm-modals-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nrm-modals-container';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <!-- MODAL: RAW MATERIAL -->
    <div id="nrm-modal-rm" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 450px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h3 style="color: white; margin-top: 0; margin-bottom: 1rem;">Add / Edit Raw Material</h3>
        <input name="nrm-rm-name"  type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width: 100%; padding: 0.6rem; margin-bottom: 1rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label for="nrm-rm-cat" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Category</label>
            <select name="nrm-rm-cat"   id="nrm-rm-cat" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option>
              <option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label for="nrm-rm-unit" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Unit</label>
            <select name="nrm-rm-unit"   id="nrm-rm-unit" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option>
              <option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div><label for="nrm-rm-qty" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Init Qty</label><input name="nrm-rm-qty"   type="number" id="nrm-rm-qty" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-reorder" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Reorder</label><input name="nrm-rm-reorder"   type="number" id="nrm-rm-reorder" value="10" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-cost" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Total Cost (₹)</label><input name="nrm-rm-cost"   type="number" id="nrm-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          
          <button onclick="window.nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save & Sync Expense</button>
        </div>
      </div>
    </div>

    <!-- MODAL: MASTER RECIPE -->
    <div id="nrm-modal-recipe" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 560px; max-width:92vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h3 style="color: white; margin-top: 0; margin-bottom: 1rem;">Create Master Recipe</h3>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.2rem;">
          <div>
            <label for="nrm-rec-name" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Medicine / Output Name</label>
            <input name="nrm-rec-name"   type="text" id="nrm-rec-name" placeholder="e.g. Swarna Bhasma Mix" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
          </div>
          <div>
            <label for="nrm-rec-margin" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Profit Margin %</label>
            <input name="nrm-rec-margin"   type="number" id="nrm-rec-margin" placeholder="20" value="20" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
          </div>
        </div>

        <div style="background: #0f172a; padding: 1rem; border-radius: 6px; border: 1px solid #1e293b; margin-bottom: 1.2rem;">
          <h4 style="color: #cbd5e1; margin-top: 0; margin-bottom: 0.8rem; font-size:0.95rem;">Bill of Materials (BOM Ingredients)</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select name="nrm-rec-sel"  id="nrm-rec-sel" style="flex: 2; min-width: 0; padding: 0.6rem; background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; outline:none; font-size:0.9rem;">
              <option value="">-- Select Raw Material --</option>
            </select>
            <input name="nrm-rec-qty"  type="number" id="nrm-rec-qty" placeholder="Qty" style="width: 90px; padding: 0.6rem; background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
            <button onclick="window.nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.6rem 1.2rem; cursor: pointer; border-radius:4px; font-weight: bold; white-space:nowrap;">+ Add</button>
          </div>
          <div style="max-height: 180px; overflow-y: auto;">
            <table style="width: 100%; color: white; text-align: left; font-size: 0.85rem; border-collapse: collapse;">
              <thead>
                <tr style="color: #9ca3af; border-bottom: 1px solid #334155;">
                  <th style="padding: 0.5rem;">Item</th>
                  <th style="padding: 0.5rem;">Qty</th>
                  <th style="padding: 0.5rem;">Cost</th>
                  <th style="padding: 0.5rem; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody id="nrm-tb-bom"></tbody>
            </table>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 0.8rem; pt: 0.5rem; border-top: 1px dashed #334155;">
            <span id="nrm-cop-preview" style="color: #f59e0b; font-weight: bold; font-size: 0.9rem;">Est. COP: ₹0.00</span>
            <span id="nrm-mrp-preview" style="color: #10b981; font-weight: bold; font-size: 0.9rem;">Est. MRP: ₹0.00</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          
          <button onclick="window.nrmSaveRecipe()" style="background: #2563eb; color: white; padding: 0.6rem 1.2rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save Recipe</button>
        </div>
      </div>
    </div>
  `;
}

window.openMasterRecipeModal = async function() {
  ensureNirmanModals();
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = [];

  // Live Fetch from Supabase
  const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').order('name', { ascending: true });
      if (data) window.nrmState.raw = data;
    } catch(e) {}
  }

  // Populate HTML select element cleanly
  const sel = document.getElementById('nrm-rec-sel');
  if (sel) {
    if (window.nrmState.raw && window.nrmState.raw.length > 0) {
      sel.innerHTML = '<option value="">-- Select Raw Material --</option>' + 
        window.nrmState.raw.map(r => `<option value="${r.id}">${r.name} (Stock: ${r.stock} ${r.unit})</option>`).join('');
    } else {
      sel.innerHTML = '<option value="">No Raw Materials Found in DB</option>';
    }
  }

  if (document.getElementById('nrm-rec-name')) document.getElementById('nrm-rec-name').value = '';
  if (document.getElementById('nrm-rec-margin')) document.getElementById('nrm-rec-margin').value = '20';
  if (document.getElementById('nrm-rec-qty')) document.getElementById('nrm-rec-qty').value = '';

  window.nrmRenderBOM();
  
  const modal = document.getElementById('nrm-modal-recipe');
  if (modal) modal.style.display = 'flex';
};

window.closeMasterRecipeModal = function() {
  const modal = document.getElementById('nrm-modal-recipe');
  if (modal) modal.style.display = 'none';
};

window.nrmAddBOM = function() {
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = window.nrmState.bom || [];

  const sel = document.getElementById('nrm-rec-sel');
  const qtyInput = document.getElementById('nrm-rec-qty');
  if (!sel || !qtyInput) return;

  const rmId = sel.value;
  const qty = parseFloat(qtyInput.value);

  if (!rmId || isNaN(qty) || qty <= 0) return alert("Please select a raw material and enter a valid quantity.");

  const rm = (window.nrmState.raw || []).find(r => r.id === rmId);
  if (!rm) return alert("Raw material details missing.");

  if (qty > parseFloat(rm.stock)) return alert(`Quantity exceeds stock! Available: ${rm.stock} ${rm.unit}`);

  const unitCost = parseFloat(rm.stock) > 0 ? (parseFloat(rm.purchase_rate || 0) / parseFloat(rm.stock)) : 0;
  const exist = window.nrmState.bom.find(b => b.id === rmId);

  if (exist) {
    if ((exist.qty + qty) > parseFloat(rm.stock)) return alert(`Exceeds total stock! Max: ${rm.stock} ${rm.unit}`);
    exist.qty += qty;
  } else {
    window.nrmState.bom.push({
      id: rm.id,
      name: rm.name,
      qty: qty,
      unit: rm.unit,
      unit_cost: unitCost
    });
  }

  qtyInput.value = '';
  window.nrmRenderBOM();
};

window.nrmRenderBOM = function() {
  const tb = document.getElementById('nrm-tb-bom');
  const copPreview = document.getElementById('nrm-cop-preview');
  const mrpPreview = document.getElementById('nrm-mrp-preview');
  const marginInput = document.getElementById('nrm-rec-margin');
  if (!tb) return;

  let cop = 0;
  tb.innerHTML = (window.nrmState.bom || []).map((b, i) => {
    const itemCost = b.qty * b.unit_cost;
    cop += itemCost;
    return `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding:0.4rem; font-weight:bold;">${b.name}</td>
      <td style="padding:0.4rem;">${b.qty} ${b.unit}</td>
      <td style="padding:0.4rem; color:#10b981;">₹${itemCost.toFixed(2)}</td>
      <td style="padding:0.4rem; text-align:center;"><button onclick="window.nrmState.bom.splice(${i},1); window.nrmRenderBOM();" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold; font-size:1.1rem;">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="color:#9ca3af; padding:0.8rem; text-align:center;">No ingredients added yet.</td></tr>';

  const margin = marginInput ? (parseFloat(marginInput.value) || 20) : 20;
  const mrp = cop + (cop * (margin / 100));

  if (copPreview) copPreview.innerText = `Est. COP: ₹${cop.toFixed(2)}`;
  if (mrpPreview) mrpPreview.innerText = `Est. MRP: ₹${mrp.toFixed(2)}`;
};


// ==========================================
// ROBUST MASTER RECIPE RENDER ENGINE
// ==========================================

function parseRecipeIngredients(r) {
  if (!r) return '-';
  let ing = r.ingredients;
  if (typeof ing === 'string') {
    try { ing = JSON.parse(ing); } catch(e) { ing = null; }
  }
  if (Array.isArray(ing)) {
    return ing.map(i => `${i.name || i.id}: ${i.qty || 1}${i.unit || ''}`).join(', ') || '-';
  }
  if (ing && typeof ing === 'object') {
    return `${ing.name || ing.id || 'Material'}: ${ing.qty || 1}${ing.unit || ''}`;
  }
  if (r.raw_req_id) {
    return `${r.raw_req_id} (${r.req_qty_per_unit || 1})`;
  }
  return '-';
}

async function renderMasterRecipesTable() {
  const db = window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (!db || typeof db.from !== 'function') return;

  try {
    const { data: rec, error } = await db.from('master_recipes').select('*');
    if (error) return console.error("Fetch master recipes error:", error.message);
    
    window.nrmState = window.nrmState || {};
    window.nrmState.recipes = rec || [];

    // Find table body dynamically across all DOM structures
    const tbRec = document.getElementById('tbody-master-recipes') || 
                  document.getElementById('nrm-tb-recipes') || 
                  document.querySelector('#module-aushadhi-nirman table:nth-of-type(2) tbody') ||
                  document.querySelectorAll('table tbody')[1];

    if (!tbRec) return;

    tbRec.innerHTML = (rec || []).map(r => {
      const ingText = parseRecipeIngredients(r);
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
          <td style="padding:0.6rem;">${r.id || '-'}</td>
          <td style="padding:0.6rem; font-weight:bold;">${r.name || r.medicine_name || 'Unnamed Recipe'}</td>
          <td style="padding:0.6rem;">${r.barcode || '-'}</td>
          <td style="padding:0.6rem; color:#cbd5e1; font-size:0.85rem;">${ingText}</td>
          <td style="padding:0.6rem; text-align:center;">
            <button onclick="window.editMasterRecipe('${r.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:3px; cursor:pointer; margin-right:4px;">Edit</button>
            <button onclick="window.deleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:3px; cursor:pointer;">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="5" style="text-align:center; padding:1rem; color:white;">No master recipes found.</td></tr>';
  } catch (err) {
    console.error("Master Recipe Render Exception:", err);
  }
}

window.loadMasterRecipesTable = renderMasterRecipesTable;

// Hook into master load cycle
if (typeof loadAushadhiNirmanData === 'function') {
  const prevLoad = window.loadAushadhiNirmanData;
  window.loadAushadhiNirmanData = function() {
    prevLoad();
    renderMasterRecipesTable();
  };
}


// ==========================================
// RAW MATERIAL EDIT & PRE-FILL HANDLER
// ==========================================
window.nrmEditingRMId = null;

window.openRawMaterialModal = function() {
  if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
  window.nrmEditingRMId = null;
  
  const modal = document.getElementById('nrm-modal-rm');
  const title = modal ? modal.querySelector('h3') : null;
  const saveBtn = modal ? modal.querySelector('button[onclick*="nrmSaveRM"]') : null;
  
  if (title) title.innerText = "Add Raw Material";
  if (saveBtn) saveBtn.innerText = "Save & Sync Expense";

  if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = '';
  if (document.getElementById('nrm-rm-cat')) document.getElementById('nrm-rm-cat').value = 'Herbs';
  if (document.getElementById('nrm-rm-unit')) document.getElementById('nrm-rm-unit').value = 'kg';
  if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = '';
  if (document.getElementById('nrm-rm-reorder')) document.getElementById('nrm-rm-reorder').value = '10';
  if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = '';

  if (modal) modal.style.display = 'flex';
};

window.closeRawMaterialModal = function() {
  const modal = document.getElementById('nrm-modal-rm');
  if (modal) modal.style.display = 'none';
  window.nrmEditingRMId = null;
};

window.editRawMaterial = async function(id) {
  if (typeof ensureNirmanModals === 'function') ensureNirmanModals();
  window.nrmEditingRMId = id;

  const db = window.supabaseClient || window.sbClient || window.supabase;
  let item = (window.nrmState && window.nrmState.raw) ? window.nrmState.raw.find(r => r.id === id || String(r.id) === String(id)) : null;

  if (!item && db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').eq('id', id).single();
      if (data) item = data;
    } catch(e) {}
  }

  if (!item) return alert("Raw material details not found in database.");

  const modal = document.getElementById('nrm-modal-rm');
  const title = modal ? modal.querySelector('h3') : null;
  const saveBtn = modal ? modal.querySelector('button[onclick*="nrmSaveRM"]') : null;
  
  if (title) title.innerText = "Edit Raw Material";
  if (saveBtn) saveBtn.innerText = "Update Material";

  if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = item.name || '';
  if (document.getElementById('nrm-rm-cat')) document.getElementById('nrm-rm-cat').value = item.category || 'Herbs';
  if (document.getElementById('nrm-rm-unit')) document.getElementById('nrm-rm-unit').value = item.unit || 'kg';
  if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = item.stock || item.qty || '0';
  if (document.getElementById('nrm-rm-reorder')) document.getElementById('nrm-rm-reorder').value = item.reorder_limit || item.reorder || '10';
  if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = item.purchase_rate || item.total_cost || item.cost || '0';

  if (modal) modal.style.display = 'flex';
};

window.nrmEditRM = window.editRawMaterial;


// ==========================================
// BULLETPROOF RAW MATERIAL UPDATE ENGINE
// ==========================================
window.nrmSaveRM = async function() {
  const name = document.getElementById('nrm-rm-name')?.value?.trim();
  const cat = document.getElementById('nrm-rm-cat')?.value || 'Herbs';
  const unit = document.getElementById('nrm-rm-unit')?.value || 'kg';
  const qty = parseFloat(document.getElementById('nrm-rm-qty')?.value || 0);
  const cost = parseFloat(document.getElementById('nrm-rm-cost')?.value || 0);

  if (!name) return alert("Please enter material name.");

  const db = window.supabaseClient || window.sbClient || window.supabase;
  if (!db || typeof db.from !== 'function') return alert("Database client not ready.");

  // Payload containing ONLY columns existing in Supabase raw_materials table
  const cleanPayload = {
    name: name,
    category: cat,
    unit: unit,
    stock: qty
  };

  try {
    if (window.nrmEditingRMId) {
      // UPDATE: Transmit only name, category, unit, stock
      const { error } = await db.from('raw_materials').update(cleanPayload).eq('id', window.nrmEditingRMId);
      if (error) return alert("Update error: " + error.message);
      alert("Raw material updated successfully!");
    } else {
      // INSERT: New ID + core payload
      const newId = 'RAW-' + Date.now();
      const { error } = await db.from('raw_materials').insert([{ id: newId, ...cleanPayload }]);
      if (error) return alert("Save error: " + error.message);

      if (cost > 0 && typeof window.safeInsertAccounts === 'function') {
        await window.safeInsertAccounts({
          title: `Raw Material Purchase: ${name}`,
          category: 'Aushadhi Nirman Procurement',
          amount: cost,
          status: 'Paid',
          created_at: new Date().toISOString()
        });
      }
      alert("Raw material created successfully!");
    }

    window.closeRawMaterialModal();
    if (typeof window.loadAushadhiNirmanData === 'function') {
      window.loadAushadhiNirmanData();
    } else {
      location.reload();
    }
  } catch(err) {
    console.error("Save RM Error:", err);
    alert("Operation failed: " + err.message);
  }
};



// ==========================================
// BULLETPROOF MASTER RECIPES RENDER ENGINE
// ==========================================
window.renderMasterRecipesTable = function() {
  const tb = document.getElementById('tbody-master-recipes') || document.getElementById('tbody-recipes');
  if (!tb) return;

  const recipes = (window.nrmState && window.nrmState.recipes) ? window.nrmState.recipes : [];
  const rawMaterials = (window.nrmState && window.nrmState.raw) ? window.nrmState.raw : [];

  if (!recipes || recipes.length === 0) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No master recipes configured. Click + Add Master Recipe to create one.</td></tr>';
    return;
  }

  tb.innerHTML = recipes.map(r => {
    try {
      let ingText = [];

      // 1. Try parsing JSON ingredients column
      if (r.ingredients) {
        let ingData = r.ingredients;
        if (typeof ingData === 'string') {
          try { ingData = JSON.parse(ingData); } catch(e) {}
        }
        if (Array.isArray(ingData)) {
          ingText = ingData.map(item => {
            const matchedRaw = rawMaterials.find(rm => rm.id === item.id || rm.id === item.raw_id || String(rm.id) === String(item.id));
            const rawName = matchedRaw ? matchedRaw.name : (item.name || item.id || 'Material');
            const qty = item.qty || item.req_qty || item.quantity || 0;
            const unit = matchedRaw ? (matchedRaw.unit || '') : (item.unit || '');
            return `${rawName} (${qty} ${unit})`.trim();
          });
        }
      }

      // 2. Fallback to legacy raw_req_id & req_qty_per_unit if ingredients array is empty
      if (ingText.length === 0 && r.raw_req_id) {
        const matchedRaw = rawMaterials.find(rm => rm.id === r.raw_req_id || String(rm.id) === String(r.raw_req_id));
        const rawName = matchedRaw ? matchedRaw.name : r.raw_req_id;
        const qty = r.req_qty_per_unit || 0;
        const unit = matchedRaw ? (matchedRaw.unit || '') : '';
        ingText.push(`${rawName} (${qty} ${unit})`.trim());
      }

      const ingDisplay = ingText.length > 0 
        ? ingText.join(', ') 
        : '<span style="color: #64748b; font-style: italic;">No ingredients listed</span>';

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: white;">
          <td style="padding: 0.75rem; font-weight: bold; color: #9ca3af; font-size: 0.85rem;">${r.id || '-'}</td>
          <td style="padding: 0.75rem; font-weight: bold; color: white;">${r.name || '-'}</td>
          <td style="padding: 0.75rem; font-family: monospace; color: #cbd5e1;">${r.barcode || '-'}</td>
          <td style="padding: 0.75rem; font-size: 0.85rem; color: #e2e8f0;">${ingDisplay}</td>
          <td style="padding: 0.75rem;">
            <button onclick="window.editRecipe('${r.id}')" style="background: #2563eb; color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; margin-right: 0.4rem;">Edit</button>
            <button onclick="window.deleteRecipe('${r.id}')" style="background: #dc2626; color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">Delete</button>
          </td>
        </tr>
      `;
    } catch (err) {
      console.error("Error rendering recipe row:", err, r);
      return '';
    }
  }).join('');
};

window.renderRecipesTable = window.renderMasterRecipesTable;

window.openAddRawMaterialModal = function(){ const m=document.getElementById('modal-raw-material')||document.getElementById('modal-add-raw-material')||document.querySelector('[id*="raw-material"]'); if(m) m.style.display='flex'; };
