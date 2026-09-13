with open("aushadhi_nirman.js", "w", encoding="utf-8") as f:
    f.write('''/**
 * MODULE 5: DEDICATED ENGINE (SAFE PARSING & HARD BINDINGS)
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

// 1. DYNAMIC MODAL INJECTOR
function ensureModalsExist() {
  if (!el('modal-master-recipe')) {
    const m = document.createElement('div');
    m.id = 'modal-master-recipe';
    m.className = 'modal';
    m.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 99999;';
    m.innerHTML = `
      <div style="background: #1e293b; width: 560px; padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); color: white;">
        <h3 style="margin-top: 0;">+ Register Master Recipe</h3>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Output Medicine Name *</label>
          <input type="text" id="input-recipe-name" placeholder="e.g. Mahanarayani Tailam" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
        </div>
        <div style="background: rgba(15, 23, 42, 0.8); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
          <h4 style="margin-top: 0; margin-bottom: 0.8rem; color: #ea580c;">Add Raw Ingredients (BOM)</h4>
          <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.5rem; align-items: center; margin-bottom: 0.8rem;">
            <select id="select-recipe-raw-material" style="padding: 0.5rem; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 4px;"></select>
            <input type="number" id="input-recipe-qty" placeholder="Qty/unit" style="padding: 0.5rem; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 4px;">
            <button type="button" onclick="addIngredientToRecipe()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 0.8rem; border-radius: 4px; cursor: pointer; font-weight: bold;">+ Add Ingredient</button>
          </div>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.2); color: #9ca3af;">
                <th style="padding: 0.4rem;">Raw Material</th>
                <th style="padding: 0.4rem;">Qty Required (per unit)</th>
                <th style="padding: 0.4rem; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody id="tbody-modal-ingredients"></tbody>
          </table>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="closeMasterRecipeModal()" style="background: #475569; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button type="button" onclick="saveMasterRecipe()" style="background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Master Recipe</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
  }

  if (!el('modal-raw-material')) {
    const rm = document.createElement('div');
    rm.id = 'modal-raw-material';
    rm.className = 'modal';
    rm.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 99999;';
    rm.innerHTML = `
      <div style="background: #1e293b; width: 480px; padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); color: white;">
        <h3 style="margin-top: 0;">Raw Material Record</h3>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Material Name *</label>
          <input type="text" id="input-rm-name" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Category</label>
            <select id="select-rm-category" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
              <option value="Herbs">Herbs</option>
              <option value="Base Oil/Ghee">Base Oil/Ghee</option>
              <option value="Bhasma & Minerals">Bhasma & Minerals</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Unit</label>
            <select id="select-rm-unit" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="g">g</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Stock</label>
            <input type="number" id="input-rm-stock" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Reorder</label>
            <input type="number" id="input-rm-reorder" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cost/Unit</label>
            <input type="number" id="input-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" onclick="closeRawMaterialModal()" style="background: #475569; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button type="button" onclick="saveRawMaterial()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Raw Material</button>
        </div>
      </div>
    `;
    document.body.appendChild(rm);
  }
}

// 2. MODAL CONTROLLERS
function openMasterRecipeModal() {
  ensureModalsExist();
  const modal = el('modal-master-recipe');
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
  ensureModalsExist();
  const modal = el('modal-raw-material');
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

// 3. DATA FETCHING & UI RENDER
async function loadAushadhiNirmanData() {
  ensureModalsExist();
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
    console.error("Aushadhi Nirman load error:", err);
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
        <button type="button" onclick="editRawMaterial('${item.id}')" style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; margin-right:4px; cursor:pointer;">Edit</button>
        <button type="button" onclick="deleteRawMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderMasterRecipesTable(data) {
  const tbody = el('tbody-master-recipes') || document.querySelectorAll('#module-aushadhi-nirman table tbody')[1] || document.querySelectorAll('table')[1]?.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = data.map(r => {
    let ingText = 'No ingredients';
    if (r.ingredients) {
      try {
        const parsed = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
        if (Array.isArray(parsed) && parsed.length > 0) {
          ingText = parsed.map(i => `${i.name || i.id} (${i.qty})`).join(', ');
        }
      } catch (e) {
        ingText = String(r.ingredients);
      }
    } else if (r.raw_req_id) {
      ingText = `${r.raw_req_id} (${r.req_qty_per_unit || 1})`;
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

// 4. ACTION HANDLERS
async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("Database client unavailable.");

  const name = el('input-rm-name')?.value.trim();
  if (!name) return alert("Material Name is required.");

  const payload = {
    name: name,
    category: el('select-rm-category')?.value || 'Herbs',
    unit: el('select-rm-unit')?.value || 'kg',
    stock: parseFloat(el('input-rm-stock')?.value || 0),
    reorder: parseFloat(el('input-rm-reorder')?.value || 0),
    purchase_rate: parseFloat(el('input-rm-cost')?.value || 0)
  };

  if (window.nirmanState.editingRmId) {
    const { error } = await db.from('raw_materials').update(payload).eq('id', window.nirmanState.editingRmId);
    if (error) return alert("Update failed: " + error.message);
  } else {
    payload.id = 'RAW-' + Date.now();
    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Save failed: " + error.message);
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
  const select = el('select-recipe-raw-material');
  const qtyInp = el('input-recipe-qty');

  if (!select || !select.value) return alert("Select a Raw Material first.");
  const qty = parseFloat(qtyInp ? qtyInp.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Quantity per unit must be > 0.");

  const matId = select.value;
  const matName = select.options[select.selectedIndex].text;

  const existing = window.nirmanState.currentIngredients.find(i => i.id === matId);
  if (existing) existing.qty += qty;
  else window.nirmanState.currentIngredients.push({ id: matId, name: matName, qty: qty });

  renderModalIngredientsTable();
  if (qtyInp) qtyInp.value = '';
}

function renderModalIngredientsTable() {
  const tbody = el('tbody-modal-ingredients');
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

  const medicineName = el('input-recipe-name')?.value.trim();
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

  const menu = recipes.map((r, i) => `${i + 1}. ${r.name || r.medicine_name || r.id}`).join('\n');
  const sel = prompt("Select Master Recipe Number for Batch Production:\n" + menu);
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

  alert(`Batch Production Successful!\nManufactured ${batchQty} units of ${target.name}.\n\nStock Deductions:\n` + log.join('\n'));
  loadAushadhiNirmanData();
}

// Global Exposures
window.openMasterRecipeModal = openMasterRecipeModal;
window.closeMasterRecipeModal = closeMasterRecipeModal;
window.openRawMaterialModal = openRawMaterialModal;
window.closeRawMaterialModal = closeRawMaterialModal;
window.saveRawMaterial = saveRawMaterial;
window.editRawMaterial = editRawMaterial;
window.deleteRawMaterial = deleteRawMaterial;
window.addIngredientToRecipe = addIngredientToRecipe;
window.saveMasterRecipe = saveMasterRecipe;
window.deleteMasterRecipe = deleteMasterRecipe;
window.executeBatchProduction = executeBatchProduction;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAushadhiNirmanData);
} else {
  loadAushadhiNirmanData();
}
window.addEventListener('load', loadAushadhiNirmanData);
''')

git add aushadhi_nirman.js
git commit -m "Fix UI sync for null ingredient columns and bind explicit modal openers"
git push origin main
import subprocess

# Python multiline string
script = """
print("Clean multiline string execution")
"""
