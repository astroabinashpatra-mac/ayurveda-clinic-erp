// 1. GLOBAL STATE & DB ACCESS
window.nirmanState = {
  currentIngredients: [],
  rawMaterials: [],
  masterRecipes: [],
  editingRmId: null,
  activeRecipeForBatch: null
};

function getDb() {
  return window.sbClient || (typeof sbClient !== 'undefined' ? sbClient : null) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
}

function el(id) {
  return document.getElementById(id);
}

// 2. IMMEDIATE GLOBAL WINDOW BINDINGS (MODAL HANDLERS)
window.nirmanOpenRawMaterialModal = function(item = null) {
  const modal = el('nirman-modal-raw-material');
  if (!modal) return alert("Raw Material Modal element missing in HTML.");
  modal.style.display = 'flex';
  window.nirmanState.editingRmId = item ? item.id : null;
  if (el('nirman-rm-name')) el('nirman-rm-name').value = item ? item.name : '';
  if (el('nirman-rm-category')) el('nirman-rm-category').value = item ? (item.category || 'Herbs') : 'Herbs';
  if (el('nirman-rm-unit')) el('nirman-rm-unit').value = item ? (item.unit || 'gms') : 'gms';
  if (el('nirman-rm-stock')) el('nirman-rm-stock').value = item ? item.stock : '';
  if (el('nirman-rm-reorder')) el('nirman-rm-reorder').value = item ? (item.reorder || 100) : '100';
  if (el('nirman-rm-cost')) el('nirman-rm-cost').value = item ? (item.purchase_rate || '') : '';
};

window.nirmanCloseRawMaterialModal = function() {
  const modal = el('nirman-modal-raw-material');
  if (modal) modal.style.display = 'none';
  window.nirmanState.editingRmId = null;
};

window.nirmanOpenMasterRecipeModal = function() {
  const modal = el('nirman-modal-master-recipe');
  if (!modal) return alert("Master Recipe Modal element missing in HTML.");
  modal.style.display = 'flex';
  window.nirmanState.currentIngredients = [];
  window.nirmanRenderModalIngredientsTable();
  window.nirmanPopulateRawMaterialsSelect();
  if (el('nirman-recipe-name')) el('nirman-recipe-name').value = '';
  if (el('nirman-recipe-margin')) el('nirman-recipe-margin').value = '20';
};

window.nirmanCloseMasterRecipeModal = function() {
  const modal = el('nirman-modal-master-recipe');
  if (modal) modal.style.display = 'none';
  window.nirmanState.currentIngredients = [];
};

window.nirmanOpenBatchModal = function(recipeId) {
  const recipe = (window.nirmanState.masterRecipes || []).find(r => r.id === recipeId);
  if (!recipe) return alert("Recipe record not found.");
  window.nirmanState.activeRecipeForBatch = recipe;
  const modal = el('nirman-modal-batch-exec');
  if (!modal) return alert("Batch Modal element missing in HTML.");
  modal.style.display = 'flex';
  const d = new Date();
  const yrStr = d.getFullYear().toString();
  const monStr = String(d.getMonth() + 1).padStart(2, '0');
  const randNum = Math.floor(100 + Math.random() * 900);
  if (el('nirman-batch-recipe-title')) el('nirman-batch-recipe-title').innerText = `Formulation: ${recipe.name || recipe.medicine_name}`;
  if (el('nirman-batch-code')) el('nirman-batch-code').value = `BATCH-${yrStr}${monStr}-${randNum}`;
};

window.nirmanCloseBatchModal = function() {
  const modal = el('nirman-modal-batch-exec');
  if (modal) modal.style.display = 'none';
  window.nirmanState.activeRecipeForBatch = null;
};

window.nirmanTriggerGlobalBatchPrompt = function() {
  const recipes = window.nirmanState.masterRecipes || [];
  if (recipes.length === 0) return alert("No master recipes registered.");
  const menu = recipes.map((r, i) => `${i + 1}. ${r.name || r.medicine_name || r.id}`).join('\n');
  const sel = prompt("Select Master Recipe Number for Batch Production:\n" + menu);
  if (!sel) return;
  const target = recipes[parseInt(sel) - 1];
  if (target) window.nirmanOpenBatchModal(target.id);
  else alert("Invalid recipe choice.");
};

// 3. BOM & TABLE RENDERERS
window.nirmanPopulateRawMaterialsSelect = function() {
  const select = el('nirman-select-recipe-rm');
  if (!select) return;
  const list = window.nirmanState.rawMaterials || [];
  select.innerHTML = '<option value="">-- Select Raw Material --</option>' +
    list.map(m => `<option value="${m.id}">${m.name} (Avail: ${m.stock} ${m.unit || 'gms'})</option>`).join('');
};

window.nirmanRenderModalIngredientsTable = function() {
  const tbody = el('nirman-tbody-modal-ingredients');
  if (!tbody) return;
  const list = window.nirmanState.currentIngredients;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:0.8rem; color:#9ca3af;">No ingredients added.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((item, idx) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding:0.5rem; color:white;">${item.name}</td>
      <td style="padding:0.5rem; color:white; font-weight:bold;">${item.qty}</td>
      <td style="padding:0.5rem; text-align:center;">
        <button type="button" onclick="window.nirmanState.currentIngredients.splice(${idx},1); window.nirmanRenderModalIngredientsTable();" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
};

window.nirmanAddIngredientToRecipe = function() {
  const select = el('nirman-select-recipe-rm');
  const qtyInp = el('nirman-recipe-qty');
  if (!select || !select.value) return alert("Select a Raw Material first.");
  const qty = parseFloat(qtyInp ? qtyInp.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Ingredient Qty must be > 0.");
  const matId = select.value;
  const rawItem = (window.nirmanState.rawMaterials || []).find(r => r.id === matId);
  const matName = rawItem ? rawItem.name : matId;
  const availStock = rawItem ? parseFloat(rawItem.stock || 0) : 0;
  if (qty > availStock) return alert(`Cannot add ${qty}. Only ${availStock} available!`);
  const existing = window.nirmanState.currentIngredients.find(i => i.id === matId);
  if (existing) {
    if (existing.qty + qty > availStock) return alert("Total ingredient qty exceeds available stock!");
    existing.qty += qty;
  } else {
    window.nirmanState.currentIngredients.push({ id: matId, name: matName, qty: qty });
  }
  window.nirmanRenderModalIngredientsTable();
  if (qtyInp) qtyInp.value = '';
};

// 4. DATABASE SYNC ACTIONS
window.nirmanSaveRawMaterial = async function() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");
  const name = el('nirman-rm-name')?.value.trim();
  if (!name) return alert("Material Name is required.");
  const category = el('nirman-rm-category')?.value || 'Herbs';
  const unit = el('nirman-rm-unit')?.value || 'gms';
  const stock = parseFloat(el('nirman-rm-stock')?.value || 0);
  const reorder = parseFloat(el('nirman-rm-reorder')?.value || 0);
  const cost = parseFloat(el('nirman-rm-cost')?.value || 0);
  if (isNaN(stock) || stock <= 0) return alert("Initial Quantity must be > 0.");
  if (isNaN(reorder) || reorder < 0) return alert("Reorder Limit must be >= 0.");
  if (isNaN(cost) || cost < 0) return alert("Purchase Cost must be valid.");
  const payload = { id: 'RAW-' + Date.now(), name, category, unit, stock, reorder, purchase_rate: cost };
  const { error: rawErr } = await db.from('raw_materials').insert([payload]);
  if (rawErr) return alert("Database Raw Materials insert failed: " + rawErr.message);
  try {
    await db.from('accounts_vendors').insert([{ type: 'Expense', title: `Raw Material Purchase: ${name}`, category: 'Raw Materials', amount: cost, status: 'Paid' }]);
  } catch(e) { console.warn("Accounts sync failed", e); }
  alert("Raw Material saved successfully!");
  window.nirmanCloseRawMaterialModal();
  await window.loadAushadhiNirmanData();
};

window.nirmanDeleteRawMaterial = async function(id) {
  if (!confirm(`Delete raw material ${id}?`)) return;
  const db = getDb();
  if (!db) return;
  await db.from('raw_materials').delete().eq('id', id);
  await window.loadAushadhiNirmanData();
};

window.nirmanSaveMasterRecipe = async function() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");
  const medicineName = el('nirman-recipe-name')?.value.trim();
  const marginPct = parseFloat(el('nirman-recipe-margin')?.value || 0);
  if (!medicineName) return alert("Output Medicine Name is required.");
  if (window.nirmanState.currentIngredients.length === 0) return alert("Add at least 1 raw material ingredient.");
  const rawMap = {};
  (window.nirmanState.rawMaterials || []).forEach(rm => { rawMap[rm.id] = rm; });
  let totalCOP = 0;
  for (const ing of window.nirmanState.currentIngredients) {
    const raw = rawMap[ing.id];
    if (raw) {
      const stock = parseFloat(raw.stock || 1);
      const cost = parseFloat(raw.purchase_rate || 0);
      const unitCost = stock > 0 ? (cost / stock) : 0;
      totalCOP += unitCost * (parseFloat(ing.qty) || 0);
    }
  }
  const sellingPrice = totalCOP + (totalCOP * (marginPct / 100));
  const recipeId = 'REC-' + Date.now().toString().slice(-6);
  const barcodeVal = 'BC-' + Math.floor(100000 + Math.random() * 900000);
  const firstIng = window.nirmanState.currentIngredients[0];
  const payload = {
    id: recipeId, name: medicineName, barcode: barcodeVal,
    raw_req_id: firstIng ? firstIng.id : null, req_qty_per_unit: firstIng ? firstIng.qty : 0,
    cop: totalCOP, profit_margin: marginPct, selling_price: sellingPrice,
    ingredients: JSON.stringify(window.nirmanState.currentIngredients)
  };
  const { error } = await db.from('master_recipes').insert([payload]);
  if (error) return alert("Recipe save failed: " + error.message);
  alert(`Master Recipe Saved!\nCOP: ₹${totalCOP.toFixed(2)} | MRP: ₹${sellingPrice.toFixed(2)}`);
  window.nirmanCloseMasterRecipeModal();
  await window.loadAushadhiNirmanData();
};

window.nirmanDeleteMasterRecipe = async function(id) {
  if (!confirm(`Delete master recipe ${id}?`)) return;
  const db = getDb();
  if (!db) return;
  await db.from('master_recipes').delete().eq('id', id);
  await window.loadAushadhiNirmanData();
};

window.nirmanConfirmBatchProduction = async function() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");
  const recipe = window.nirmanState.activeRecipeForBatch;
  if (!recipe) return alert("No active recipe selected.");
  const batchCode = el('nirman-batch-code')?.value.trim();
  const expiryDate = el('nirman-batch-expiry')?.value.trim();
  const batchQty = parseFloat(el('nirman-batch-qty')?.value || 0);
  if (isNaN(batchQty) || batchQty <= 0) return alert("Production Units must be > 0.");
  if (!expiryDate) return alert("Expiry Date is required.");
  let ingredients = [];
  if (recipe.ingredients) {
    try { ingredients = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients; } catch (e) {}
  } else if (recipe.raw_req_id) {
    ingredients = [{ id: recipe.raw_req_id, qty: recipe.req_qty_per_unit || 0 }];
  }
  if (!ingredients.length) return alert("No raw materials mapped to this recipe.");
  for (const ing of ingredients) {
    const qtyNeeded = (parseFloat(ing.qty) || 0) * batchQty;
    const { data: raw } = await db.from('raw_materials').select('stock, name, unit').eq('id', ing.id).single();
    if (!raw || parseFloat(raw.stock || 0) < qtyNeeded) {
      return alert(`Insufficient Stock for '${raw ? raw.name : ing.id}'. Required: ${qtyNeeded}, Avail: ${raw ? raw.stock : 0}`);
    }
  }
  for (const ing of ingredients) {
    const qtyNeeded = (parseFloat(ing.qty) || 0) * batchQty;
    const { data: raw } = await db.from('raw_materials').select('stock').eq('id', ing.id).single();
    const curStock = parseFloat(raw.stock || 0);
    await db.from('raw_materials').update({ stock: Math.max(0, curStock - qtyNeeded) }).eq('id', ing.id);
  }
  const medicineName = recipe.name || recipe.medicine_name || 'Ayurvedic Medicine';
  const mrpPrice = parseFloat(recipe.selling_price || recipe.cop || 0);
  const pharmacyPayload = {
    barcode: recipe.barcode || ('BC-' + Date.now().toString().slice(-6)),
    name: medicineName, batch_code: batchCode, expiry: expiryDate, price: mrpPrice, stock: batchQty
  };
  const { error: pharmErr } = await db.from('pharmacy_stock').insert([pharmacyPayload]);
  if (pharmErr) return alert("Stock update error: " + pharmErr.message);
  alert(`Batch Manufactured!\nMedicine: ${medicineName}\nBatch: ${batchCode}\nUnits: ${batchQty}`);
  window.nirmanCloseBatchModal();
  await window.loadAushadhiNirmanData();
};

// 5. SAFE INITIAL DATA LOAD
window.loadAushadhiNirmanData = async function() {
  const db = getDb();
  if (!db) return;
  try {
    const { data: rawData } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (rawData) {
      window.nirmanState.rawMaterials = rawData;
      const tbodyRaw = el('tbody-raw-materials') || el('nirman-tbody-raw-materials');
      if (tbodyRaw) {
        tbodyRaw.innerHTML = rawData.length ? rawData.map(item => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 0.6rem; color: white;">${item.id}</td>
            <td style="padding: 0.6rem; color: white; font-weight: bold;">${item.name}</td>
            <td style="padding: 0.6rem; color: white;">${item.category || 'Herbs'}</td>
            <td style="padding: 0.6rem; color: white;">${parseFloat(item.stock||0).toFixed(2)} ${item.unit || 'gms'}</td>
            <td style="padding: 0.6rem; color: #f59e0b;">${parseFloat(item.reorder||0).toFixed(2)} ${item.unit || 'gms'}</td>
            <td style="padding: 0.6rem; color: #10b981; font-weight: bold;">₹${parseFloat(item.purchase_rate||0).toFixed(2)}</td>
            <td style="padding: 0.6rem; text-align: center;">
              <button type="button" onclick="window.nirmanDeleteRawMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="7" style="text-align:center; padding:1rem; color:#9ca3af;">No raw materials found.</td></tr>';
      }
    }
    const { data: recData } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    if (recData) {
      window.nirmanState.masterRecipes = recData;
      const tbodyRec = el('tbody-master-recipes') || el('nirman-tbody-master-recipes');
      if (tbodyRec) {
        tbodyRec.innerHTML = recData.length ? recData.map(r => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 0.6rem; color: white;">${r.id}</td>
            <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.name || r.medicine_name || 'Unnamed'}</td>
            <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
            <td style="padding: 0.6rem; color: #ef4444; font-weight: bold;">₹${parseFloat(r.cop||0).toFixed(2)}</td>
            <td style="padding: 0.6rem; color: #10b981; font-weight: bold;">₹${parseFloat(r.selling_price||0).toFixed(2)}</td>
            <td style="padding: 0.6rem; color: #cbd5e1;">${r.ingredients ? 'Ingredients mapped' : 'No ingredients mapped'}</td>
            <td style="padding: 0.6rem; text-align: center;">
              <button type="button" onclick="window.nirmanOpenBatchModal('${r.id}')" style="background:#16a34a; color:white; border:none; padding:0.25rem 0.6rem; border-radius:4px; margin-right:4px; cursor:pointer; font-weight:bold;">Produce Batch</button>
              <button type="button" onclick="window.nirmanDeleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="7" style="text-align:center; padding:1rem; color:#9ca3af;">No master recipes found.</td></tr>';
      }
    }
  } catch(e) { console.error("Load exception:", e); }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.loadAushadhiNirmanData);
} else {
  window.loadAushadhiNirmanData();
}


// GLOBAL WINDOW ALIASES (FIXES HTML FUNCTION NAME MISMATCHES)
window.openRawMaterialModal = window.nirmanOpenRawMaterialModal;
window.closeRawMaterialModal = window.nirmanCloseRawMaterialModal;
window.saveRawMaterial = window.nirmanSaveRawMaterial;
window.deleteRawMaterial = window.nirmanDeleteRawMaterial;

window.openMasterRecipeModal = window.nirmanOpenMasterRecipeModal;
window.closeMasterRecipeModal = window.nirmanCloseMasterRecipeModal;
window.saveMasterRecipe = window.nirmanSaveMasterRecipe;
window.deleteMasterRecipe = window.nirmanDeleteMasterRecipe;

window.executeBatchProduction = window.nirmanTriggerGlobalBatchPrompt || window.nirmanOpenBatchModal;
window.openBatchModal = window.nirmanOpenBatchModal;
window.closeBatchModal = window.nirmanCloseBatchModal;
