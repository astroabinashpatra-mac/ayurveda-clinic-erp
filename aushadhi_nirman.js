// --- MODULE 5: AUSHADHI NIRMAN ENGINE ---
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

function getRecipeModal() {
  const modalById = document.querySelector('#modal-master-recipe');
  if (modalById) return modalById;

  const containers = document.querySelectorAll('.modal, div[style*="fixed"]');
  for (let c of containers) {
    if (c.innerText && c.innerText.includes('Register Master Recipe')) return c;
  }
  return null;
}

function getRecipeSelectElement() {
  const modal = getRecipeModal();
  if (!modal) return document.getElementById('recipe-rm-select');

  const selects = modal.querySelectorAll('select');
  for (let s of selects) {
    const idStr = (s.id || '').toLowerCase();
    const classStr = (s.className || '').toLowerCase();
    if (!idStr.includes('theme') && !classStr.includes('theme')) {
      return s;
    }
  }
  return document.getElementById('recipe-rm-select');
}

function populateModalRawMaterialDropdown() {
  const selectEl = getRecipeSelectElement();
  if (!selectEl) return;

  const rawData = window.availableRawMaterials || [];
  selectEl.innerHTML = '<option value="">-- Select Raw Material --</option>' + 
    rawData.map(m => `<option value="${m.id}">${m.id} - ${m.name} (${m.stock} ${m.unit || 'kg'})</option>`).join('');
}

function openMasterRecipeModal() {
  const modal = getRecipeModal();
  if (modal) {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    window.currentRecipeIngredients = [];
    renderRecipeTable();
    populateModalRawMaterialDropdown();
  }
}

async function loadAushadhiNirmanData() {
  const db = getDb();
  if (!db) return;

  try {
    const { data: rawData } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    if (rawData) {
      window.availableRawMaterials = rawData;
      
      const rmTbody = document.querySelector('#module-aushadhi-nirman table tbody') || document.querySelector('table tbody');
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

      populateModalRawMaterialDropdown();
    }

    const { data: recData } = await db.from('master_recipes').select('*, recipe_ingredients(*, raw_materials(*))');
    if (recData) {
      window.availableMasterRecipes = recData;
      const recTbody = document.querySelectorAll('#module-aushadhi-nirman table tbody')[1] || document.querySelectorAll('table')[1]?.querySelector('tbody');
      if (recTbody) {
        recTbody.innerHTML = recData.map(r => {
          const ingList = (r.recipe_ingredients || []).map(i => `${i.raw_materials?.name || 'Item'} (${i.qty_required}${i.raw_materials?.unit || ''})`).join(', ') || 'No ingredients';
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 0.6rem; color: white;">${r.id}</td>
              <td style="padding: 0.6rem; color: white; font-weight: bold;">${r.medicine_name}</td>
              <td style="padding: 0.6rem; color: white;">${r.barcode || 'N/A'}</td>
              <td style="padding: 0.6rem; color: var(--text-muted);">${ingList}</td>
              <td style="padding: 0.6rem; text-align: center;">
                <button style="background:#dc2626; color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px;">Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch(e) { console.error("Data load error:", e); }
}

function addIngredientToRecipe() {
  const selectEl = getRecipeSelectElement();
  const modal = getRecipeModal() || document;
  const qtyEl = modal.querySelector('input[type="number"]');

  if (!selectEl || !selectEl.value) return alert("Please select a Raw Material from the dropdown.");
  const qty = parseFloat(qtyEl ? qtyEl.value : 0);
  if (isNaN(qty) || qty <= 0) return alert("Please enter a valid quantity (> 0).");

  const matId = selectEl.value;
  const matName = selectEl.options[selectEl.selectedIndex].text;

  const existing = window.currentRecipeIngredients.find(i => i.id === matId);
  if (existing) existing.qty += qty;
  else window.currentRecipeIngredients.push({ id: matId, name: matName, qty: qty });

  renderRecipeTable();
  if (qtyEl) qtyEl.value = '';
}

function renderRecipeTable() {
  const modal = getRecipeModal() || document;
  const tbody = modal.querySelector('tbody');
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
        <button type="button" onclick="window.currentRecipeIngredients.splice(${idx},1); renderRecipeTable();" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function saveMasterRecipe() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const modal = getRecipeModal() || document;
  const medNameEl = modal.querySelector('input[type="text"]:not([readonly])');
  const medName = medNameEl ? medNameEl.value.trim() : '';

  if (!medName) return alert("Please enter Output Medicine Name.");
  if (!window.currentRecipeIngredients.length) return alert("Please add at least 1 raw material ingredient.");

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
  renderRecipeTable();
  if (medNameEl) medNameEl.value = '';

  if (modal && modal.style) modal.style.display = 'none';
  loadAushadhiNirmanData();
}

async function saveRawMaterial() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const modal = document.querySelector('#modal-raw-material') || document.querySelector('.modal');
  const nameInp = document.getElementById('rm-name') || modal?.querySelector('input[type="text"]');
  const name = nameInp ? nameInp.value.trim() : '';
  if (!name) return alert("Please enter a Material Name.");

  const payload = {
    id: 'RAW-' + Date.now(),
    name: name,
    category: document.getElementById('rm-category')?.value || 'Herbs',
    unit: document.getElementById('rm-unit')?.value || 'kg',
    stock: parseFloat(document.getElementById('rm-stock')?.value) || 0,
    reorder: parseFloat(document.getElementById('rm-reorder')?.value) || 0,
    purchase_rate: parseFloat(document.getElementById('rm-cost')?.value) || 0
  };

  const { error } = await db.from('raw_materials').insert([payload]);
  if (error) return alert("Save Raw Material Failed: " + error.message);

  alert("Raw Material saved successfully!");
  if (modal) modal.style.display = 'none';
  loadAushadhiNirmanData();
}

async function executeBatchProduction() {
  const db = getDb();
  if (!db) return alert("sbClient missing.");

  const { data: recipes } = await db.from('master_recipes').select('*, recipe_ingredients(*, raw_materials(*))');
  if (!recipes || !recipes.length) return alert("No recipes found.");

  const menu = recipes.map((r, i) => `${i + 1}. ${r.medicine_name} (${r.id})`).join('
');
  const sel = prompt("Select Master Recipe Number for Batch Production:
" + menu);
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

  alert(`Batch Production Complete for ${units} units of ${target.medicine_name}!

Stock Deducted:
` + log.join('
'));
  loadAushadhiNirmanData();
}

function findBtnByText(txt) {
  for (let b of document.querySelectorAll('button')) {
    if (b.innerText && b.innerText.toLowerCase().includes(txt.toLowerCase())) return b;
  }
  return null;
}

function bindNirmanEventListeners() {
  const addRecipeBtn = findBtnByText('Add Master Recipe');
  if (addRecipeBtn) addRecipeBtn.onclick = openMasterRecipeModal;

  const addIngredientBtn = findBtnByText('Add Ingredient');
  if (addIngredientBtn) addIngredientBtn.onclick = addIngredientToRecipe;

  const saveRecipeBtn = findBtnByText('Save Master Recipe');
  if (saveRecipeBtn) saveRecipeBtn.onclick = saveMasterRecipe;

  const saveRmBtn = findBtnByText('Save Raw Material');
  if (saveRmBtn) saveRmBtn.onclick = saveRawMaterial;

  const batchBtn = findBtnByText('Execute Batch Production');
  if (batchBtn) batchBtn.onclick = executeBatchProduction;

  loadAushadhiNirmanData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindNirmanEventListeners);
} else {
  bindNirmanEventListeners();
}
