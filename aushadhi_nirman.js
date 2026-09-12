/**
 * MODULE 5: AUSHADHI NIRMAN (DIRECT EVENT BINDING ENGINE)
 */
window.nirmanState = {
  currentIngredients: [],
  rawMaterials: [],
  masterRecipes: [],
  editingRmId: null
};

function getDb() {
  if (typeof sbClient !== 'undefined' && sbClient) return sbClient;
  if (window.sbClient) return window.sbClient;
  if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
  if (typeof supabase !== 'undefined' && supabase) return supabase;
  return null;
}

function el(id) {
  return document.getElementById(id);
}

// 1. MODAL CONTROLLERS
function openMasterRecipeModal() {
  const modal = el('modal-master-recipe');
  if (!modal) return alert("Modal container #modal-master-recipe missing.");
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
  if (!modal) return alert("Modal container #modal-raw-material missing.");
  
  window.nirmanState.editingRmId = editItem ? editItem.id : null;
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';

  const modalEl = modal;
  const nameInp = el('input-rm-name') || el('rm-name') || modalEl.querySelector('input[type="text"]');
  const catInp = el('select-rm-category') || el('rm-category') || modalEl.querySelectorAll('select')[0];
  const unitInp = el('select-rm-unit') || el('rm-unit') || modalEl.querySelectorAll('select')[1];
  const numInputs = modalEl.querySelectorAll('input[type="number"]');

  if (nameInp) nameInp.value = editItem ? editItem.name : '';
  if (catInp && editItem) catInp.value = editItem.category || 'Herbs';
  if (unitInp && editItem) unitInp.value = editItem.unit || 'kg';
  
  if (numInputs[0]) numInputs[0].value = editItem ? editItem.stock : '';
  if (numInputs[1]) numInputs[1].value = editItem ? editItem.reorder : '';
  if (numInputs[2]) numInputs[2].value = editItem ? (editItem.purchase_rate || '') : '';
}

function closeRawMaterialModal() {
  const modal = el('modal-raw-material');
  if (modal) modal.style.display = 'none';
  window.nirmanState.editingRmId = null;
}

// 2. DATA FETCH & RENDER
async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db) return;

  try {
    const { data: rawData } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (rawData) {
      window.nirmanState.rawMaterials = rawData;
      renderRawMaterialsTable(rawData);
      populateRawMaterialsSelect();
    }

    const { data: recData } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    if (recData) {
      window.nirmanState.masterRecipes = recData;
      renderMasterRecipesTable(recData);
    }
  } catch (err) {
    console.error("Data load exception:", err);
  }
}

function renderRawMaterialsTable(data) {
  const tbody = el('tbody-raw-materials') || document.querySelector('#module-aushadhi-nirman table tbody') || document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = data.map(item => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding: 0.6rem; color: white;">${item.id}</td>
      <td style="padding: 0.6rem; color: white; font-weight: bold;">${item.name}</td>
      <td style="padding: 0.6rem; color: white;">${item.category || 'Herbs'}</td>
      <td style="padding: 0.6rem; color: white;">${parseFloat(item.stock || 0).toFixed(2)} ${item.unit || 'kg'}</td>
      <td style="padding: 0.6rem; color: white;">${item.reorder || 0} ${item.unit || 'kg'}</td>
      <td style="padding: 0.6rem;"><span style="color:#10b981; font-weight:bold;">SUFFICIENT</span></td>
      <td style="padding: 0.6rem; text-align: center;">
        <button type="button" onclick="window.editRawMaterial('${item.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
        <button type="button" onclick="window.deleteRawMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderMasterRecipesTable(data) {
  const tbody = el('tbody-master-recipes') || document.querySelectorAll('#module-aushadhi-nirman table tbody')[1] || document.querySelectorAll('table')[1]?.querySelector('tbody');
  if (!tbody) return;

  const rawMap = {};
  (window.nirmanState.rawMaterials || []).forEach(rm => { rawMap[rm.id] = rm; });

  tbody.innerHTML = data.map(r => {
    let ingText = 'No ingredients';
    if (r.ingredients) {
      try {
        const parsed = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
        if (Array.isArray(parsed) && parsed.length > 0) {
          ingText = parsed.map(i => {
            const rawItem = rawMap[i.id];
            const name = i.name || (rawItem ? rawItem.name : i.id);
            const qty = i.qty || 1;
            const unit = rawItem ? (rawItem.unit || '') : '';
            return `${name} (${qty}${unit})`;
          }).join(', ');
        }
      } catch (e) { ingText = String(r.ingredients); }
    } else if (r.raw_req_id) {
      const rawItem = rawMap[r.raw_req_id];
      const name = rawItem ? rawItem.name : r.raw_req_id;
      const unit = rawItem ? (rawItem.unit || '') : '';
      ingText = `${name} (${r.req_qty_per_unit || 1}${unit})`;
    }

    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
        <td style="padding: 0.6rem; color: white;">${r.id}</td>
        <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.name || r.medicine_name || 'Unnamed'}</td>
        <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
        <td style="padding: 0.6rem; color: #9ca3af;">${ingText}</td>
        <td style="padding: 0.6rem; text-align: center;">
          <button type="button" onclick="window.deleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateRawMaterialsSelect() {
  const select = el('select-recipe-raw-material') || el('recipe-rm-select') || document.querySelector('#modal-master-recipe select');
  if (!select) return;

  const list = window.nirmanState.rawMaterials || [];
  select.innerHTML = '<option value="">-- Select Raw Material --</option>' +
    list.map(m => `<option value="${m.id}">${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

// 3. ACTION HANDLERS
async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");

  const modal = el('modal-raw-material') || document;
  const nameInp = el('input-rm-name') || el('rm-name') || modal.querySelector('input[type="text"]');
  const name = nameInp ? nameInp.value.trim() : '';
  if (!name) return alert("Material Name is required.");

  const catInp = el('select-rm-category') || el('rm-category') || modal.querySelectorAll('select')[0];
  const unitInp = el('select-rm-unit') || el('rm-unit') || modal.querySelectorAll('select')[1];
  const numInputs = modal.querySelectorAll('input[type="number"]');

  const stockVal = el('input-rm-stock')?.value || el('rm-stock')?.value || (numInputs[0] ? numInputs[0].value : 0);
  const reorderVal = el('input-rm-reorder')?.value || el('rm-reorder')?.value || (numInputs[1] ? numInputs[1].value : 0);
  const costVal = el('input-rm-cost')?.value || el('rm-cost')?.value || (numInputs[2] ? numInputs[2].value : 0);

  const payload = {
    name: name,
    category: catInp ? catInp.value : 'Herbs',
    unit: unitInp ? unitInp.value : 'kg',
    stock: parseFloat(stockVal) || 0,
    reorder: parseFloat(reorderVal) || 0,
    purchase_rate: parseFloat(costVal) || 0
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
  await db.from('raw_materials').delete().eq('id', id);
  loadAushadhiNirmanData();
}

function addIngredientToRecipe() {
  const modal = el('modal-master-recipe') || document;
  const select = el('select-recipe-raw-material') || el('recipe-rm-select') || modal.querySelector('select');
  const qtyInp = el('input-recipe-qty') || el('recipe-qty-input') || modal.querySelector('input[type="number"]');

  if (!select || !select.value) return alert("Select a Raw Material first.");
  const qty = parseFloat(qtyInp ? qtyInp.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Quantity per unit must be > 0.");

  const matId = select.value;
  const rawItem = (window.nirmanState.rawMaterials || []).find(r => r.id === matId);
  const matName = rawItem ? rawItem.name : matId;

  const existing = window.nirmanState.currentIngredients.find(i => i.id === matId);
  if (existing) existing.qty += qty;
  else window.nirmanState.currentIngredients.push({ id: matId, name: matName, qty: qty });

  renderModalIngredientsTable();
  if (qtyInp) qtyInp.value = '';
}

function renderModalIngredientsTable() {
  const modal = el('modal-master-recipe') || document;
  const tbody = el('tbody-modal-ingredients') || el('recipe-ingredients-tbody') || modal.querySelector('tbody');
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
        <button type="button" onclick="window.nirmanState.currentIngredients.splice(${idx},1); renderModalIngredientsTable();" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function saveMasterRecipe() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");

  const modal = el('modal-master-recipe') || document;
  const medInp = el('input-recipe-name') || el('recipe-med-name') || modal.querySelector('input[type="text"]:not([readonly])');
  const medicineName = medInp ? medInp.value.trim() : '';
  if (!medicineName) return alert("Output Medicine Name is required.");
  if (window.nirmanState.currentIngredients.length === 0) return alert("Add at least 1 raw material ingredient.");

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

  alert("Master Recipe saved successfully!");
  closeMasterRecipeModal();
  loadAushadhiNirmanData();
}

async function deleteMasterRecipe(id) {
  if (!confirm(`Delete master recipe ${id}?`)) return;
  const db = getDb();
  await db.from('master_recipes').delete().eq('id', id);
  loadAushadhiNirmanData();
}

async function executeBatchProduction() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");

  const { data: recipes } = await db.from('master_recipes').select('*');
  if (!recipes || recipes.length === 0) return alert("No master recipes registered.");

  const menu = recipes.map((r, i) => `${i + 1}. ${r.name || r.medicine_name || r.id}`).join('
');
  const sel = prompt("Select Master Recipe Number for Batch Production:
" + menu);
  if (!sel) return;

  const target = recipes[parseInt(sel) - 1];
  if (!target) return alert("Invalid recipe choice.");

  const batchQty = parseFloat(prompt(`Enter production units for '${target.name || target.id}':`, "10"));
  if (isNaN(batchQty) || batchQty <= 0) return alert("Invalid production quantity.");

  let ingredients = [];
  if (target.ingredients) {
    try {
      ingredients = typeof target.ingredients === 'string' ? JSON.parse(target.ingredients) : target.ingredients;
    } catch (e) {}
  } else if (target.raw_req_id) {
    ingredients = [{ id: target.raw_req_id, qty: target.req_qty_per_unit || 0 }];
  }

  if (!ingredients.length) return alert("No raw materials mapped to this master recipe.");

  let log = [];
  for (const ing of ingredients) {
    const rawId = ing.id;
    const qtyNeeded = (parseFloat(ing.qty) || 0) * batchQty;
    const { data: raw } = await db.from('raw_materials').select('stock, name, unit').eq('id', rawId).single();
    if (raw) {
      const curStock = parseFloat(raw.stock || 0);
      const newStock = Math.max(0, curStock - qtyNeeded);
      await db.from('raw_materials').update({ stock: newStock }).eq('id', rawId);
      log.push(`${raw.name}: ${curStock} -> ${newStock} ${raw.unit || ''} (-${qtyNeeded})`);
    }
  }

  alert(`Batch Production Successful!
Manufactured ${batchQty} units of ${target.name}.

Stock Deductions:
` + log.join('
'));
  loadAushadhiNirmanData();
}

// EXPOSE TO GLOBAL WINDOW SCOPE IMMEDIATELY
window.openMasterRecipeModal = openMasterRecipeModal;
window.closeMasterRecipeModal = closeMasterRecipeModal;
window.openRawMaterialModal = openRawMaterialModal;
window.closeRawMaterialModal = closeRawMaterialModal;
window.saveRawMaterial = saveRawMaterial;
window.editRawMaterial = editRawMaterial;
window.deleteRawMaterial = deleteRawMaterial;
window.addIngredientToRecipe = addIngredientToRecipe;
window.renderModalIngredientsTable = renderModalIngredientsTable;
window.saveMasterRecipe = saveMasterRecipe;
window.deleteMasterRecipe = deleteMasterRecipe;
window.executeBatchProduction = executeBatchProduction;
window.loadAushadhiNirmanData = loadAushadhiNirmanData;

// BIND HARD EVENT LISTENERS TO DOM BUTTONS
function bindNirmanButtonsDirectly() {
  const btns = Array.from(document.querySelectorAll('button'));
  
  btns.forEach(b => {
    const txt = (b.innerText || '').toLowerCase().trim();
    if (txt.includes('add raw material')) b.onclick = () => window.openRawMaterialModal(null);
    else if (txt.includes('add master recipe')) b.onclick = window.openMasterRecipeModal;
    else if (txt.includes('execute batch production')) b.onclick = window.executeBatchProduction;
    else if (txt.includes('add ingredient')) b.onclick = window.addIngredientToRecipe;
    else if (txt.includes('save raw material')) b.onclick = window.saveRawMaterial;
    else if (txt.includes('save master recipe')) b.onclick = window.saveMasterRecipe;
  });

  loadAushadhiNirmanData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNirmanButtonsDirectly);
} else {
  bindNirmanButtonsDirectly();
}
window.addEventListener('load', bindNirmanButtonsDirectly);
