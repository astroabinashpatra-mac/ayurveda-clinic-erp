/**
 * AUSHADHI NIRMAN - MEDICINE MANUFACTURING (FRESH BUILD)
 * Self-Mounting UI and Logic Engine
 */

window.nrmState = {
  raw: [],
  recipes: [],
  bom: [],
  activeRecipe: null
};

function getDb() {
  return window.sbClient || window.supabaseClient || (typeof supabase !== 'undefined' ? supabase : null);
}

// 1. SELF-MOUNTING UI
function mountNirmanUI() {
  const container = document.getElementById('module-aushadhi-nirman');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: #ea580c; font-size: 1.5rem; margin: 0;">🏺 Aushadhi Nirman (Production)</h2>
      <div>
        <button onclick="nrmOpenRM()" style="background: #ea580c; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem; font-weight: bold;">+ Add Raw Material</button>
        <button onclick="nrmOpenRecipe()" style="background: #2563eb; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer;">+ Add Master Recipe</button>
      </div>
    </div>

    <!-- RM TABLE -->
    <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; margin-bottom: 2rem;">
      <h3 style="color: white; margin-top: 0;">Raw Materials Inventory</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left; color: white;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); color: #9ca3af;">
            <th style="padding: 0.6rem;">ID</th><th style="padding: 0.6rem;">Name</th><th style="padding: 0.6rem;">Category</th>
            <th style="padding: 0.6rem;">Stock</th><th style="padding: 0.6rem;">Reorder</th><th style="padding: 0.6rem;">Est. Unit Cost</th>
            <th style="padding: 0.6rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody id="nrm-tb-raw"></tbody>
      </table>
    </div>

    <!-- RECIPE TABLE -->
    <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem;">
      <h3 style="color: white; margin-top: 0;">Master Recipes & Production</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left; color: white;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); color: #9ca3af;">
            <th style="padding: 0.6rem;">Recipe Name</th><th style="padding: 0.6rem;">Barcode</th>
            <th style="padding: 0.6rem;">COP (₹)</th><th style="padding: 0.6rem;">MRP (₹)</th><th style="padding: 0.6rem;">BOM</th>
            <th style="padding: 0.6rem; text-align: center;">Production</th>
          </tr>
        </thead>
        <tbody id="nrm-tb-recipes"></tbody>
      </table>
    </div>

    <!-- MODAL: RAW MATERIAL -->
    <div id="nrm-modal-rm" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 450px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">Add Raw Material</h3>
        <input type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px; box-sizing: border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <select id="nrm-rm-cat" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option>
            <option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
          </select>
          <select id="nrm-rm-unit" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
            <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option>
            <option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div><label style="color:#9ca3af; font-size:0.8rem;">Init Qty</label><input type="number" id="nrm-rm-qty" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Reorder</label><input type="number" id="nrm-rm-reorder" value="10" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Total Cost(₹)</label><input type="number" id="nrm-rm-cost" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing: border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="document.getElementById('nrm-modal-rm').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer;">Cancel</button>
          <button onclick="nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px;">Save & Sync Expense</button>
        </div>
      </div>
    </div>

    <!-- MODAL: RECIPE -->
    <div id="nrm-modal-recipe" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 550px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: white; margin-top: 0;">Create Master Recipe</h3>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <input type="text" id="nrm-rec-name" placeholder="Medicine Name" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
          <input type="number" id="nrm-rec-margin" placeholder="Margin % (e.g. 20)" value="20" style="padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; border-radius: 4px;">
        </div>

        <div style="background: #0f172a; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
          <h4 style="color: #cbd5e1; margin-top: 0;">Add Raw Materials (BOM)</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select id="nrm-rec-sel" style="flex: 2; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;"></select>
            <input type="number" id="nrm-rec-qty" placeholder="Qty" style="flex: 1; padding: 0.5rem; background: #1e293b; color: white; border: 1px solid #334155;">
            <button onclick="nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; border-radius:4px;">Add</button>
          </div>
          <table style="width: 100%; color: white; text-align: left; font-size: 0.9rem;">
            <thead><tr style="color: #9ca3af; border-bottom: 1px solid #334155;"><th>Item</th><th>Qty</th><th>Action</th></tr></thead>
            <tbody id="nrm-tb-bom"></tbody>
          </table>
          <div id="nrm-cop-preview" style="text-align: right; margin-top: 0.5rem; color: #f59e0b; font-weight: bold;">Est. COP: ₹0.00</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="document.getElementById('nrm-modal-recipe').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer;">Cancel</button>
          <button onclick="nrmSaveRecipe()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px;">Save Recipe</button>
        </div>
      </div>
    </div>

    <!-- MODAL: BATCH EXECUTION -->
    <div id="nrm-modal-batch" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 400px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: #10b981; margin-top: 0;">Execute Batch Production</h3>
        <h4 id="nrm-batch-title" style="color: white; margin-bottom: 1.5rem;"></h4>
        
        <label style="color:#9ca3af; font-size:0.8rem;">Batch Number (Auto)</label>
        <input type="text" id="nrm-batch-code" readonly style="width: 100%; padding: 0.5rem; background: #0f172a; color: #10b981; border: 1px solid #334155; margin-bottom: 1rem; box-sizing:border-box;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div><label style="color:#9ca3af; font-size:0.8rem;">Units to Produce</label><input type="number" id="nrm-batch-qty" value="1" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing:border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Expiry (MM/YYYY)</label><input type="text" id="nrm-batch-exp" placeholder="12/2026" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing:border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="document.getElementById('nrm-modal-batch').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer;">Cancel</button>
          <button onclick="nrmExecBatch()" style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight:bold;">Produce & Sync Pharmacy</button>
        </div>
      </div>
    </div>
  `;
}

// 2. LOAD DATA
async function loadNirman() {
  const db = getDb();
  if (!db) return;

  try {
    const { data: raw } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    window.nrmState.raw = raw || [];
    
    const { data: rec } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    window.nrmState.recipes = rec || [];

    renderNirman();
  } catch (e) {
    console.error("Nirman Load Error:", e);
  }
}

function renderNirman() {
  const tbRaw = document.getElementById('nrm-tb-raw');
  if (tbRaw) {
    tbRaw.innerHTML = window.nrmState.raw.map(r => {
      const uCost = parseFloat(r.stock) > 0 ? (parseFloat(r.purchase_rate || 0) / parseFloat(r.stock)).toFixed(2) : '0.00';
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding:0.5rem;">${r.id}</td>
          <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
          <td style="padding:0.5rem;">${r.category}</td>
          <td style="padding:0.5rem;">${r.stock} ${r.unit}</td>
          <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 0} ${r.unit}</td>
          <td style="padding:0.5rem; color:#10b981;">₹${uCost}</td>
          <td style="padding:0.5rem; text-align:center;"><button onclick="nrmDelRaw('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem;">No raw materials found.</td></tr>';
  }

  const tbRec = document.getElementById('nrm-tb-recipes');
  if (tbRec) {
    tbRec.innerHTML = window.nrmState.recipes.map(r => {
      let bomStr = "N/A";
      try {
        const p = JSON.parse(r.ingredients);
        bomStr = p.map(i => `${i.name}(${i.qty})`).join(', ');
      } catch(e){}

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding:0.5rem; font-weight:bold;">${r.name || r.medicine_name}</td>
          <td style="padding:0.5rem;">${r.barcode}</td>
          <td style="padding:0.5rem; color:#ef4444;">₹${parseFloat(r.cop||0).toFixed(2)}</td>
          <td style="padding:0.5rem; color:#10b981;">₹${parseFloat(r.selling_price||0).toFixed(2)}</td>
          <td style="padding:0.5rem; font-size:0.8rem;">${bomStr}</td>
          <td style="padding:0.5rem; text-align:center;">
            <button onclick="nrmOpenBatch('${r.id}')" style="background:#10b981; color:white; border:none; padding:0.3rem 0.6rem; border-radius:3px; cursor:pointer; font-weight:bold;">Produce Batch</button>
            <button onclick="nrmDelRec('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.3rem 0.5rem; border-radius:3px; cursor:pointer; margin-left:4px;">Del</button>
          </td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center; padding:1rem;">No recipes found.</td></tr>';
  }
}

// 3. RAW MATERIAL LOGIC
window.nrmOpenRM = function() {
  document.getElementById('nrm-rm-name').value = '';
  document.getElementById('nrm-rm-qty').value = '';
  document.getElementById('nrm-rm-cost').value = '';
  document.getElementById('nrm-modal-rm').style.display = 'flex';
};

window.nrmSaveRM = async function() {
  const db = getDb();
  if(!db) return alert("DB Error");

  const name = document.getElementById('nrm-rm-name').value;
  const cat = document.getElementById('nrm-rm-cat').value;
  const unit = document.getElementById('nrm-rm-unit').value;
  const qty = parseFloat(document.getElementById('nrm-rm-qty').value);
  const reorder = parseFloat(document.getElementById('nrm-rm-reorder').value);
  const cost = parseFloat(document.getElementById('nrm-rm-cost').value);

  if(!name || !qty || !cost) return alert("Fill required fields");

  const payload = { id: 'RAW-'+Date.now(), name, category: cat, unit, stock: qty, reorder, purchase_rate: cost };
  
  const { error } = await db.from('raw_materials').insert([payload]);
  if(error) return alert(error.message);

  // Sync to Accounts automatically
  await db.from('accounts_vendors').insert([{ type: 'Expense', title: `Raw Material Purchase: ${name}`, category: 'Raw Materials', amount: cost, status: 'Paid' }]);

  alert("Raw Material added & Expense synced to Accounts!");
  document.getElementById('nrm-modal-rm').style.display = 'none';
  loadNirman();
};

window.nrmDelRaw = async function(id) {
  if(!confirm("Delete RM?")) return;
  await getDb().from('raw_materials').delete().eq('id', id);
  loadNirman();
};

// 4. RECIPE LOGIC
window.nrmOpenRecipe = function() {
  window.nrmState.bom = [];
  document.getElementById('nrm-rec-name').value = '';
  document.getElementById('nrm-rec-margin').value = '20';
  
  const sel = document.getElementById('nrm-rec-sel');
  sel.innerHTML = '<option value="">Select Raw Material</option>' + window.nrmState.raw.map(r => `<option value="${r.id}">${r.name} (Stock: ${r.stock}${r.unit})</option>`).join('');
  
  nrmRenderBOM();
  document.getElementById('nrm-modal-recipe').style.display = 'flex';
};

window.nrmAddBOM = function() {
  const sel = document.getElementById('nrm-rec-sel');
  const qty = parseFloat(document.getElementById('nrm-rec-qty').value);
  if(!sel.value || !qty || qty <= 0) return alert("Invalid selection or quantity");

  const rm = window.nrmState.raw.find(r => r.id === sel.value);
  if(qty > parseFloat(rm.stock)) return alert("Cannot exceed inventory stock!");

  const exist = window.nrmState.bom.find(b => b.id === rm.id);
  if(exist) exist.qty += qty;
  else window.nrmState.bom.push({ id: rm.id, name: rm.name, qty, unit: rm.unit, unit_cost: parseFloat(rm.purchase_rate)/parseFloat(rm.stock) });
  
  document.getElementById('nrm-rec-qty').value = '';
  nrmRenderBOM();
};

window.nrmRenderBOM = function() {
  let cop = 0;
  document.getElementById('nrm-tb-bom').innerHTML = window.nrmState.bom.map((b, i) => {
    cop += (b.qty * b.unit_cost);
    return `<tr><td>${b.name}</td><td>${b.qty}${b.unit}</td><td><button onclick="window.nrmState.bom.splice(${i},1); nrmRenderBOM();" style="color:red; border:none; background:none; cursor:pointer;">X</button></td></tr>`;
  }).join('');
  document.getElementById('nrm-cop-preview').innerText = `Est. COP: ₹${cop.toFixed(2)}`;
};

window.nrmSaveRecipe = async function() {
  const name = document.getElementById('nrm-rec-name').value;
  const margin = parseFloat(document.getElementById('nrm-rec-margin').value);
  if(!name || window.nrmState.bom.length === 0) return alert("Name and BOM required.");

  let cop = 0;
  window.nrmState.bom.forEach(b => cop += (b.qty * b.unit_cost));
  const mrp = cop + (cop * (margin/100));

  if(mrp <= cop) return alert("Selling price must be greater than COP.");

  const payload = {
    id: 'REC-'+Date.now(), name, barcode: 'BC-'+Math.floor(100000+Math.random()*900000),
    cop, profit_margin: margin, selling_price: mrp, ingredients: JSON.stringify(window.nrmState.bom)
  };

  const { error } = await getDb().from('master_recipes').insert([payload]);
  if(error) return alert(error.message);

  alert(`Recipe Saved! MRP locked at ₹${mrp.toFixed(2)}`);
  document.getElementById('nrm-modal-recipe').style.display = 'none';
  loadNirman();
};

window.nrmDelRec = async function(id) {
  if(!confirm("Delete Recipe?")) return;
  await getDb().from('master_recipes').delete().eq('id', id);
  loadNirman();
};

// 5. BATCH PRODUCTION
window.nrmOpenBatch = function(id) {
  const rec = window.nrmState.recipes.find(r => r.id === id);
  if(!rec) return;
  window.nrmState.activeRecipe = rec;
  
  const d = new Date();
  document.getElementById('nrm-batch-title').innerText = `Medicine: ${rec.name || rec.medicine_name}`;
  document.getElementById('nrm-batch-code').value = `BAT-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(100+Math.random()*900)}`;
  document.getElementById('nrm-batch-exp').value = `12/${d.getFullYear() + 2}`;
  document.getElementById('nrm-modal-batch').style.display = 'flex';
};

window.nrmExecBatch = async function() {
  const db = getDb();
  const rec = window.nrmState.activeRecipe;
  const batchCode = document.getElementById('nrm-batch-code').value;
  const exp = document.getElementById('nrm-batch-exp').value;
  const units = parseFloat(document.getElementById('nrm-batch-qty').value);

  if(units <= 0 || !exp) return alert("Valid units and expiry required.");

  let bom = [];
  try { bom = JSON.parse(rec.ingredients); } catch(e){}
  if(!bom.length) return alert("No BOM found for this recipe.");

  // Validation
  for (let b of bom) {
    const required = b.qty * units;
    const rm = window.nrmState.raw.find(r => r.id === b.id);
    if (!rm || parseFloat(rm.stock) < required) return alert(`Insufficient ${b.name}. Need ${required}, have ${rm ? rm.stock : 0}.`);
  }

  // Deduction
  for (let b of bom) {
    const required = b.qty * units;
    const rm = window.nrmState.raw.find(r => r.id === b.id);
    await db.from('raw_materials').update({ stock: parseFloat(rm.stock) - required }).eq('id', b.id);
  }

  // Pharmacy Sync
  const pharmPayload = {
    barcode: rec.barcode, name: rec.name || rec.medicine_name, batch_code: batchCode,
    expiry: exp, price: rec.selling_price, stock: units
  };
  const { error } = await db.from('pharmacy_stock').insert([pharmPayload]);
  
  if(error) return alert("Pharmacy sync error: " + error.message);

  alert(`Batch Manufactured!\nBatch: ${batchCode}\nPharmacy Stock Updated.`);
  document.getElementById('nrm-modal-batch').style.display = 'none';
  loadNirman();
};

// INIT
window.addEventListener('DOMContentLoaded', () => {
  mountNirmanUI();
  loadNirman();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountNirmanUI();
  loadNirman();
}
