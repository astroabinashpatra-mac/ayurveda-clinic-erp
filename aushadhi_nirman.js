// --- MODULE 5: FULL CRUD & ROBUST MODAL ENGINE ---
window.currentRecipeIngredients = [];
window.availableRawMaterials = [];
window.availableMasterRecipes = [];
window.editingRawMaterialId = null;

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

// Robust Modal Locators (ID lookup with text-content fallback)
function getRecipeModal() {
  const modal = el('modal-master-recipe');
  if (modal) return modal;
  for (let div of document.querySelectorAll('div')) {
    if (div.innerText && div.innerText.includes('Register Master Recipe') && div.innerText.includes('ADD RAW INGREDIENTS')) {
      div.id = 'modal-master-recipe';
      return div;
    }
  }
  return null;
}

function getRawMaterialModal() {
  const modal = el('modal-raw-material');
  if (modal) return modal;
  for (let div of document.querySelectorAll('div')) {
    if (div.innerText && div.innerText.includes('Raw Material Record') && div.innerText.includes('MATERIAL NAME')) {
      div.id = 'modal-raw-material';
      return div;
    }
  }
  return null;
}

// 1. Modal Display Handlers
function openMasterRecipeModal() {
  const modal = getRecipeModal();
  if (modal) {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    window.currentRecipeIngredients = [];
    renderRecipeIngredientsTable();
    syncRawMaterialsDropdown();
  } else {
    alert("Master Recipe modal container could not be found.");
  }
}

function closeMasterRecipeModal() {
  const modal = getRecipeModal();
  if (modal) modal.style.display = 'none';
}

function openRawMaterialModal(editItem = null) {
  const modal = getRawMaterialModal();
  if (!modal) return alert("Raw Material modal container missing.");

  window.editingRawMaterialId = editItem ? editItem.id : null;
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';

  // Populate fields if editing
  const nameInp = el('rm-name') || modal.querySelector('input[type="text"]');
  const catInp = el('rm-category') || modal.querySelectorAll('select')[0];
  const unitInp = el('rm-unit') || modal.querySelectorAll('select')[1];
  const numInputs = modal.querySelectorAll('input[type="number"]');

  if (nameInp) nameInp.value = editItem ? editItem.name : '';
  if (catInp && editItem) catInp.value = editItem.category || 'Herbs';
  if (unitInp && editItem) unitInp.value = editItem.unit || 'kg';
  if (numInputs[0]) numInputs[0].value = editItem ? editItem.stock : '';
  if (numInputs[1]) numInputs[1].value = editItem ? editItem.reorder : '';
  if (numInputs[2]) numInputs[2].value = editItem ? (editItem.purchase_rate || '') : '';
}

function closeRawMaterialModal() {
  const modal = getRawMaterialModal();
  if (modal) modal.style.display = 'none';
  window.editingRawMaterialId = null;
}

// 2. Data Fetching & Table Rendering
async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db) return;

  try {
    const { data: rawData, error: rawErr } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (!rawErr && rawData) {
      window.availableRawMaterials = rawData;
      const rmTbody = el('rm-inventory-tbody') || document.querySelector('#module-aushadhi-nirman table tbody') || document.querySelector('table tbody');
      if (rmTbody) {
        rmTbody.innerHTML = rawData.map(item => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 0.6rem; color: white;">${item.id}</td>
            <td style="padding: 0.6rem; color: white; font-weight: bold;">${item.name}</td>
            <td style="padding: 0.6rem; color: white;">${item.category || 'Herbs'}</td>
            <td style="padding: 0.6rem; color: white;">${parseFloat(item.stock || 0).toFixed(2)} ${item.unit || 'kg'}</td>
            <td style="padding: 0.6rem; color: white;">${item.reorder || 0} ${item.unit || 'kg'}</td>
            <td style="padding: 0.6rem;"><span style="color:#10b981; font-weight:bold;">SUFFICIENT</span></td>
            <td style="padding: 0.6rem; text-align: center;">
              <button onclick="editRawMaterial('${item.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
              <button onclick="deleteRawMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
            </td>
          </tr>
        `).join('');
      }
      syncRawMaterialsDropdown();
    }

    const { data: recData, error: recErr } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    if (!recErr && recData) {
      window.availableMasterRecipes = recData;
      const recTbody = el('master-recipes-tbody') || document.querySelectorAll('#module-aushadhi-nirman table tbody')[1] || document.querySelectorAll('table')[1]?.querySelector('tbody');
      if (recTbody) {
        recTbody.innerHTML = recData.map(r => {
          let ingList = 'No ingredients';
          if (r.ingredients) {
            try {
              const parsed = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
              if (Array.isArray(parsed)) {
                ingList = parsed.map(i => `${i.name || i.id} (${i.qty})`).join(', ');
              }
            } catch(e) { ingList = r.ingredients; }
          } else if (r.raw_req_id) {
            ingList = `${r.raw_req_id} (${r.req_qty_per_unit})`;
          }
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 0.6rem; color: white;">${r.id}</td>
              <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.medicine_name || r.name || r.recipe_name || 'Unnamed Recipe'}</td>
              <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
              <td style="padding: 0.6rem; color: #9ca3af;">${ingList}</td>
              <td style="padding: 0.6rem; text-align: center;">
                <button onclick="deleteMasterRecipe('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch(e) { console.error("Data load exception:", e); }
}

function syncRawMaterialsDropdown() {
  const modal = getRecipeModal();
  const selectEl = el('recipe-rm-select') || (modal ? modal.querySelector('select') : null);
  if (!selectEl) return;

  const rawData = window.availableRawMaterials || [];
  selectEl.innerHTML = '<option value="">-- Select Raw Material --</option>' + 
    rawData.map(m => `<option value="${m.id}">${m.id} - ${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

// 3. Raw Material Save/Update & Delete Handlers
async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("Supabase client (sbClient) missing.");

  const modal = getRawMaterialModal();
  const nameInp = el('rm-name') || modal?.querySelector('input[type="text"]');
  const name = nameInp ? nameInp.value.trim() : '';
  if (!name) return alert("Please enter Material Name.");

  const numInputs = modal ? modal.querySelectorAll('input[type="number"]') : [];
  const stock = parseFloat(el('rm-stock')?.value || numInputs[0]?.value || 0);
  const reorder = parseFloat(el('rm-reorder')?.value || numInputs[1]?.value || 0);
  const cost = parseFloat(el('rm-cost')?.value || numInputs[2]?.value || 0);

  const payload = {
    name: name,
    category: el('rm-category')?.value || modal?.querySelectorAll('select')[0]?.value || 'Herbs',
    unit: el('rm-unit')?.value || modal?.querySelectorAll('select')[1]?.value || 'kg',
    stock: isNaN(stock) ? 0 : stock,
    reorder: isNaN(reorder) ? 0 : reorder,
    purchase_rate: isNaN(cost) ? 0 : cost
  };

  if (window.editingRawMaterialId) {
    const { error } = await db.from('raw_materials').update(payload).eq('id', window.editingRawMaterialId);
    if (error) return alert("Update Failed: " + error.message);
    alert("Raw Material updated successfully!");
  } else {
    payload.id = 'RAW-' + Date.now();
    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Save Failed: " + error.message);
    alert("Raw Material saved successfully!");
  }

  closeRawMaterialModal();
  loadAushadhiNirmanData();
}

function editRawMaterial(id) {
  const item = (window.availableRawMaterials || []).find(r => r.id === id);
  if (item) openRawMaterialModal(item);
}

async function deleteRawMaterial(id) {
  if (!confirm(`Delete raw material ${id}?`)) return;
  const db = getDb();
  const { error } = await db.from('raw_materials').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

async function deleteMasterRecipe(id) {
  if (!confirm(`Delete master recipe ${id}?`)) return;
  const db = getDb();
  const { error } = await db.from('master_recipes').delete().eq('id', id);
  if (error) return alert("Delete failed: " + error.message);
  loadAushadhiNirmanData();
}

// 4. Modal Ingredient & Recipe Save Handlers
function addIngredientToRecipe() {
  const modal = getRecipeModal();
  const selectEl = el('recipe-rm-select') || modal?.querySelector('select');
  const qtyEl = el('recipe-qty-input') || modal?.querySelector('input[type="number"]');

  if (!selectEl || !selectEl.value) return alert("Select a Raw Material first.");
  const qty = parseFloat(qtyEl ? qtyEl.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Enter a valid quantity per unit (> 0).");

  const matId = selectEl.value;
  const matName = selectEl.options[selectEl.selectedIndex].text;

  const existing = window.currentRecipeIngredients.find(i => i.id === matId);
  if (existing) existing.qty += qty;
  else window.currentRecipeIngredients.push({ id: matId, name: matName, qty: qty });

  renderRecipeIngredientsTable();
  if (qtyEl) qtyEl.value = '';
}

function renderRecipeIngredientsTable() {
  const modal = getRecipeModal();
  const tbody = el('recipe-ingredients-tbody') || modal?.querySelector('tbody');
  if (!tbody) return;

  if (window.currentRecipeIngredients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#9ca3af; padding:0.8rem;">No ingredients added.</td></tr>';
    return;
  }

  tbody.innerHTML = window.currentRecipeIngredients.map((item, idx) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding:0.5rem; color:white;">${item.name}</td>
      <td style="padding:0.5rem; color:white; font-weight:bold;">${item.qty}</td>
      <td style="padding:0.5rem; text-align:center;">
        <button type="button" onclick="window.currentRecipeIngredients.splice(${idx},1); renderRecipeIngredientsTable();" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function saveMasterRecipe() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const modal = getRecipeModal();
  const medNameInput = el('recipe-med-name') || modal?.querySelector('input[type="text"]:not([readonly])');
  const medName = medNameInput ? medNameInput.value.trim() : '';

  if (!medName) return alert("Please enter Output Medicine Name.");
  if (!window.currentRecipeIngredients.length) return alert("Add at least 1 raw material ingredient.");

  const recipeId = 'REC-' + Date.now().toString().slice(-6);
  const barcodeVal = 'BC-' + Math.floor(100000 + Math.random() * 900000);
  const firstIng = window.currentRecipeIngredients[0];

  const payload = {
    id: recipeId,
    name: medName,
    barcode: barcodeVal,
    raw_req_id: firstIng ? firstIng.id : null,
    req_qty_per_unit: firstIng ? firstIng.qty : 0,
    ingredients: JSON.stringify(window.currentRecipeIngredients)
  };

  const { data: recipe, error: rErr } = await db.from('master_recipes').insert([payload]).select().single();

  if (rErr) return alert("Master Recipe Save Failed: " + rErr.message);

  alert("Master Recipe & BOM saved successfully!");
  window.currentRecipeIngredients = [];
  renderRecipeIngredientsTable();
  if (medNameInput) medNameInput.value = '';

  closeMasterRecipeModal();
  loadAushadhiNirmanData();
}

async function _deprecated_saveMasterRecipe() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const modal = getRecipeModal();
  const medNameInput = el('recipe-med-name') || modal?.querySelector('input[type="text"]:not([readonly])');
  const medName = medNameInput ? medNameInput.value.trim() : '';

  if (!medName) return alert("Please enter Output Medicine Name.");
  if (!window.currentRecipeIngredients.length) return alert("Add at least 1 raw material ingredient.");

  const recipeId = 'REC-' + Date.now().toString().slice(-6);
  const barcodeVal = 'BC-' + Math.floor(100000 + Math.random() * 900000);

  const { data: recipe, error: rErr } = await db.from('master_recipes').insert([{
    id: recipeId, medicine_name: medName, barcode: barcodeVal, standard_yield: 1
  }]).select().single();

  if (rErr) return alert("Recipe Header Save Failed: " + rErr.message);

  const rows = window.currentRecipeIngredients.map(item => ({
    recipe_id: recipe.id, raw_material_id: item.id, qty_required: item.qty
  }));

  const { error: iErr } = await db.from('recipe_ingredients').insert(rows);
  if (iErr) return alert("Ingredients Save Failed: " + iErr.message);

  alert("Master Recipe & BOM saved successfully!");
  window.currentRecipeIngredients = [];
  renderRecipeIngredientsTable();
  if (medNameInput) medNameInput.value = '';

  closeMasterRecipeModal();
  loadAushadhiNirmanData();
}

async function executeBatchProduction() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const { data: recipes } = await db.from('master_recipes').select('*, recipe_ingredients(*, raw_materials(*))');
  if (!recipes || !recipes.length) return alert("No recipes found.");

  const menu = recipes.map((r, i) => `${i + 1}. ${r.medicine_name || r.name || r.recipe_name || 'Unnamed Recipe'} (${r.id})`).join('\n');
  const sel = prompt("Select Master Recipe Number for Batch Production:\n" + menu);
  if (!sel) return;

  const target = recipes[parseInt(sel) - 1];
  if (!target) return alert("Invalid selection.");

  const units = parseFloat(prompt(`Enter production units for '${target.medicine_name}':`, "10"));
  if (!units || units <= 0) return alert("Invalid production quantity.");

  const ingredients = target.recipe_ingredients || [];
  if (!ingredients.length) return alert("No ingredients mapped to this recipe.");

  let log = [];
  for (const ing of ingredients) {
    const rawId = ing.raw_material_id;
    const required = parseFloat(ing.qty_required || 0) * units;

    const { data: raw } = await db.from('raw_materials').select('stock, name, unit').eq('id', rawId).single();
    if (raw) {
      const curStock = parseFloat(raw.stock || 0);
      const newStock = Math.max(0, curStock - required);
      await db.from('raw_materials').update({ stock: newStock }).eq('id', rawId);
      log.push(`${raw.name}: ${curStock} -> ${newStock} ${raw.unit || ''} (-${required})`);
    }
  }

  alert(`Batch Production Complete for ${units} units of ${target.medicine_name}!\n\nStock Deducted:\n` + log.join('\n'));
  loadAushadhiNirmanData();
}

// 5. Button Event Binding
function bindNirmanEvents() {
  const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.toLowerCase().includes(txt.toLowerCase()));

  const addRecipeBtn = el('btn-add-master-recipe') || findBtn('Add Master Recipe');
  if (addRecipeBtn) addRecipeBtn.onclick = openMasterRecipeModal;

  const addRmBtn = el('btn-add-raw-material') || findBtn('Add Raw Material');
  if (addRmBtn) addRmBtn.onclick = () => openRawMaterialModal(null);

  const addIngBtn = el('btn-add-ingredient') || findBtn('Add Ingredient');
  if (addIngBtn) addIngBtn.onclick = addIngredientToRecipe;

  const saveRecBtn = el('btn-save-master-recipe') || findBtn('Save Master Recipe');
  if (saveRecBtn) saveRecBtn.onclick = saveMasterRecipe;

  const saveRmActionBtn = el('btn-save-raw-material') || findBtn('Save Raw Material');
  if (saveRmActionBtn) saveRmActionBtn.onclick = saveRawMaterial;

  const batchBtn = el('btn-execute-batch') || findBtn('Execute Batch Production');
  if (batchBtn) batchBtn.onclick = executeBatchProduction;

  loadAushadhiNirmanData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNirmanEvents);
} else {
  bindNirmanEvents();
}

window.openRawMaterialModal = openRawMaterialModal;
window.openMasterRecipeModal = openMasterRecipeModal;
