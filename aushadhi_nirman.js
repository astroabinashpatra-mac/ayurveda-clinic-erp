/**
 * MODULE 5: AUSHADHI NIRMAN (MEDICINE PRODUCTION & INVENTORY ENGINE)
 * Direct DOM ID targeting & Supabase public schema integration.
 */

window.nirmanState = {
  currentIngredients: [],
  rawMaterials: [],
  masterRecipes: [],
  editingRmId: null
};

// Database Client Detection
function getDb() {
  if (typeof sbClient !== 'undefined' && sbClient) return sbClient;
  if (window.sbClient) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
  if (typeof supabase !== 'undefined' && supabase) return supabase;
  return null;
}

// DOM Helper
function el(id) {
  return document.getElementById(id);
}

// --- MODAL DISPLAY CONTROLLERS ---
function openMasterRecipeModal() {
  const modal = el('modal-master-recipe');
  if (!modal) return alert("DOM Error: #modal-master-recipe not found.");

  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';

  window.nirmanState.currentIngredients = [];
  renderModalIngredientsTable();
  populateRawMaterialsSelect();

  if (el('input-recipe-name')) el('input-recipe-name').value = '';
}

function closeMasterRecipeModal() {
  const modal = el('modal-master-recipe');
  if (modal) modal.style.display = 'none';
  window.nirmanState.currentIngredients = [];
}

function openRawMaterialModal(editItem = null) {
  const modal = el('modal-raw-material');
  if (!modal) return alert("DOM Error: #modal-raw-material not found.");

  window.nirmanState.editingRmId = editItem ? editItem.id : null;
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';

  if (el('input-rm-name')) el('input-rm-name').value = editItem ? editItem.name : '';
  if (el('select-rm-category')) el('select-rm-category').value = editItem ? (editItem.category || 'Herbs') : 'Herbs';
  if (el('select-rm-unit')) el('select-rm-unit').value = editItem ? (editItem.unit || 'kg') : 'kg';
  if (el('input-rm-stock')) el('input-rm-stock').value = editItem ? editItem.stock : '';
  if (el('input-rm-reorder')) el('input-rm-reorder').value = editItem ? editItem.reorder : '';
  if (el('input-rm-cost')) el('input-rm-cost').value = editItem ? (editItem.purchase_rate || '') : '';
}

function closeRawMaterialModal() {
  const modal = el('modal-raw-material');
  if (modal) modal.style.display = 'none';
  window.nirmanState.editingRmId = null;
}

// --- DATABASE FETCH & UI RENDERERS ---
async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db) return;

  try {
    // 1. Fetch raw_materials table
    const { data: rawData, error: rawErr } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (!rawErr && rawData) {
      window.nirmanState.rawMaterials = rawData;
      renderRawMaterialsTable(rawData);
      populateRawMaterialsSelect();
    }

    // 2. Fetch master_recipes table
    const { data: recData, error: recErr } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    if (!recErr && recData) {
      window.nirmanState.masterRecipes = recData;
      renderMasterRecipesTable(recData);
    }
  } catch (err) {
    console.error("Data load exception:", err);
  }
}

function renderRawMaterialsTable(data) {
  const tbody = el('tbody-raw-materials');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1rem; color:#9ca3af;">No raw materials found in database.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(item => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding: 0.6rem; color: white;">${item.id}</td>
      <td style="padding: 0.6rem; color: white; font-weight: bold;">${item.name}</td>
      <td style="padding: 0.6rem; color: white;">${item.category || 'Herbs'}</td>
      <td style="padding: 0.6rem; color: white;">${parseFloat(item.stock || 0).toFixed(2)} ${item.unit || 'kg'}</td>
      <td style="padding: 0.6rem; color: white;">${item.reorder || 0} ${item.unit || 'kg'}</td>
      <td style="padding: 0.6rem;"><span style="color:#10b981; font-weight:bold;">SUFFICIENT</span></td>
      <td style="padding: 0.6rem; text-align: center;">
        <button type="button" onclick="editRawMaterial('${item.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
        <button type="button" onclick="deleteRawMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderMasterRecipesTable(data) {
  const tbody = el('tbody-master-recipes');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem; color:#9ca3af;">No master recipes registered.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    let ingText = 'No ingredients';
    if (r.ingredients) {
      try {
        const parsed = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
        if (Array.isArray(parsed)) {
          ingText = parsed.map(i => `${i.name || i.id} (${i.qty})`).join(', ');
        }
      } catch (e) { ingText = r.ingredients; }
    } else if (r.raw_req_id) {
      ingText = `${r.raw_req_id} (${r.req_qty_per_unit})`;
    }

    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
        <td style="padding: 0.6rem; color: white;">${r.id}</td>
        <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.name || r.medicine_name || 'Unnamed'}</td>
        <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
        <td style="padding: 0.6rem; color: #9ca3af;">${ingText}</td>
        <td style="padding: 0.6rem; text-align: center;">
          <button type="button" onclick="deleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateRawMaterialsSelect() {
  const select = el('select-recipe-raw-material');
  if (!select) return;

  const list = window.nirmanState.rawMaterials || [];
  select.innerHTML = '<option value="">-- Select Raw Material --</option>' +
    list.map(m => `<option value="${m.id}">${m.id} - ${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

// --- CRUD: RAW MATERIALS ---
async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("Supabase database client unavailable.");

  const name = el('input-rm-name')?.value.trim();
  if (!name) return alert("Material Name is required.");

  const category = el('select-rm-category')?.value || 'Herbs';
  const unit = el('select-rm-unit')?.value || 'kg';
  const stock = parseFloat(el('input-rm-stock')?.value || 0);
  const reorder = parseFloat(el('input-rm-reorder')?.value || 0);
  const cost = parseFloat(el('input-rm-cost')?.value || 0);

  const payload = {
    name: name,
    category: category,
    unit: unit,
    stock: isNaN(stock) ? 0 : stock,
    reorder: isNaN(reorder) ? 0 : reorder,
    purchase_rate: isNaN(cost) ? 0 : cost
  };

  if (window.nirmanState.editingRmId) {
    const { error } = await db.from('raw_materials').update(payload).eq('id', window.nirmanState.editingRmId);
    if (error) return alert("Update failed: " + error.message);
    alert("Raw Material updated successfully!");
  } else {
    payload.id = 'RAW-' + Date.now();
    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Save failed: " + error.message);
    alert("Raw Material saved successfully!");
  }

  closeRawMaterialModal();
  loadAushadhiNirmanData();
}

function editRawMaterial(id) {
  const item = (window.nirmanState.rawMaterials || []).find(r => r.id === id);
  if (item) openRawMaterialModal(item);
}

async function deleteRawMaterial(id) {
  if (!confirm(`Delete raw material ${id}?`)) return;
  const db = getDb();
  const { error } = await db.from('raw_materials').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

// --- BOM RECIPE BUILDER ---
function addIngredientToRecipe() {
  const select = el('select-recipe-raw-material');
  const qtyInp = el('input-recipe-qty');

  if (!select || !select.value) return alert("Select a Raw Material first.");
  const qty = parseFloat(qtyInp ? qtyInp.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Quantity per unit must be > 0.");

  const matId = select.value;
  const matName = select.options[select.selectedIndex].text;

  const existing = window.nirmanState.currentIngredients.find(i => i.id === matId);
  if (existing) {
    existing.qty += qty;
  } else {
    window.nirmanState.currentIngredients.push({ id: matId, name: matName, qty: qty });
  }

  renderModalIngredientsTable();
  if (qtyInp) qtyInp.value = '';
}

function renderModalIngredientsTable() {
  const tbody = el('tbody-modal-ingredients');
  if (!tbody) return;

  const list = window.nirmanState.currentIngredients;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:0.8rem; color:#9ca3af;">No ingredients added yet.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((item, idx) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding:0.5rem; color:white;">${item.name}</td>
      <td style="padding:0.5rem; color:white; font-weight:bold;">${item.qty}</td>
      <td style="padding:0.5rem; text-align:center;">
        <button type="button" onclick="removeIngredientItem(${idx})" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function removeIngredientItem(idx) {
  window.nirmanState.currentIngredients.splice(idx, 1);
  renderModalIngredientsTable();
}

// --- CRUD: MASTER RECIPES ---
async function saveMasterRecipe() {
  const db = getDb();
  if (!db) return alert("Supabase database client unavailable.");

  const medicineName = el('input-recipe-name')?.value.trim();
  if (!medicineName) return alert("Output Medicine Name is required.");

  if (window.nirmanState.currentIngredients.length === 0) {
    return alert("Add at least 1 raw material ingredient using '+ Add Ingredient'.");
  }

  const recipeId = 'REC-' + Date.now().toString().slice(-6);
  const barcodeVal = 'BC-' + Math.floor(100000 + Math.random() * 900000);
  const firstIng = window.nirmanState.currentIngredients[0];

  const payload = {
    id: recipeId,
    name: medicineName,
    barcode: barcodeVal,
    raw_req_id: firstIng ? firstIng.id : null,
    req_qty_per_unit: firstIng ? firstIng.qty : 0,
    ingredients: JSON.stringify(window.nirmanState.currentIngredients)
  };

  const { error } = await db.from('master_recipes').insert([payload]);
  if (error) return alert("Recipe save failed: " + error.message);

  alert("Master Recipe & BOM saved successfully to Supabase!");
  closeMasterRecipeModal();
  loadAushadhiNirmanData();
}

async function deleteMasterRecipe(id) {
  if (!confirm(`Delete master recipe ${id}?`)) return;
  const db = getDb();
  const { error } = await db.from('master_recipes').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

// --- BATCH PRODUCTION & AUTO STOCK DEDUCTION ---
async function executeBatchProduction() {
  const db = getDb();
  if (!db) return alert("Supabase database client unavailable.");

  const { data: recipes } = await db.from('master_recipes').select('*');
  if (!recipes || recipes.length === 0) return alert("No master recipes registered.");

  const menu = recipes.map((r, i) => `${i + 1}. ${r.name || r.medicine_name || r.id}`).join('\n');
  const sel = prompt("Select Master Recipe Number for Batch Production:\n" + menu);
  if (!sel) return;

  const target = recipes[parseInt(sel) - 1];
  if (!target) return alert("Invalid recipe choice.");

  const batchQty = parseFloat(prompt(`Enter production units to manufacture for '${target.name || target.id}':`, "10"));
  if (isNaN(batchQty) || batchQty <= 0) return alert("Invalid production quantity.");

  let ingredients = [];
  if (target.ingredients) {
    try {
      ingredients = typeof target.ingredients === 'string' ? JSON.parse(target.ingredients) : target.ingredients;
    } catch (e) { console.error(e); }
  } else if (target.raw_req_id) {
    ingredients = [{ id: target.raw_req_id, qty: target.req_qty_per_unit || 0 }];
  }

  if (!ingredients.length) return alert("No raw materials mapped to this master recipe.");

  let deductionLog = [];
  for (const ing of ingredients) {
    const rawId = ing.id;
    const qtyNeeded = (parseFloat(ing.qty) || 0) * batchQty;

    const { data: raw } = await db.from('raw_materials').select('stock, name, unit').eq('id', rawId).single();
    if (raw) {
      const curStock = parseFloat(raw.stock || 0);
      const newStock = Math.max(0, curStock - qtyNeeded);
      await db.from('raw_materials').update({ stock: newStock }).eq('id', rawId);
      deductionLog.push(`${raw.name}: ${curStock} -> ${newStock} ${raw.unit || ''} (-${qtyNeeded})`);
    }
  }

  alert(`Batch Production Successful!\nManufactured ${batchQty} units of ${target.name}.\n\nSupabase Stock Deductions:\n` + deductionLog.join('\n'));
  loadAushadhiNirmanData();
}

// Global Event Exports
window.openMasterRecipeModal = openMasterRecipeModal;
window.closeMasterRecipeModal = closeMasterRecipeModal;
window.openRawMaterialModal = openRawMaterialModal;
window.closeRawMaterialModal = closeRawMaterialModal;
window.saveRawMaterial = saveRawMaterial;
window.editRawMaterial = editRawMaterial;
window.deleteRawMaterial = deleteRawMaterial;
window.addIngredientToRecipe = addIngredientToRecipe;
window.removeIngredientItem = removeIngredientItem;
window.saveMasterRecipe = saveMasterRecipe;
window.deleteMasterRecipe = deleteMasterRecipe;
window.executeBatchProduction = executeBatchProduction;
window.loadAushadhiNirmanData = loadAushadhiNirmanData;

// Boot Auto-Loaders
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAushadhiNirmanData);
} else {
  loadAushadhiNirmanData();
}
window.addEventListener('load', loadAushadhiNirmanData);
