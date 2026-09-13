/**
 * AUSHADHI NIRMAN - SELF-HEALING MANUFACTURING ENGINE
 */
window.nrmState = { raw: [], recipes: [], bom: [], activeRecipe: null };

function getDbRobust() {
    // 1. Check existing initialized clients
    if (typeof sbClient !== 'undefined' && sbClient && typeof sbClient.from === 'function') return sbClient;
    if (typeof supabaseClient !== 'undefined' && supabaseClient && typeof supabaseClient.from === 'function') return supabaseClient;
    if (window.sbClient && typeof window.sbClient.from === 'function') return window.sbClient;
    if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
    if (window.db && typeof window.db.from === 'function') return window.db;

    // 2. If window.supabase is an active client instance
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;

    // 3. Auto-initialize fallback client if Supabase SDK is loaded
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            // Extract credentials from local storage or use project defaults
            const url = localStorage.getItem('supabase_url') || 'https://aumxpvigfvfeltsrqkbf.supabase.co';
            const key = localStorage.getItem('supabase_key') || '';
            if (url && key) {
                window.sbClient = window.supabase.createClient(url, key);
                return window.sbClient;
            }
        } catch(e) {}
    }

    // 4. Deep window scan for any object with .from
    for (let key of Object.keys(window)) {
        try {
            let obj = window[key];
            if (obj && typeof obj === 'object' && typeof obj.from === 'function' && typeof obj.auth === 'object') {
                return obj;
            }
        } catch(e) {}
    }

    return null;
}

// INJECT MODALS INTO <BODY>
function injectNirmanModals() {
  if (document.getElementById('nrm-modal-rm')) return;

  const container = document.createElement('div');
  container.innerHTML = `
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
          <button onclick="document.getElementById('nrm-modal-rm').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px;">Cancel</button>
          <button onclick="nrmSaveRM()" style="background: #ea580c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save & Sync Expense</button>
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
            <button onclick="nrmAddBOM()" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; border-radius:4px; font-weight: bold;">Add</button>
          </div>
          <table style="width: 100%; color: white; text-align: left; font-size: 0.9rem;">
            <thead><tr style="color: #9ca3af; border-bottom: 1px solid #334155;"><th>Item</th><th>Qty</th><th>Action</th></tr></thead>
            <tbody id="nrm-tb-bom"></tbody>
          </table>
          <div id="nrm-cop-preview" style="text-align: right; margin-top: 0.5rem; color: #f59e0b; font-weight: bold;">Est. COP: ₹0.00</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="document.getElementById('nrm-modal-recipe').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px;">Cancel</button>
          <button onclick="nrmSaveRecipe()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight: bold;">Save Recipe</button>
        </div>
      </div>
    </div>

    <!-- MODAL: BATCH EXECUTION -->
    <div id="nrm-modal-batch" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; z-index: 999999;">
      <div style="background: #1e293b; width: 400px; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155;">
        <h3 style="color: #10b981; margin-top: 0;">Execute Batch Production</h3>
        <h4 id="nrm-batch-title" style="color: white; margin-bottom: 1.5rem;"></h4>
        
        <label style="color:#9ca3af; font-size:0.8rem;">Batch Number (Auto-Generated)</label>
        <input type="text" id="nrm-batch-code" readonly style="width: 100%; padding: 0.5rem; background: #0f172a; color: #10b981; border: 1px solid #334155; margin-bottom: 1rem; box-sizing:border-box; font-weight: bold;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div><label style="color:#9ca3af; font-size:0.8rem;">Units to Produce</label><input type="number" id="nrm-batch-qty" value="1" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing:border-box;"></div>
          <div><label style="color:#9ca3af; font-size:0.8rem;">Expiry (MM/YYYY)</label><input type="text" id="nrm-batch-exp" placeholder="12/2026" style="width: 100%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #334155; box-sizing:border-box;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button onclick="document.getElementById('nrm-modal-batch').style.display='none'" style="padding: 0.5rem 1rem; cursor: pointer; background: #475569; color: white; border: none; border-radius: 4px;">Cancel</button>
          <button onclick="nrmExecBatch()" style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius:4px; font-weight:bold;">Produce & Sync Pharmacy</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);
}

// GLOBAL HANDLERS
window.openRawMaterialModal = function() {
  injectNirmanModals();
  document.getElementById('nrm-rm-name').value = '';
  document.getElementById('nrm-rm-qty').value = '';
  document.getElementById('nrm-rm-cost').value = '';
  document.getElementById('nrm-modal-rm').style.display = 'flex';
};

window.openMasterRecipeModal = function() {
  injectNirmanModals();
  window.nrmState.bom = [];
  document.getElementById('nrm-rec-name').value = '';
  document.getElementById('nrm-rec-margin').value = '20';
  const sel = document.getElementById('nrm-rec-sel');
  if(sel) sel.innerHTML = '<option value="">Select Raw Material</option>' + window.nrmState.raw.map(r => `<option value="${r.id}">${r.name} (Stock: ${parseFloat(r.stock).toFixed(2)}${r.unit})</option>`).join('');
  nrmRenderBOM();
  document.getElementById('nrm-modal-recipe').style.display = 'flex';
};

window.executeBatchProduction = function() {
    if(!window.nrmState.recipes || window.nrmState.recipes.length === 0) return alert("No master recipes available.");
    const text = window.nrmState.recipes.map((r, i) => `${i+1}. ${r.name || r.medicine_name}`).join('\n');
    const sel = prompt("Enter Recipe Number to produce:\n" + text);
    if(!sel) return;
    const target = window.nrmState.recipes[parseInt(sel)-1];
    if(target) window.nrmOpenBatch(target.id);
};

// LOAD DATA
async function loadNirman() {
  const db = getDbRobust();
  if (!db) return;

  try {
    const { data: raw } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
    window.nrmState.raw = raw || [];
    
    const { data: rec } = await db.from('master_recipes').select('*').order('created_at', { ascending: false });
    window.nrmState.recipes = rec || [];

    renderNirmanTables();
  } catch (e) { console.error(e); }
}

function renderNirmanTables() {
  const tbRaw = document.getElementById('tbody-raw-materials') || document.getElementById('nrm-tb-raw');
  if (tbRaw) {
    tbRaw.innerHTML = window.nrmState.raw.map(r => {
      const uCost = parseFloat(r.stock) > 0 ? (parseFloat(r.purchase_rate || 0) / parseFloat(r.stock)).toFixed(2) : '0.00';
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color:white;">
          <td style="padding:0.5rem;">${r.id}</td>
          <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
          <td style="padding:0.5rem;">${r.category}</td>
          <td style="padding:0.5rem;">${r.stock} ${r.unit}</td>
          <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 0} ${r.unit}</td>
          <td style="padding:0.5rem; color:#10b981;">₹${uCost}</td>
          <td style="padding:0.5rem; text-align:center;"><button onclick="nrmDelRaw('${r.id}')" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem; color:white;">No raw materials found.</td></tr>';
  }

  const tbRec = document.getElementById('tbody-master-recipes') || document.getElementById('nrm-tb-recipes');
  if (tbRec) {
    tbRec.innerHTML = window.nrmState.recipes.map(r => {
      let bomStr = "N/A";
      try {
        const p = JSON.parse(r.ingredients);
        bomStr = p.map(i => `${i.name}(${i.qty})`).join(', ');
      } catch(e){}

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color:white;">
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
    }).join('') || '<tr><td colspan="6" style="text-align:center; padding:1rem; color:white;">No recipes found.</td></tr>';
  }
}

// ACTION CONTROLLERS
window.nrmSaveRM = async function() {
    try {
        const db = getDbRobust();
        if (!db) return alert("Database connection not found.");

        const name = document.getElementById('nrm-rm-name').value;
        const cat = document.getElementById('nrm-rm-cat').value;
        const unit = document.getElementById('nrm-rm-unit').value;
        const qty = parseFloat(document.getElementById('nrm-rm-qty').value);
        const reorder = parseFloat(document.getElementById('nrm-rm-reorder').value);
        const cost = parseFloat(document.getElementById('nrm-rm-cost').value);

        if(!name || isNaN(qty) || isNaN(cost)) return alert("Fill required fields with valid numbers.");

        const payload = { id: 'RAW-'+Date.now(), name, category: cat, unit, stock: qty, reorder, purchase_rate: cost };
        
        const { error } = await db.from('raw_materials').insert([payload]);
        if(error) return alert("DB Insert Error: " + error.message);

        try { 
            await db.from('accounts_vendors').insert([{ type: 'Expense', title: `RM Purchase: ${name}`, category: 'Raw Materials', amount: cost, status: 'Paid' }]); 
        } catch(e) {}

        alert("Raw Material added & Expense synced to Accounts!");
        document.getElementById('nrm-modal-rm').style.display = 'none';
        loadNirman();
    } catch(err) {
        alert("Error: " + err.message);
    }
};

window.nrmDelRaw = async function(id) {
  if(!confirm("Delete RM?")) return;
  await getDbRobust().from('raw_materials').delete().eq('id', id);
  loadNirman();
};

window.nrmAddBOM = function() {
  const sel = document.getElementById('nrm-rec-sel');
  const qty = parseFloat(document.getElementById('nrm-rec-qty').value);
  if(!sel.value || !qty || qty <= 0) return alert("Invalid selection or quantity");

  const rm = window.nrmState.raw.find(r => r.id === sel.value);
  if(qty > parseFloat(rm.stock)) return alert(`Exceeds stock! Only ${rm.stock}${rm.unit} available.`);

  const exist = window.nrmState.bom.find(b => b.id === rm.id);
  if(exist) {
      if((exist.qty + qty) > parseFloat(rm.stock)) return alert(`Exceeds stock! Only ${rm.stock}${rm.unit} total available.`);
      exist.qty += qty;
  } else {
      window.nrmState.bom.push({ id: rm.id, name: rm.name, qty, unit: rm.unit, unit_cost: parseFloat(rm.purchase_rate)/parseFloat(rm.stock) });
  }
  
  document.getElementById('nrm-rec-qty').value = '';
  nrmRenderBOM();
};

window.nrmRenderBOM = function() {
  let cop = 0;
  document.getElementById('nrm-tb-bom').innerHTML = window.nrmState.bom.map((b, i) => {
    cop += (b.qty * b.unit_cost);
    return `<tr><td>${b.name}</td><td>${b.qty}${b.unit}</td><td><button onclick="window.nrmState.bom.splice(${i},1); nrmRenderBOM();" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold;">X</button></td></tr>`;
  }).join('');
  document.getElementById('nrm-cop-preview').innerText = `Est. COP: ₹${cop.toFixed(2)}`;
};

window.nrmSaveRecipe = async function() {
    try {
        const db = getDbRobust();
        if (!db) return alert("Database connection not found.");

        const name = document.getElementById('nrm-rec-name').value;
        const margin = parseFloat(document.getElementById('nrm-rec-margin').value);
        if(!name || window.nrmState.bom.length === 0) return alert("Name and BOM required.");

        let cop = 0;
        window.nrmState.bom.forEach(b => cop += (b.qty * b.unit_cost));
        const mrp = cop + (cop * (margin/100));

        if(mrp <= cop) return alert("Selling price must be greater than COP. Increase margin.");

        const payload = {
            id: 'REC-'+Date.now(), name, barcode: 'BC-'+Math.floor(100000+Math.random()*900000),
            cop, profit_margin: margin, selling_price: mrp, ingredients: JSON.stringify(window.nrmState.bom)
        };

        const { error } = await db.from('master_recipes').insert([payload]);
        if(error) return alert("DB Insert Error: " + error.message);

        alert(`Recipe Saved!\nCOP: ₹${cop.toFixed(2)}\nMRP: ₹${mrp.toFixed(2)}`);
        document.getElementById('nrm-modal-recipe').style.display = 'none';
        loadNirman();
    } catch(err) {
        alert("Error: " + err.message);
    }
};

window.nrmDelRec = async function(id) {
  if(!confirm("Delete Recipe?")) return;
  await getDbRobust().from('master_recipes').delete().eq('id', id);
  loadNirman();
};

window.nrmOpenBatch = function(id) {
  injectNirmanModals();
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
    try {
        const db = getDbRobust();
        if (!db) return alert("Database connection not found.");

        const rec = window.nrmState.activeRecipe;
        const batchCode = document.getElementById('nrm-batch-code').value;
        const exp = document.getElementById('nrm-batch-exp').value;
        const units = parseFloat(document.getElementById('nrm-batch-qty').value);

        if(units <= 0 || !exp) return alert("Valid units and expiry required.");

        let bom = [];
        try { bom = JSON.parse(rec.ingredients); } catch(e){}
        if(!bom.length) return alert("No BOM found.");

        for (let b of bom) {
            const required = b.qty * units;
            const rm = window.nrmState.raw.find(r => r.id === b.id);
            if (!rm || parseFloat(rm.stock) < required) return alert(`Insufficient ${b.name}. Need ${required}, have ${rm ? rm.stock : 0}.`);
        }

        for (let b of bom) {
            const required = b.qty * units;
            const rm = window.nrmState.raw.find(r => r.id === b.id);
            await db.from('raw_materials').update({ stock: parseFloat(rm.stock) - required }).eq('id', b.id);
        }

        const pharmPayload = {
            barcode: rec.barcode, name: rec.name || rec.medicine_name, batch_code: batchCode,
            expiry: exp, price: rec.selling_price, stock: units
        };
        const { error } = await db.from('pharmacy_stock').insert([pharmPayload]);
        if(error) return alert("Pharmacy sync error: " + error.message);

        alert(`Batch Manufactured!\nBatch: ${batchCode}\nSynced to Pharmacy.`);
        document.getElementById('nrm-modal-batch').style.display = 'none';
        loadNirman();
    } catch(err) {
        alert("Error: " + err.message);
    }
};

// POLLING INIT
let pollCount = 0;
function bootNirman() {
    if (getDbRobust()) {
        loadNirman();
    } else if (pollCount < 40) {
        pollCount++;
        setTimeout(bootNirman, 250);
    } else {
        console.warn("Aushadhi Nirman: Database connection timeout.");
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootNirman);
} else {
    bootNirman();
}
window.addEventListener('load', bootNirman);
