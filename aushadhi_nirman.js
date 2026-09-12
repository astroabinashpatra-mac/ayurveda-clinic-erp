/**
 * MODULE 5: AUSHADHI NIRMAN (MEDICINE PRODUCTION ENGINE)
 * Fully isolated JS engine using direct ID targeting.
 */

window.nirmanState = {
  currentIngredients: [],
  rawMaterials: [],
  masterRecipes: [],
  editingRmId: null
};

// --- DATABASE CLIENT RESOLVER ---
function getNirmanDb() {
  if (typeof sbClient !== 'undefined' && sbClient) return sbClient;
  if (window.sbClient) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
  if (typeof supabase !== 'undefined' && supabase) return supabase;
  return null;
}

// --- SAFE DOM ELEMENT GETTER ---
function getEl(id) {
  return document.getElementById(id);
}

// --- MODAL CONTROLLERS ---
function openMasterRecipeModal() {
  const modal = getEl('modal-master-recipe');
  if (!modal) return alert("Error: #modal-master-recipe not found in DOM.");
  
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  
  window.nirmanState.currentIngredients = [];
  renderRecipeIngredientsTable();
  populateRawMaterialsSelect();

  const nameInp = getEl('input-recipe-name');
  if (nameInp) nameInp.value = '';
}

function closeMasterRecipeModal() {
  const modal = getEl('modal-master-recipe');
  if (modal) modal.style.display = 'none';
  window.nirmanState.currentIngredients = [];
}

function openRawMaterialModal(editItem = null) {
  const modal = getEl('modal-raw-material');
  if (!modal) return alert("Error: #modal-raw-material not found in DOM.");

  window.nirmanState.editingRmId = editItem ? editItem.id : null;
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';

  if (getEl('input-rm-name')) getEl('input-rm-name').value = editItem ? editItem.name : '';
  if (getEl('select-rm-category')) getEl('select-rm-category').value = editItem ? (editItem.category || 'Herbs') : 'Herbs';
  if (getEl('select-rm-unit')) getEl('select-rm-unit').value = editItem ? (editItem.unit || 'kg') : 'kg';
  if (getEl('input-rm-stock')) getEl('input-rm-stock').value = editItem ? editItem.stock : '';
  if (getEl('input-rm-reorder')) getEl('input-rm-reorder').value = editItem ? editItem.reorder : '';
  if (getEl('input-rm-cost')) getEl('input-rm-cost').value = editItem ? (editItem.purchase_rate || '') : '';
}

function closeRawMaterialModal() {
  const modal = getEl('modal-raw-material');
  if (modal) modal.style.display = 'none';
  window.nirmanState.editingRmId = null;
}

// --- DATA FETCH & RENDER ENGINE ---
async function loadAushadhiNirmanData() {
  const db = getNirmanDb();
  if (!db) return;

  try {
    // 1. Fetch Raw Materials Inventory
    const { data: rawData, error: rawErr } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (!rawErr && rawData) {
      window.nirmanState.rawMaterials = rawData;
      renderRawMaterialsTable(rawData);
      populateRawMaterialsSelect();
    }

    // 2. Fetch Master Recipes
    const { data: recData, error: recErr } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    if (!recErr && recData) {
      window.nirmanState.masterRecipes = recData;
      renderMasterRecipesTable(recData);
    }
  } catch (err) {
    console.error("Aushadhi Nirman load error:", err);
  }
}

function renderRawMaterialsTable(data) {
  const tbody = getEl('tbody-raw-materials');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1rem; color:#9ca3af;">No raw materials found.</td></tr>';
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
  const tbody = getEl('tbody-master-recipes');
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
      } catch (e) {
        ingText = r.ingredients;
      }
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
  const select = getEl('select-recipe-raw-material');
  if (!select) return;

  const list = window.nirmanState.rawMaterials || [];
  select.innerHTML = '<option value="">-- Select Raw Material --</option>' +
    list.map(m => `<option value="${m.id}">${m.id} - ${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

// --- CRUD OPERATIONS: RAW MATERIALS ---
async function saveRawMaterial() {
  const db = getNirmanDb();
  if (!db) return alert("Database client unavailable.");

  const nameInp = getEl('input-rm-name');
  const name = nameInp ? nameInp.value.trim() : '';
  if (!name) return alert("Material Name is required.");

  const category = getEl('select-rm-category')?.value || 'Herbs';
  const unit = getEl('select-rm-unit')?.value || 'kg';
  const stock = parseFloat(getEl('input-rm-stock')?.value || 0);
  const reorder = parseFloat(getEl('input-rm-reorder')?.value || 0);
  const cost = parseFloat(getEl('input-rm-cost')?.value || 0);

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
    alert("Raw Material updated!");
  } else {
    payload.id = 'RAW-' + Date.now();
    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Save failed: " + error.message);
    alert("Raw Material saved!");
  }

  closeRawMaterialModal();
  loadAushadhiNirmanData();
}

function editRawMaterial(id) {
  const item = window.nirmanState.rawMaterials.find(r => r.id === id);
  if (item) openRawMaterialModal(item);
}

async function deleteRawMaterial(id) {
  if (!confirm(`Delete raw material ${id}?`)) return;
  const db = getNirmanDb();
  const { error } = await db.from('raw_materials').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

// --- MODAL BOM BUILDER ENGINE ---
function addIngredientToRecipe() {
  const select = getEl('select-recipe-raw-material');
  const qtyInp = getEl('input-recipe-qty');

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

  renderRecipeIngredientsTable();
  if (qtyInp) qtyInp.value = '';
}

function renderRecipeIngredientsTable() {
  const tbody = getEl('tbody-modal-ingredients');
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
  renderRecipeIngredientsTable();
}

// --- CRUD OPERATIONS: MASTER RECIPES ---
async function saveMasterRecipe() {
  const db = getNirmanDb();
  if (!db) return alert("Database client unavailable.");

  const nameInp = getEl('input-recipe-name');
  const medicineName = nameInp ? nameInp.value.trim() : '';
  if (!medicineName) return alert("Output Medicine Name is required.");

  if (window.nirmanState.currentIngredients.length === 0) {
    return alert("Add at least 1 raw material ingredient.");
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

  alert("Master Recipe & BOM saved!");
  closeMasterRecipeModal();
  loadAushadhiNirmanData();
}

async function deleteMasterRecipe(id) {
  if (!confirm(`Delete master recipe ${id}?`)) return;
  const db = getNirmanDb();
  const { error } = await db.from('master_recipes').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

// --- AUTOMATED BATCH PRODUCTION & DEDUCTION ---
async function executeBatchProduction() {
  const db = getNirmanDb();
  if (!db) return alert("Database client unavailable.");

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

  alert(`Batch Production Successful!\nProduced ${batchQty} units of ${target.name}.\n\nStock Deductions:\n` + deductionLog.join('\n'));
  loadAushadhiNirmanData();
}

// --- GLOBAL WINDOW EXPOSURES ---
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

// Auto-Load on Startup
document.addEventListener('DOMContentLoaded', loadAushadhiNirmanData);
window.addEventListener('load', loadAushadhiNirmanData);
