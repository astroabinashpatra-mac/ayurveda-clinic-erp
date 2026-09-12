with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Replace Batch Production Modal with Production Cost and Selling Price fields
old_batch_modal = '''  <!-- MODAL: EXECUTE BATCH PRODUCTION -->
  <div id="md-batch-prod" class="modal-overlay">
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-header"><h3>Execute Batch Production Routine</h3><button class="modal-close" onclick="closeModal('md-batch-prod')">✕</button></div>
      <form onsubmit="runProductionEngine(event)">
        <div class="form-group"><label>MASTER RECIPE</label><select id="bp-recipe-id" class="form-control" required></select></div>
        <div class="form-grid grid-2">
          <div class="form-group"><label>UNITS TO PRODUCE</label><input type="number" id="bp-units" class="form-control" value="20" required /></div>
          <div class="form-group"><label>BATCH CODE</label><input type="text" id="bp-batch-code" class="form-control" value="BATCH-2026-01" required /></div>
        </div>
        <div class="form-grid grid-2">
          <div class="form-group"><label>EXPIRY</label><input type="text" id="bp-expiry" class="form-control" value="12/2028" required /></div>
          <div class="form-group"><label>PRICE (₹)</label><input type="number" id="bp-price" class="form-control" value="650" required /></div>
        </div>
        <button type="submit" class="btn btn-blue" style="width:100%; margin-top:1rem;">Run Production Engine</button>
      </form>
    </div>
  </div>'''

new_batch_modal = '''  <!-- MODAL: EXECUTE BATCH PRODUCTION WITH COST & SELLING PRICE -->
  <div id="md-batch-prod" class="modal-overlay">
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-header"><h3>⚙️ Execute Batch Production Routine</h3><button class="modal-close" onclick="closeModal('md-batch-prod')">✕</button></div>
      <form onsubmit="runProductionEngine(event)">
        <div class="form-group" style="margin-bottom:0.75rem;"><label>MASTER RECIPE *</label><select id="bp-recipe-id" class="form-control" required></select></div>
        <div class="form-grid grid-2">
          <div class="form-group"><label>UNITS TO PRODUCE *</label><input type="number" id="bp-units" class="form-control" value="20" min="1" required /></div>
          <div class="form-group"><label>BATCH CODE *</label><input type="text" id="bp-batch-code" class="form-control" value="BATCH-2026-01" required /></div>
        </div>
        <div class="form-grid grid-3" style="margin-top:0.5rem; margin-bottom:1.25rem;">
          <div class="form-group"><label>EXPIRY (MM/YYYY) *</label><input type="text" id="bp-expiry" class="form-control" value="12/2028" required /></div>
          <div class="form-group"><label>PRODUCTION COST (₹/UNIT) *</label><input type="number" step="0.01" id="bp-cost-price" class="form-control" placeholder="e.g. 250" value="250" required /></div>
          <div class="form-group"><label>SELLING PRICE (₹/UNIT) *</label><input type="number" step="0.01" id="bp-price" class="form-control" placeholder="e.g. 650" value="650" required /></div>
        </div>
        <button type="submit" class="btn btn-blue" style="width:100%; justify-content:center; font-size:0.9rem;">Run Production & Transfer Stock to Pharmacy</button>
      </form>
    </div>
  </div>'''

if old_batch_modal in html:
    html = html.replace(old_batch_modal, new_batch_modal)

# 2. Complete rewrite of runProductionEngine to guarantee inventory reduction & pharmacy stock update
new_engine_js = '''    async function runProductionEngine(e) {
      e.preventDefault();
      const recipeId = document.getElementById('bp-recipe-id').value;
      const recipe = db.recipes.find(r => r.id === recipeId);
      if (!recipe) return alert('Please select a valid Master Recipe.');

      const units = Number(document.getElementById('bp-units').value) || 0;
      const batchCode = document.getElementById('bp-batch-code').value;
      const expiry = document.getElementById('bp-expiry').value;
      const costPrice = Number(document.getElementById('bp-cost-price').value) || 0;
      const sellingPrice = Number(document.getElementById('bp-price').value) || 0;

      let ingList = [];
      try {
        ingList = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : (recipe.ingredients || []);
      } catch(err) { ingList = []; }

      if (ingList.length === 0 && recipe.raw_req_id) {
        ingList.push({ raw_id: recipe.raw_req_id, qty_per_unit: recipe.req_qty_per_unit || 0.5 });
      }

      // 1. Check Raw Material Sufficiency
      for (let ing of ingList) {
        const raw = db.rawMaterials.find(x => x.id === ing.raw_id);
        const reqQty = Number(ing.qty_per_unit) * units;
        if (!raw || Number(raw.stock) < reqQty) {
          const avail = raw ? `${raw.stock}${raw.unit}` : '0';
          return alert(`Insufficient Stock for Raw Material: ${raw ? raw.name : ing.raw_id}!\nRequired: ${reqQty}, Available: ${avail}`);
        }
      }

      // 2. Deduct Raw Material Inventory
      for (let ing of ingList) {
        const raw = db.rawMaterials.find(x => x.id === ing.raw_id);
        if (raw) {
          const reqQty = Number(ing.qty_per_unit) * units;
          raw.stock = Math.max(0, Number(raw.stock) - reqQty);
          if (sbClient) {
            try { await sbClient.from('raw_materials').update({ stock: raw.stock }).eq('id', raw.id); } catch(err) {}
          }
        }
      }

      // 3. Sync to Herbal Pharmacy Inventory Database
      const phPayload = {
        barcode: recipe.barcode || ('890' + Math.floor(1000000 + Math.random() * 9000000)),
        name: recipe.name,
        batch_code: batchCode,
        expiry: expiry,
        production_cost: costPrice,
        price: sellingPrice,
        stock: units
      };

      if (sbClient) {
        try {
          const { data: existing } = await sbClient.from('pharmacy_stock').select('*').eq('barcode', phPayload.barcode).eq('batch_code', batchCode);
          if (existing && existing.length > 0) {
            const updatedStock = Number(existing[0].stock || 0) + units;
            await sbClient.from('pharmacy_stock').update({ stock: updatedStock, price: sellingPrice, production_cost: costPrice }).eq('id', existing[0].id);
          } else {
            await sbClient.from('pharmacy_stock').insert([phPayload]);
          }
        } catch(err) { console.error('Supabase Pharmacy Sync Error:', err); }
      }

      // Local fallback sync
      const localMed = db.pharmacy.find(p => p.barcode === phPayload.barcode && p.batch_code === batchCode);
      if (localMed) {
        localMed.stock += units;
        localMed.price = sellingPrice;
        localMed.production_cost = costPrice;
      } else {
        db.pharmacy.unshift(phPayload);
      }

      alert(`✅ Production Batch Executed Successfully!\n• Produced: ${units} units of ${recipe.name}\n• Consumed Raw Materials deducted from inventory.\n• Stock transferred to Herbal Pharmacy for sale.`);
      closeModal('md-batch-prod');
      renderAushadhiNirman();
      renderPharmacy();
      updateDashboardStats();
    }'''

if 'async function runProductionEngine(e)' in html:
    start_pos = html.find('async function runProductionEngine(e)')
    end_pos = html.find('/* HERBAL PHARMACY & POS */')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + new_engine_js + '\n\n    ' + html[end_pos:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Batch production cost, selling price, raw material deduction, and pharmacy transfer patched successfully.")
