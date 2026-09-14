/**
 * AUSHADHI NIRMAN - ISOLATED MODULE 5 ENGINE (CLEAN & DEDUPLICATED)
 */

function getDb() {
  return window.supabaseClient || window.sbClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

// 1. INGREDIENT FORMATTING UTILITY
window.formatIngredients = function(ingList) {
  if (!ingList) return "-";
  let items = ingList;
  if (typeof ingList === "string") {
    try { items = JSON.parse(ingList); } catch(e) { items = null; }
  }
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map(ing => {
    const name = ing.name || ing.raw_name || ing.item_name || ing.title || ing.id || "Item";
    const qty = ing.qty ?? ing.req_qty ?? ing.quantity ?? 0;
    const unit = ing.unit || "";
    return `${name} (${qty} ${unit})`.trim();
  }).join(", ");
};

// 2. MODAL INJECTOR & CONTAINERS
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 id="nrm-rm-modal-title" style="color: white; margin: 0; font-size: 1.15rem;">Add Raw Material</h3>
          <button type="button" onclick="window.closeRawMaterialModal()" style="background: #ef4444; color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
        
        <input name="nrm-rm-name" type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width: 100%; padding: 0.6rem; margin-bottom: 1rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label for="nrm-rm-cat" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Category</label>
            <select name="nrm-rm-cat" id="nrm-rm-cat" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option>
              <option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label for="nrm-rm-unit" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Unit</label>
            <select name="nrm-rm-unit" id="nrm-rm-unit" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
              <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option>
              <option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div><label for="nrm-rm-qty" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Init Qty</label><input name="nrm-rm-qty" type="number" id="nrm-rm-qty" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-reorder" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Reorder</label><input name="nrm-rm-reorder" type="number" id="nrm-rm-reorder" value="10" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
          <div><label for="nrm-rm-cost" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Total Cost (₹)</label><input name="nrm-rm-cost" type="number" id="nrm-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius:4px; box-sizing: border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button id="nrm-rm-save-btn" onclick="window.nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save & Sync Expense</button>
        </div>
      </div>
    </div>

    <!-- MODAL: MASTER RECIPE -->
    <div id="nrm-modal-recipe" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 560px; max-width:92vw; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="color: white; margin: 0; font-size: 1.15rem;">Create Master Recipe</h3>
          <button type="button" onclick="window.closeMasterRecipeModal()" style="background: #ef4444; color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.2rem;">
          <div>
            <label for="nrm-rec-name" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Medicine / Output Name</label>
            <input name="nrm-rec-name" type="text" id="nrm-rec-name" placeholder="e.g. Swarna Bhasma Mix" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
          </div>
          <div>
            <label for="nrm-rec-margin" style="color:#9ca3af; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Profit Margin %</label>
            <input name="nrm-rec-margin" type="number" id="nrm-rec-margin" placeholder="20" value="20" oninput="window.nrmRenderBOM()" style="width:100%; padding: 0.6rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
          </div>
        </div>

        <div style="background: #0f172a; padding: 1rem; border-radius: 6px; border: 1px solid #1e293b; margin-bottom: 1.2rem;">
          <h4 style="color: #cbd5e1; margin-top: 0; margin-bottom: 0.8rem; font-size:0.95rem;">Bill of Materials (BOM Ingredients)</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select name="nrm-rec-sel" id="nrm-rec-sel" style="flex: 2; min-width: 0; padding: 0.6rem; background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; outline:none; font-size:0.9rem;">
              <option value="">-- Select Raw Material --</option>
            </select>
            <input name="nrm-rec-qty" type="number" id="nrm-rec-qty" placeholder="Qty" style="width: 90px; padding: 0.6rem; background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing:border-box;">
            <button type="button" onclick="window.nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.6rem 1.2rem; cursor: pointer; border-radius:4px; font-weight: bold; white-space:nowrap;">+ Add</button>
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
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px dashed #334155;">
            <span id="nrm-cop-preview" style="color: #f59e0b; font-weight: bold; font-size: 0.9rem;">Est. COP: ₹0.00</span>
            <span id="nrm-mrp-preview" style="color: #10b981; font-weight: bold; font-size: 0.9rem;">Est. MRP: ₹0.00</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button type="button" onclick="window.nrmSaveRecipe()" style="background: #2563eb; color: white; padding: 0.6rem 1.2rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save Recipe</button>
        </div>
      </div>
    </div>
  `;
}

// 3. RAW MATERIAL MODAL HANDLERS
window.nrmEditingRMId = null;

window.openRawMaterialModal = function() {
  ensureNirmanModals();
  window.nrmEditingRMId = null;
  const modal = document.getElementById('nrm-modal-rm');
  const title = document.getElementById('nrm-rm-modal-title');
  const saveBtn = document.getElementById('nrm-rm-save-btn');

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

window.openAddRawMaterialModal = window.openRawMaterialModal;

window.closeRawMaterialModal = function() {
  const modal = document.getElementById('nrm-modal-rm');
  if (modal) modal.style.display = 'none';
  window.nrmEditingRMId = null;
};

window.editRawMaterial = async function(id) {
  ensureNirmanModals();
  window.nrmEditingRMId = id;
  const db = getDb();
  let item = (window.nrmState && window.nrmState.raw) ? window.nrmState.raw.find(r => String(r.id) === String(id)) : null;

  if (!item && db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').eq('id', id).single();
      if (data) item = data;
    } catch(e) {}
  }

  if (!item) return alert("Raw material details not found.");

  const modal = document.getElementById('nrm-modal-rm');
  const title = document.getElementById('nrm-rm-modal-title');
  const saveBtn = document.getElementById('nrm-rm-save-btn');

  if (title) title.innerText = "Edit Raw Material";
  if (saveBtn) saveBtn.innerText = "Update Material";

  if (document.getElementById('nrm-rm-name')) document.getElementById('nrm-rm-name').value = item.name || '';
  if (document.getElementById('nrm-rm-cat')) document.getElementById('nrm-rm-cat').value = item.category || 'Herbs';
  if (document.getElementById('nrm-rm-unit')) document.getElementById('nrm-rm-unit').value = item.unit || 'kg';
  if (document.getElementById('nrm-rm-qty')) document.getElementById('nrm-rm-qty').value = item.stock || item.qty || '0';
  if (document.getElementById('nrm-rm-reorder')) document.getElementById('nrm-rm-reorder').value = item.reorder || '10';
  if (document.getElementById('nrm-rm-cost')) document.getElementById('nrm-rm-cost').value = item.purchase_rate || '0';

  if (modal) modal.style.display = 'flex';
};

window.nrmEditRM = window.editRawMaterial;

window.deleteRawMaterial = function(id) {
  if (!confirm("Are you sure you want to delete this raw material?")) return;
  const db = getDb();
  if (!db) return alert("Database connection not ready.");
  db.from('raw_materials').delete().eq('id', id).then(() => {
    alert("Raw Material deleted.");
    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
  }).catch(err => alert("Delete failed: " + err.message));
};

window.nrmSaveRM = async function() {
  const name = document.getElementById('nrm-rm-name')?.value?.trim();
  const cat = document.getElementById('nrm-rm-cat')?.value || 'Herbs';
  const unit = document.getElementById('nrm-rm-unit')?.value || 'kg';
  const qty = parseFloat(document.getElementById('nrm-rm-qty')?.value || 0);
  const cost = parseFloat(document.getElementById('nrm-rm-cost')?.value || 0);

  if (!name) return alert("Please enter material name.");

  const db = getDb();
  if (!db || typeof db.from !== 'function') return alert("Database client not ready.");

  const cleanPayload = {
    name: name,
    category: cat,
    unit: unit,
    stock: qty
  };

  try {
    if (window.nrmEditingRMId) {
      const { error } = await db.from('raw_materials').update(cleanPayload).eq('id', window.nrmEditingRMId);
      if (error) return alert("Update error: " + error.message);
      alert("Raw material updated successfully!");
    } else {
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
    }
  } catch(err) {
    console.error("Save RM Error:", err);
    alert("Operation failed: " + err.message);
  }
};

// 4. MASTER RECIPE MODAL HANDLERS
window.openMasterRecipeModal = async function() {
  ensureNirmanModals();
  window.nrmState = window.nrmState || { raw: [], recipes: [], bom: [] };
  window.nrmState.bom = [];

  const db = getDb();
  if (db && typeof db.from === 'function') {
    try {
      const { data } = await db.from('raw_materials').select('*').order('name', { ascending: true });
      if (data) window.nrmState.raw = data;
    } catch(e) {}
  }

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

window.nrmOpenMasterRecipeModal = window.openMasterRecipeModal;

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

  const rm = (window.nrmState.raw || []).find(r => String(r.id) === String(rmId));
  if (!rm) return alert("Raw material details missing.");

  if (qty > parseFloat(rm.stock)) return alert(`Quantity exceeds stock! Available: ${rm.stock} ${rm.unit}`);

  const unitCost = parseFloat(rm.stock) > 0 ? (parseFloat(rm.purchase_rate || 0) / parseFloat(rm.stock)) : 0;
  const exist = window.nrmState.bom.find(b => String(b.id) === String(rmId));

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
      <td style="padding:0.4rem; text-align:center;"><button type="button" onclick="window.nrmState.bom.splice(${i},1); window.nrmRenderBOM();" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold; font-size:1.1rem;">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="color:#9ca3af; padding:0.8rem; text-align:center;">No ingredients added yet.</td></tr>';

  const margin = marginInput ? (parseFloat(marginInput.value) || 20) : 20;
  const mrp = cop + (cop * (margin / 100));

  if (copPreview) copPreview.innerText = `Est. COP: ₹${cop.toFixed(2)}`;
  if (mrpPreview) mrpPreview.innerText = `Est. MRP: ₹${mrp.toFixed(2)}`;
};

window.nrmSaveRecipe = async function() {
  try {
    const db = getDb();
    if (!db) return alert("Database connection not ready.");

    const name = document.getElementById('nrm-rec-name') ? document.getElementById('nrm-rec-name').value.trim() : '';
    const margin = document.getElementById('nrm-rec-margin') ? parseFloat(document.getElementById('nrm-rec-margin').value) : 20;

    if (!name || !window.nrmState.bom || window.nrmState.bom.length === 0) {
      return alert("Recipe Name and at least one BOM ingredient are required.");
    }

    let cop = 0;
    window.nrmState.bom.forEach(b => cop += (b.qty * b.unit_cost));
    const mrp = cop + (cop * (margin / 100));

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
    window.closeMasterRecipeModal();

    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
  } catch (err) {
    alert("Save Error: " + err.message);
  }
};

window.editMasterRecipe = function(id) { window.openMasterRecipeModal(id); };
window.editRecipe = window.editMasterRecipe;

window.deleteMasterRecipe = function(id) {
  if (!confirm("Are you sure you want to delete this master recipe?")) return;
  const db = getDb();
  if (!db) return alert("Database connection not ready.");
  db.from('master_recipes').delete().eq('id', id).then(() => {
    alert("Master recipe deleted.");
    if (typeof loadAushadhiNirmanData === 'function') loadAushadhiNirmanData();
  }).catch(err => alert("Delete failed: " + err.message));
};
window.deleteRecipe = window.deleteMasterRecipe;

// 5. MAIN DATA LOADER & TABLE RENDER ENGINE
async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db || typeof db.from !== 'function') {
    setTimeout(loadAushadhiNirmanData, 400);
    return;
  }

  try {
    // 1. Fetch & Render Raw Materials
    const { data: raw } = await db.from('raw_materials').select('*').order('name', { ascending: true });
    window.nrmState = window.nrmState || {};
    window.nrmState.raw = raw || [];

    const tbRaw = document.getElementById('tbody-raw-materials') || document.getElementById('nrm-tb-raw');
    if (tbRaw && raw) {
      tbRaw.innerHTML = raw.map(r => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
          <td style="padding:0.5rem; color:#9ca3af; font-size:0.85rem;">${r.id}</td>
          <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
          <td style="padding:0.5rem;">${r.category || '-'}</td>
          <td style="padding:0.5rem;">${r.stock || 0} ${r.unit || ''}</td>
          <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 10} ${r.unit || ''}</td>
          <td style="padding:0.5rem; color:#10b981;">₹${r.stock > 0 ? ((r.purchase_rate || 0) / r.stock).toFixed(2) : '0.00'}</td>
          <td style="padding:0.5rem; text-align:center;">
            <button onclick="window.editRawMaterial('${r.id}')" style="background:#2563eb; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer; margin-right:4px;">Edit</button>
            <button onclick="window.deleteRawMaterial('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem; color:white;">No raw materials found.</td></tr>';
    }

    // 2. Fetch & Render Master Recipes
    const { data: rec } = await db.from('master_recipes').select('*');
    window.nrmState.recipes = rec || [];

    const tbRec = document.getElementById('tbody-master-recipes') || document.getElementById('nrm-tb-recipes') || document.getElementById('tbody-recipes');
    if (tbRec && rec) {
      tbRec.innerHTML = rec.map(r => {
        const ingText = window.formatIngredients(r.ingredients);
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
            <td style="padding:0.5rem; color:#9ca3af; font-size:0.85rem;">${r.id || '-'}</td>
            <td style="padding:0.5rem; font-weight:bold;">${r.name || r.medicine_name || 'Unnamed'}</td>
            <td style="padding:0.5rem; font-family:monospace;">${r.barcode || '-'}</td>
            <td style="padding:0.5rem; font-size:0.85rem; color:#e2e8f0;">${ingText}</td>
            <td style="padding:0.5rem; text-align:center;">
              <button onclick="window.editMasterRecipe('${r.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:3px; cursor:pointer; margin-right:4px;">Edit</button>
              <button onclick="window.deleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="5" style="text-align:center; padding:1rem; color:white;">No master recipes found.</td></tr>';
    }
  } catch (e) {
    console.error("Aushadhi Nirman load error:", e);
  }
}

window.loadAushadhiNirmanData = loadAushadhiNirmanData;
window.loadNirmanData = loadAushadhiNirmanData;

// Global event delegation for tab switches
document.addEventListener('click', function(e) {
  const item = e.target.closest('[onclick*="switchTab"]');
  if (item && item.getAttribute('onclick').includes('5')) {
    setTimeout(loadAushadhiNirmanData, 200);
  }
});

document.addEventListener('DOMContentLoaded', loadAushadhiNirmanData);
