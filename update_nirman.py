with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Master Recipe Modal HTML to support Auto-Barcode and Multi-Ingredients Builder
old_recipe_modal = '''  <!-- MODAL: ADD/EDIT MASTER RECIPE -->
  <div id="md-recipe" class="modal-overlay">
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-header">
        <h3 id="title-recipe">+ Register Master Recipe</h3>
        <button class="modal-close" onclick="closeModal(\'md-recipe\')">✕</button>
      </div>
      <form onsubmit="saveMasterRecipe(event)">
        <input type="hidden" id="rc-id" />
        <div class="form-group" style="margin-bottom:0.75rem;">
          <label>OUTPUT MEDICINE NAME *</label>
          <input type="text" id="rc-name" class="form-control" placeholder="e.g. Mahanarayana Thailam (500ml)" required />
        </div>
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group">
            <label>BARCODE *</label>
            <input type="text" id="rc-barcode" class="form-control" placeholder="e.g. 8901001" required />
          </div>
          <div class="form-group">
            <label>PRIMARY RAW INGREDIENT *</label>
            <select id="rc-raw-req-id" class="form-control" required></select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:1.25rem;">
          <label>REQUIRED INGREDIENT QTY PER UNIT *</label>
          <input type="number" step="0.01" id="rc-qty-per-unit" class="form-control" placeholder="e.g. 0.5" required />
        </div>
        <button type="submit" class="btn btn-orange" style="width:100%; justify-content:center;">Save Recipe</button>
      </form>
    </div>
  </div>'''

new_recipe_modal = '''  <!-- MODAL: ADD/EDIT MASTER RECIPE (MULTI-INGREDIENT & AUTO BARCODE) -->
  <div id="md-recipe" class="modal-overlay">
    <div class="modal-container" style="max-width: 680px;">
      <div class="modal-header">
        <h3 id="title-recipe">+ Register Master Recipe</h3>
        <button class="modal-close" onclick="closeModal('md-recipe')">✕</button>
      </div>
      <form onsubmit="saveMasterRecipe(event)">
        <input type="hidden" id="rc-id" />
        <div class="form-grid grid-2" style="margin-bottom:0.75rem;">
          <div class="form-group">
            <label>OUTPUT MEDICINE NAME *</label>
            <input type="text" id="rc-name" class="form-control" placeholder="e.g. Mahanarayana Thailam (500ml)" required />
          </div>
          <div class="form-group">
            <label>BARCODE (AUTO-GENERATED) *</label>
            <div style="display:flex; gap:0.4rem;">
              <input type="text" id="rc-barcode" class="form-control" readonly style="font-weight:bold; background:var(--bg-dark);" required />
              <button type="button" class="btn btn-secondary" onclick="generateAutoBarcode()">🔄</button>
            </div>
          </div>
        </div>

        <div style="background:var(--bg-dark); border:1px solid var(--border-dark); padding:0.85rem; border-radius:8px; margin-bottom:1.25rem;">
          <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.5rem;">🌿 ADD RAW INGREDIENTS (MULTIPLE)</span>
          <div class="form-grid grid-3" style="align-items:end;">
            <div class="form-group">
              <label>RAW MATERIAL *</label>
              <select id="rc-add-raw-id" class="form-control"></select>
            </div>
            <div class="form-group">
              <label>QTY PER UNIT *</label>
              <input type="number" step="0.001" id="rc-add-qty" class="form-control" placeholder="e.g. 0.25" />
            </div>
            <button type="button" class="btn btn-orange" onclick="addRecipeIngredientRow()">+ Add Ingredient</button>
          </div>

          <table class="data-table" style="margin-top:0.75rem;">
            <thead>
              <tr>
                <th>Raw Material</th>
                <th>Qty Required (per unit)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="tbl-rc-ingredients"></tbody>
          </table>
        </div>

        <button type="submit" class="btn btn-orange" style="width:100%; justify-content:center; font-size:0.9rem;">Save Master Recipe</button>
      </form>
    </div>
  </div>'''

if old_recipe_modal in html:
    html = html.replace(old_recipe_modal, new_recipe_modal)

# 2. Add JavaScript Functions for Multi-Ingredient Builder, Auto Barcode, and Inventory Transfer
js_fixes = '''    let currentRecipeIngredients = [];

    function generateAutoBarcode() {
      const code = '890' + Math.floor(10000000 + Math.random() * 90000000);
      document.getElementById('rc-barcode').value = code;
    }

    function openRecipeModal() {
      document.getElementById('rc-id').value = '';
      document.getElementById('rc-name').value = '';
      generateAutoBarcode();
      currentRecipeIngredients = [];

      const sel = document.getElementById('rc-add-raw-id');
      if (sel) {
        sel.innerHTML = db.rawMaterials.map(r => `<option value="${r.id}">${r.id} - ${r.name} (${r.unit})</option>`).join('');
      }

      document.getElementById('title-recipe').innerText = '+ Register Master Recipe';
      renderRecipeIngredientsTable();
      openModal('md-recipe');
    }

    function addRecipeIngredientRow() {
      const rawId = document.getElementById('rc-add-raw-id').value;
      const qty = Number(document.getElementById('rc-add-qty').value) || 0;
      const raw = db.rawMaterials.find(r => r.id === rawId);

      if (!raw) return alert('Select raw material');
      if (qty <= 0) return alert('Enter valid quantity per unit');

      const existingIdx = currentRecipeIngredients.findIndex(i => i.raw_id === rawId);
      if (existingIdx !== -1) {
        currentRecipeIngredients[existingIdx].qty_per_unit = qty;
      } else {
        currentRecipeIngredients.push({ raw_id: raw.id, raw_name: raw.name, unit: raw.unit, qty_per_unit: qty });
      }

      document.getElementById('rc-add-qty').value = '';
      renderRecipeIngredientsTable();
    }

    function removeRecipeIngredient(idx) {
      currentRecipeIngredients.splice(idx, 1);
      renderRecipeIngredientsTable();
    }

    function renderRecipeIngredientsTable() {
      const tbl = document.getElementById('tbl-rc-ingredients');
      if (!tbl) return;

      tbl.innerHTML = currentRecipeIngredients.map((item, idx) => `
        <tr>
          <td><b>${item.raw_id} - ${item.raw_name}</b></td>
          <td><b>${item.qty_per_unit} ${item.unit}</b></td>
          <td><button type="button" class="btn btn-danger" style="padding:2px 6px; font-size:0.75rem;" onclick="removeRecipeIngredient(${idx})">✕</button></td>
        </tr>
      `).join('') || '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No ingredients added yet. Select and click "+ Add Ingredient".</td></tr>';
    }

    function editMasterRecipe(id) {
      const rc = db.recipes.find(r => r.id === id); if (!rc) return;
      document.getElementById('rc-id').value = rc.id;
      document.getElementById('rc-name').value = rc.name;
      document.getElementById('rc-barcode').value = rc.barcode || ('890' + Math.floor(10000000 + Math.random() * 90000000));

      try {
        currentRecipeIngredients = typeof rc.ingredients === 'string' ? JSON.parse(rc.ingredients) : (rc.ingredients || []);
      } catch(e) {
        currentRecipeIngredients = [];
      }

      if (currentRecipeIngredients.length === 0 && rc.raw_req_id) {
        const raw = db.rawMaterials.find(r => r.id === rc.raw_req_id);
        currentRecipeIngredients.push({
          raw_id: rc.raw_req_id,
          raw_name: raw ? raw.name : rc.raw_req_id,
          unit: raw ? raw.unit : 'unit',
          qty_per_unit: Number(rc.req_qty_per_unit) || 0.5
        });
      }

      const sel = document.getElementById('rc-add-raw-id');
      if (sel) {
        sel.innerHTML = db.rawMaterials.map(r => `<option value="${r.id}">${r.id} - ${r.name} (${r.unit})</option>`).join('');
      }

      document.getElementById('title-recipe').innerText = '✏️ Edit Master Recipe';
      renderRecipeIngredientsTable();
      openModal('md-recipe');
    }

    async function saveMasterRecipe(e) {
      e.preventDefault();
      if (currentRecipeIngredients.length === 0) {
        return alert('Please add at least 1 raw material ingredient to this recipe.');
      }

      const id = document.getElementById('rc-id').value;
      const payload = {
        name: document.getElementById('rc-name').value,
        barcode: document.getElementById('rc-barcode').value,
        ingredients: JSON.stringify(currentRecipeIngredients),
        raw_req_id: currentRecipeIngredients[0].raw_id,
        req_qty_per_unit: currentRecipeIngredients[0].qty_per_unit
      };

      if (!id) payload.id = 'REC-0' + (db.recipes.length + 1);

      if (sbClient) {
        if (id) await sbClient.from('master_recipes').update(payload).eq('id', id);
        else await sbClient.from('master_recipes').insert([payload]);
      } else {
        if (id) {
          const idx = db.recipes.findIndex(r => r.id === id);
          if (idx !== -1) db.recipes[idx] = { id, ...payload };
        } else {
          db.recipes.push({ id: payload.id, ...payload });
        }
      }

      alert('Master Recipe Saved Successfully with Multiple Raw Ingredients!');
      closeModal('md-recipe');
      init();
    }

    async function runProductionEngine(e) {
      e.preventDefault();
      const recipeId = document.getElementById('bp-recipe-id').value;
      const recipe = db.recipes.find(r => r.id === recipeId); if (!recipe) return alert('Select recipe');

      const units = Number(document.getElementById('bp-units').value) || 0;
      const batchCode = document.getElementById('bp-batch-code').value;
      const expiry = document.getElementById('bp-expiry').value;
      const price = Number(document.getElementById('bp-price').value) || 0;

      let ingredientsList = [];
      try {
        ingredientsList = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : (recipe.ingredients || []);
      } catch(e) { ingredientsList = []; }

      if (ingredientsList.length === 0 && recipe.raw_req_id) {
        ingredientsList.push({ raw_id: recipe.raw_req_id, qty_per_unit: recipe.req_qty_per_unit });
      }

      // 1. Verify all raw materials stock sufficiency
      for (let ing of ingredientsList) {
        const raw = db.rawMaterials.find(x => x.id === ing.raw_id);
        const requiredTotal = Number(ing.qty_per_unit) * units;
        if (!raw || Number(raw.stock) < requiredTotal) {
          const availableStr = raw ? `${raw.stock}${raw.unit}` : '0';
          return alert(`Insufficient Stock for Raw Material: ${ing.raw_name || ing.raw_id}!\nRequired: ${requiredTotal}, Available: ${availableStr}`);
        }
      }

      // 2. Deduct all consumed raw materials from inventory
      for (let ing of ingredientsList) {
        const raw = db.rawMaterials.find(x => x.id === ing.raw_id);
        if (raw) {
          raw.stock = Math.max(0, Number(raw.stock) - (Number(ing.qty_per_unit) * units));
          if (sbClient) {
            await sbClient.from('raw_materials').update({ stock: raw.stock }).eq('id', raw.id);
          }
        }
      }

      // 3. Auto-transfer produced medicine directly into Herbal Pharmacy Stock database
      const phPayload = {
        barcode: recipe.barcode,
        name: recipe.name,
        batch_code: batchCode,
        expiry: expiry,
        price: price,
        stock: units
      };

      if (sbClient) {
        const { data: existing } = await sbClient.from('pharmacy_stock').select('*').eq('barcode', recipe.barcode).eq('batch_code', batchCode);
        if (existing && existing.length > 0) {
          const newStock = Number(existing[0].stock || 0) + units;
          await sbClient.from('pharmacy_stock').update({ stock: newStock, price: price }).eq('id', existing[0].id);
        } else {
          await sbClient.from('pharmacy_stock').insert([phPayload]);
        }
      } else {
        const existingMed = db.pharmacy.find(p => p.barcode === recipe.barcode && p.batch_code === batchCode);
        if (existingMed) { existingMed.stock += units; existingMed.price = price; }
        else { db.pharmacy.unshift(phPayload); }
      }

      alert(`✅ Production Batch Executed Successfully!\n• Consumed Raw Materials auto-deducted from Inventory.\n• ${units} units of ${recipe.name} transferred directly to Herbal Pharmacy Stock.`);
      closeModal('md-batch-prod');
      init();
    }'''

# Replace old functions with fixed multi-ingredient logic
if 'function openRecipeModal()' in html:
    start_pos = html.find('function openRecipeModal()')
    end_pos = html.find('function renderPharmacy()')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + js_fixes + '\n\n    ' + html[end_pos:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Master Recipe multi-ingredients, auto-barcode, raw material deduction, and pharmacy stock transfer updated successfully.")
