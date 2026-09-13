/**
 * AUSHADHI NIRMAN - FULLY ISOLATED PRODUCTION ENGINE
 */
(function() {
  window.nrmState = { raw: [], recipes: [], bom: [], activeRecipe: null };

  // Safe global stubs to prevent any external script reference errors
  window.populateDatalist = window.populateDatalist || function() {};
  window.populateAllAutocompletes = window.populateAllAutocompletes || function() {};

  function getActiveDb() {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') return supabase;
    if (typeof sbClient !== 'undefined' && sbClient && typeof sbClient.from === 'function') return sbClient;
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
    if (window.sbClient && typeof window.sbClient.from === 'function') return window.sbClient;
    return null;
  }

  function injectModals() {
    if (document.getElementById('nrm-modal-rm')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <!-- RM MODAL -->
      <div id="nrm-modal-rm" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); align-items:center; justify-content:center; z-index:999999;">
        <div style="background:#1e293b; width:450px; padding:1.5rem; border-radius:8px; border:1px solid #334155;">
          <h3 style="color:white; margin-top:0;">Add Raw Material</h3>
          <input type="text" id="nrm-rm-name" placeholder="Material Name (e.g., Ashwagandha)" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:#0f172a; color:white; border:1px solid #334155; box-sizing:border-box;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <select id="nrm-rm-cat" style="padding:0.5rem; background:#0f172a; color:white; border:1px solid #334155;">
              <option value="Herbs">Herbs</option><option value="Roots">Roots</option><option value="Oil/Ghee">Oil/Ghee</option><option value="Powder/Bhasma">Powder/Bhasma</option><option value="Mineral">Mineral</option><option value="Other">Other</option>
            </select>
            <select id="nrm-rm-unit" style="padding:0.5rem; background:#0f172a; color:white; border:1px solid #334155;">
              <option value="gms">gms</option><option value="kg">kg</option><option value="ltrs">ltrs</option><option value="counts">counts</option><option value="Ozs">Ozs</option><option value="mtrs">mtrs</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-bottom:1.5rem;">
            <div><label style="color:#9ca3af; font-size:0.8rem;">Qty</label><input type="number" id="nrm-rm-qty" style="width:100%; padding:0.5rem; background:#0f172a; color:white; border:1px solid #334155; box-sizing:border-box;"></div>
            <div><label style="color:#9ca3af; font-size:0.8rem;">Reorder</label><input type="number" id="nrm-rm-reorder" value="10" style="width:100%; padding:0.5rem; background:#0f172a; color:white; border:1px solid #334155; box-sizing:border-box;"></div>
            <div><label style="color:#9ca3af; font-size:0.8rem;">Cost(₹)</label><input type="number" id="nrm-rm-cost" style="width:100%; padding:0.5rem; background:#0f172a; color:white; border:1px solid #334155; box-sizing:border-box;"></div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <button onclick="document.getElementById('nrm-modal-rm').style.display='none'" style="padding:0.5rem 1rem; background:#475569; color:white; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
            <button onclick="window.nrmSaveRM()" style="padding:0.5rem 1rem; background:#ea580c; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Save & Sync Expense</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  window.openRawMaterialModal = function() {
    injectModals();
    document.getElementById('nrm-rm-name').value = '';
    document.getElementById('nrm-rm-qty').value = '';
    document.getElementById('nrm-rm-cost').value = '';
    document.getElementById('nrm-modal-rm').style.display = 'flex';
  };

  window.nrmSaveRM = async function() {
    const db = getActiveDb();
    if (!db) return alert("Database connection not active.");
    const name = document.getElementById('nrm-rm-name').value;
    const cat = document.getElementById('nrm-rm-cat').value;
    const unit = document.getElementById('nrm-rm-unit').value;
    const qty = parseFloat(document.getElementById('nrm-rm-qty').value);
    const reorder = parseFloat(document.getElementById('nrm-rm-reorder').value);
    const cost = parseFloat(document.getElementById('nrm-rm-cost').value);

    if (!name || isNaN(qty) || isNaN(cost)) return alert("Please fill required fields.");

    const payload = { id: 'RAW-'+Date.now(), name, category: cat, unit, stock: qty, reorder, purchase_rate: cost };
    const { error } = await db.from('raw_materials').insert([payload]);
    if (error) return alert("Error: " + error.message);

    try {
      await db.from('accounts_vendors').insert([{ type: 'Expense', title: `RM Purchase: ${name}`, category: 'Raw Materials', amount: cost, status: 'Paid' }]);
    } catch(e){}

    alert("Raw Material saved & Expense synced!");
    document.getElementById('nrm-modal-rm').style.display = 'none';
    loadNirmanData();
  };

  async function loadNirmanData() {
    const db = getActiveDb();
    if (!db) {
      setTimeout(loadNirmanData, 300);
      return;
    }
    try {
      const { data: raw } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
      window.nrmState.raw = raw || [];
      
      const tb = document.getElementById('tbody-raw-materials') || document.getElementById('nrm-tb-raw');
      if (tb) {
        tb.innerHTML = window.nrmState.raw.map(r => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
            <td style="padding:0.5rem;">${r.id}</td>
            <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
            <td style="padding:0.5rem;">${r.category}</td>
            <td style="padding:0.5rem;">${r.stock} ${r.unit}</td>
            <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 0} ${r.unit}</td>
            <td style="padding:0.5rem; color:#10b981;">₹${r.stock > 0 ? (r.purchase_rate / r.stock).toFixed(2) : '0.00'}</td>
            <td style="padding:0.5rem; text-align:center;"><button onclick="if(confirm('Delete?')) getActiveDb().from('raw_materials').delete().eq('id','${r.id}').then(loadNirmanData);" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button></td>
          </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem; color:white;">No raw materials found.</td></tr>';
      }
    } catch (err) {
      console.error("Nirman Load Error:", err);
    }
  }

  window.loadAushadhiNirmanData = loadNirmanData;

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNirmanData);
  } else {
    loadNirmanData();
  }
  window.addEventListener('load', loadNirmanData);
})();

// RESTORE GLOBAL ERP ROUTER (switchTab)
window.switchTab = window.switchTab || function(tabId, element) {
  try {
    // Hide all module containers
    document.querySelectorAll('.module-container, .module-section, [id^="module-"]').forEach(el => {
      el.style.display = 'none';
    });

    // Show target module container
    let target = document.getElementById(tabId) || document.getElementById('module-' + tabId);
    if (target) {
      target.style.display = 'block';
    }

    // Update active sidebar states
    document.querySelectorAll('.sidebar-item, .nav-link, sidebar li').forEach(li => {
      li.classList.remove('active');
    });
    if (element) {
      element.classList.add('active');
    }

    // Trigger specific module loaders if available
    if (tabId === 'aushadhi-nirman' || tabId === '5') {
      if (typeof loadNirmanData === 'function') loadNirmanData();
    }
  } catch (err) {
    console.error("Navigation error:", err);
  }
};
