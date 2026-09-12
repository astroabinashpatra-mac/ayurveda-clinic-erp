// --- MODULE 5: STRICT ID ARCHITECTURE ENGINE ---
window.currentRecipeIngredients = [];
window.availableRawMaterials = [];
window.availableMasterRecipes = [];

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

// 1. Modal Visibility Handlers
function openMasterRecipeModal() {
  const modal = el('modal-master-recipe') || document.querySelector('#modal-master-recipe');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    window.currentRecipeIngredients = [];
    renderRecipeIngredientsTable();
    syncRawMaterialsDropdown();
  } else {
    alert("Error: #modal-master-recipe container missing from index.html");
  }
}

function closeMasterRecipeModal() {
  const modal = el('modal-master-recipe') || document.querySelector('#modal-master-recipe');
  if (modal) modal.style.display = 'none';
}

function openRawMaterialModal() {
  const modal = el('modal-raw-material') || document.querySelector('#modal-raw-material');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
  }
}

function closeRawMaterialModal() {
  const modal = el('modal-raw-material') || document.querySelector('#modal-raw-material');
  if (modal) modal.style.display = 'none';
}

// 2. Fetch Data & Refresh Tables
async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db) return;

  try {
    const { data: rawData, error: rawErr } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (!rawErr && rawData) {
      window.availableRawMaterials = rawData;
      const rmTbody = el('rm-inventory-tbody') || document.querySelector('#module-aushadhi-nirman table tbody');
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
              <button style="background:#2563eb; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; margin-right:4px;">Edit</button>
              <button style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px;">Delete</button>
            </td>
          </tr>
        `).join('');
      }
      syncRawMaterialsDropdown();
    }

    const { data: recData, error: recErr } = await db.from('master_recipes').select('*, recipe_ingredients(*, raw_materials(*))');
    if (!recErr && recData) {
      window.availableMasterRecipes = recData;
      const recTbody = el('master-recipes-tbody') || document.querySelectorAll('#module-aushadhi-nirman table tbody')[1];
      if (recTbody) {
        recTbody.innerHTML = recData.map(r => {
          const ingList = (r.recipe_ingredients || []).map(i => `${i.raw_materials?.name || 'Item'} (${i.qty_required}${i.raw_materials?.unit || ''})`).join(', ') || 'No ingredients';
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 0.6rem; color: white;">${r.id}</td>
              <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.medicine_name}</td>
              <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
              <td style="padding: 0.6rem; color: #9ca3af;">${ingList}</td>
              <td style="padding: 0.6rem; text-align: center;">
                <button style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px;">Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch(e) { console.error("Data load exception:", e); }
}

function syncRawMaterialsDropdown() {
  const selectEl = el('recipe-rm-select') || document.querySelector('#modal-master-recipe select');
  if (!selectEl) return;
  const rawData = window.availableRawMaterials || [];
  selectEl.innerHTML = '<option value="">-- Select Raw Material --</option>' + 
    rawData.map(m => `<option value="${m.id}">${m.id} - ${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

// 3. Save Handlers
async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("Supabase client (sbClient) missing.");
  const name = el('rm-name')?.value.trim() || document.querySelector('#modal-raw-material input[type="text"]')?.value.trim();
  if (!name) return alert("Please enter Material Name.");

  const payload = {
    id: 'RAW-' + Date.now(),
    name: name,
    category: el('rm-category')?.value || 'Herbs',
    unit: el('rm-unit')?.value || 'kg',
    stock: parseFloat(el('rm-stock')?.value) || 0,
    reorder: parseFloat(el('rm-reorder')?.value) || 0,
    purchase_rate: parseFloat(el('rm-cost')?.value) || 0
  };

  const { error } = await db.from('raw_materials').insert([payload]);
  if (error) return alert("Save Raw Material Failed: " + error.message);

  alert("Raw Material saved successfully!");
  closeRawMaterialModal();
  loadAushadhiNirmanData();
}

function addIngredientToRecipe() {
  const selectEl = el('recipe-rm-select') || document.querySelector('#modal-master-recipe select');
  const qtyEl = el('recipe-qty-input') || document.querySelector('#modal-master-recipe input[type="number"]');

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
  const tbody = el('recipe-ingredients-tbody') || document.querySelector('#modal-master-recipe tbody');
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

  const medNameInput = el('recipe-med-name') || document.querySelector('#modal-master-recipe input[type="text"]:not([readonly])');
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

  const menu = recipes.map((r, i) => `${i + 1}. ${r.medicine_name} (${r.id})`).join('\n');
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

function bindNirmanEvents() {
  const addRecipeBtn = el('btn-add-master-recipe') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Add Master Recipe'));
  if (addRecipeBtn) addRecipeBtn.onclick = openMasterRecipeModal;

  const addRmBtn = el('btn-add-raw-material') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Add Raw Material'));
  if (addRmBtn) addRmBtn.onclick = openRawMaterialModal;

  const addIngBtn = el('btn-add-ingredient') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Add Ingredient'));
  if (addIngBtn) addIngBtn.onclick = addIngredientToRecipe;

  const saveRecBtn = el('btn-save-master-recipe') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Save Master Recipe'));
  if (saveRecBtn) saveRecBtn.onclick = saveMasterRecipe;

  const saveRmActionBtn = el('btn-save-raw-material') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Save Raw Material'));
  if (saveRmActionBtn) saveRmActionBtn.onclick = saveRawMaterial;

  const batchBtn = el('btn-execute-batch') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Execute Batch Production'));
  if (batchBtn) batchBtn.onclick = executeBatchProduction;

  loadAushadhiNirmanData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNirmanEvents);
} else {
  bindNirmanEvents();
}
