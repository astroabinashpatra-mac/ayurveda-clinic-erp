

    const SUPABASE_URL = "https://apmegpiztygfmltrsgkb.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbWVncGl6dHlnZm1sdHJzZ2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTA5OTksImV4cCI6MjEwNDY4Njk5OX0.kutc4qsOtMgN-7ggRS6ObclwmZWhgihf5snkxbIzlmA";
    let sbClient = null;

    if (window.supabase) {
      try { sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) {}
    }

    let db = {
      patients: [], rx: [], emp: [], billing: [],
      rawMaterials: [
        { id: 'RAW-01', name: 'Til Tailam', category: 'Base Oil/Ghee', unit: 'L', stock: 150, reorder: 25 },
        { id: 'RAW-02', name: 'Swarna- Bhasma', category: 'Minerals', unit: 'g', stock: 100, reorder: 10 }
      ],
      recipes: [
        { id: 'REC-01', name: 'Mahanarayana Thailam', barcode: '8901001', ingredients: JSON.stringify([{ raw_id: 'RAW-01', qty_per_unit: 0.5, unit: 'L' }]) }
      ],
      pharmacy: [
        { id: 'PH-1', barcode: '8901001', name: 'Mahanarayana Thailam', batch_code: 'BATCH-2026-01', expiry: '12/2028', price: 650, stock: 20 }
      ],
      therapies: [{ id: 'TH-1', name: 'Shirodhara', duration_mins: 45, price: 1500, room_type: 'Shirodhara Room' }],
      payroll: [], accounts: [], ipd: []
    };

    let currentWeekOffset = 0;
    let currentRecipeIngredients = [];
    let posCart = [];

    function switchTab(id, el) {
      document.querySelectorAll('.module-section').forEach(e => e.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
      const targetMod = document.getElementById(`mod-${id}`);
      if (targetMod) targetMod.classList.add('active');
      if (el) el.classList.add('active');
    }

    function openModal(id) {
      populateAllAutocompletes();
      document.getElementById(id).style.display = 'flex';
      if (id === 'md-pos') { populatePosMedDropdown(); renderPosCart(); calculatePosTotals(); }
    }

    function closeModal(id) { document.getElementById(id).style.display = 'none'; }

    function toggleLightDarkMode() {
      const html = document.documentElement;
      const cur = html.getAttribute('data-mode') || 'dark';
      html.setAttribute('data-mode', cur === 'dark' ? 'light' : 'dark');
      document.getElementById('mode-toggle-btn').innerText = cur === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }

    function changeTheme(v) { document.documentElement.setAttribute('data-theme', v); }

    function changeWeek(dir) {
      currentWeekOffset += dir;
      renderScheduleGrid();
    }

    
    function populateAllAutocompletes() {
      populateRxPatientDatalist();
      populatePosPatientDatalist();
      populateVendorDatalist();
    }

    /* E-Prescription Desk Autocomplete */
    function populateRxPatientDatalist() {
      const dl = document.getElementById('dl-patients');
      if (!dl) return;
      dl.innerHTML = (db.patients || []).map(p => 
        `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti || 'N/A'}</option>`
      ).join('');
    }

    function onRxPatientSelect() {
      const val = (document.getElementById('rx-p-search')?.value || '').toLowerCase();
      const pat = (db.patients || []).find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        document.getElementById('rx-patient-id').value = pat.id;
        if (document.getElementById('rx-v-mobile')) document.getElementById('rx-v-mobile').value = pat.mobile_no || '';
        if (document.getElementById('rx-v-age')) document.getElementById('rx-v-age').value = pat.age || '';
        if (document.getElementById('rx-v-gender')) document.getElementById('rx-v-gender').value = pat.gender || '';
        if (document.getElementById('rx-v-prakriti')) document.getElementById('rx-v-prakriti').value = pat.prakriti || '';
        if (document.getElementById('rx-v-weight')) document.getElementById('rx-v-weight').value = pat.weight || '';
        if (document.getElementById('rx-v-bp')) document.getElementById('rx-v-bp').value = pat.bp || '120/80';
        if (document.getElementById('rx-v-pulse')) document.getElementById('rx-v-pulse').value = pat.pulse || '72';
      }
    }

    /* Pharmacy POS Registered Patient Autocomplete */
    function populatePosPatientDatalist() {
      const dl = document.getElementById('dl-pos-patients');
      if (!dl) return;
      dl.innerHTML = (db.patients || []).map(p => 
        `<option value="${p.full_name} (${p.mobile_no})">${p.uhid || 'AA-P'} | Age: ${p.age} | ${p.prakriti || 'N/A'}</option>`
      ).join('');
    }

    function onPosPatientSelect() {
      const val = (document.getElementById('pos-p-search')?.value || '').toLowerCase();
      const pat = (db.patients || []).find(p => 
        `${p.full_name} (${p.mobile_no})`.toLowerCase() === val || 
        (p.mobile_no && p.mobile_no === val) || 
        (p.full_name && p.full_name.toLowerCase() === val) ||
        (p.uhid && p.uhid.toLowerCase() === val)
      );

      if (pat) {
        if (document.getElementById('pos-cust-name')) document.getElementById('pos-cust-name').value = pat.full_name;
        if (document.getElementById('pos-cust-mobile')) document.getElementById('pos-cust-mobile').value = pat.mobile_no;
        if (document.getElementById('pos-patient-id')) document.getElementById('pos-patient-id').value = pat.id;
      }
    }

    /* Vendor / Supplier Autocomplete */
    function populateVendorDatalist() {
      const dl = document.getElementById('dl-vendors');
      if (!dl) return;
      const vendors = (db.accounts || []).filter(a => a.entity_type === 'Vendor' || a.entity_type === 'Supplier');
      if (vendors.length > 0) {
        dl.innerHTML = vendors.map(v => `<option value="${v.title}">${v.title} (${v.category || 'Vendor'})</option>`).join('');
      } else {
        dl.innerHTML = '<option value="General Supplier"><option value="Direct Manufacturing / Internal">';
      }
    }


    async function init() {
      if (sbClient) {
        try {
          const { data: p } = await sbClient.from('patients').select('*'); if (p) db.patients = p;
          const { data: rx } = await sbClient.from('prescriptions').select('*'); if (rx) db.rx = rx;
          const { data: rm } = await sbClient.from('raw_materials').select('*'); if (rm && rm.length) db.rawMaterials = rm;
          const { data: rc } = await sbClient.from('master_recipes').select('*'); if (rc && rc.length) db.recipes = rc;
          const { data: ph } = await sbClient.from('pharmacy_stock').select('*'); if (ph && ph.length) db.pharmacy = ph;
          const { data: b } = await sbClient.from('billing').select('*'); if (b) db.billing = b;
          const { data: th } = await sbClient.from('therapies').select('*'); if (th && th.length) db.therapies = th;
          const { data: ip } = await sbClient.from('ipd_beds').select('*'); if (ip && ip.length) db.ipd = ip;
          const { data: pr } = await sbClient.from('payroll').select('*'); if (pr && pr.length) db.payroll = pr;
        } catch(err) {}
      }
      renderAushadhiNirman();
      renderPharmacy();
      renderPatients();
      renderScheduleGrid();
      renderTherapies();
      renderAccounts();
      renderIPD();
      updateDashboardStats();
      populateAllAutocompletes();
    }

    function updateDashboardStats() {
      document.getElementById('st-patients').innerText = db.patients.length;
      document.getElementById('st-rx').innerText = db.rx.length;
      document.getElementById('st-pharmacy').innerText = db.pharmacy.length;
    }

    /* AUSHADHI NIRMAN & PRODUCTION ENGINE */
    function renderAushadhiNirman() {
      const rawTbl = document.getElementById('tbl-raw-mat');
      if (rawTbl) {
        rawTbl.innerHTML = db.rawMaterials.map(r => `
          <tr>
            <td><b>${r.id}</b></td>
            <td><b>${r.name}</b></td>
            <td>${r.category}</td>
            <td><b>${Number(r.stock).toFixed(2)} ${r.unit}</b></td>
            <td>${r.reorder} ${r.unit}</td>
            <td>${r.stock <= r.reorder ? '<span class="badge-low">REORDER</span>' : '<span class="badge-sufficient">SUFFICIENT</span>'}</td>
            <td>
              <button class="btn btn-blue" style="padding:2px 6px;" onclick="editRawMaterial('${r.id}')">Edit</button>
              <button class="btn btn-danger" style="padding:2px 6px;" onclick="delRawMaterial('${r.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      }

      const recTbl = document.getElementById('tbl-recipes');
      if (recTbl) {
        recTbl.innerHTML = db.recipes.map(rc => {
          let ingList = [];
          try { ingList = typeof rc.ingredients === 'string' ? JSON.parse(rc.ingredients) : (rc.ingredients || []); } catch(e){}
          const str = ingList.map(i => `${i.raw_id} (${i.qty_per_unit}${i.unit||''})`).join(', ') || 'N/A';
          return `
            <tr>
              <td><b>${rc.id}</b></td>
              <td><b>${rc.name}</b></td>
              <td><code>${rc.barcode}</code></td>
              <td>${str}</td>
              <td>
                <button class="btn btn-blue" style="padding:2px 6px;" onclick="editMasterRecipe('${rc.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:2px 6px;" onclick="delMasterRecipe('${rc.id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    function openRawMaterialModal() {
      document.getElementById('rm-id').value = '';
      document.getElementById('rm-name').value = '';
      document.getElementById('rm-stock').value = '';
      document.getElementById('rm-reorder').value = '';
      openModal('md-raw-mat');
    }

    function editRawMaterial(id) {
      const rm = db.rawMaterials.find(r => r.id === id); if (!rm) return;
      document.getElementById('rm-id').value = rm.id;
      document.getElementById('rm-name').value = rm.name;
      document.getElementById('rm-stock').value = rm.stock;
      document.getElementById('rm-reorder').value = rm.reorder;
      openModal('md-raw-mat');
    }

    async function saveRawMaterial(e) {
      e.preventDefault();
      const id = document.getElementById('rm-id').value;
      const payload = {
        name: document.getElementById('rm-name').value,
        category: document.getElementById('rm-category').value,
        unit: document.getElementById('rm-unit').value,
        stock: Number(document.getElementById('rm-stock').value) || 0,
        reorder: Number(document.getElementById('rm-reorder').value) || 0
      };
      if (!id) payload.id = 'RAW-0' + (db.rawMaterials.length + 1);

      if (sbClient) {
        if (id) await sbClient.from('raw_materials').update(payload).eq('id', id);
        else await sbClient.from('raw_materials').insert([payload]);
      } else {
        if (id) { const idx = db.rawMaterials.findIndex(r => r.id === id); if (idx !== -1) db.rawMaterials[idx] = { id, ...payload }; }
        else db.rawMaterials.push(payload);
      }
      closeModal('md-raw-mat'); init();
    }

    async function delRawMaterial(id) {
      if (!confirm('Delete item?')) return;
      if (sbClient) await sbClient.from('raw_materials').delete().eq('id', id);
      else db.rawMaterials = db.rawMaterials.filter(r => r.id !== id);
      init();
    }

    function openRecipeModal() {
      document.getElementById('rc-id').value = '';
      document.getElementById('rc-name').value = '';
      document.getElementById('rc-barcode').value = '890' + Math.floor(1000000 + Math.random() * 9000000);
      currentRecipeIngredients = [];
      const sel = document.getElementById('rc-add-raw-id');
      if (sel) sel.innerHTML = db.rawMaterials.map(r => `<option value="${r.id}">${r.id} - ${r.name}</option>`).join('');
      renderRecipeIngredientsTable();
      openModal('md-recipe');
    }

    function addRecipeIngredientRow() {
      const rawId = document.getElementById('rc-add-raw-id').value;
      const qty = Number(document.getElementById('rc-add-qty').value) || 0;
      const raw = db.rawMaterials.find(r => r.id === rawId);
      if (!raw || qty <= 0) return alert('Select material and valid quantity');
      currentRecipeIngredients.push({ raw_id: raw.id, raw_name: raw.name, unit: raw.unit, qty_per_unit: qty });
      renderRecipeIngredientsTable();
    }

    function renderRecipeIngredientsTable() {
      document.getElementById('tbl-rc-ingredients').innerHTML = currentRecipeIngredients.map((i, idx) => `
        <tr><td>${i.raw_id} - ${i.raw_name}</td><td>${i.qty_per_unit} ${i.unit}</td><td><button type="button" onclick="currentRecipeIngredients.splice(${idx},1);renderRecipeIngredientsTable();">✕</button></td></tr>
      `).join('');
    }

    async function saveMasterRecipe(e) {
      e.preventDefault();
      if (!currentRecipeIngredients.length) return alert('Add at least 1 ingredient');
      const id = document.getElementById('rc-id').value;
      const payload = {
        name: document.getElementById('rc-name').value,
        barcode: document.getElementById('rc-barcode').value,
        ingredients: JSON.stringify(currentRecipeIngredients)
      };
      if (!id) payload.id = 'REC-0' + (db.recipes.length + 1);

      if (sbClient) {
        if (id) await sbClient.from('master_recipes').update(payload).eq('id', id);
        else await sbClient.from('master_recipes').insert([payload]);
      } else {
        if (id) { const idx = db.recipes.findIndex(r => r.id === id); if (idx !== -1) db.recipes[idx] = { id, ...payload }; }
        else db.recipes.push(payload);
      }
      closeModal('md-recipe'); init();
    }

    async function delMasterRecipe(id) {
      if (!confirm('Delete recipe?')) return;
      if (sbClient) await sbClient.from('master_recipes').delete().eq('id', id);
      else db.recipes = db.recipes.filter(r => r.id !== id);
      init();
    }

        async function runProductionEngine(e) {
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
          return alert(`Insufficient Stock for Raw Material: ${raw ? raw.name : ing.raw_id}!
Required: ${reqQty}, Available: ${avail}`);
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

      alert(`✅ Production Batch Executed Successfully!
• Produced: ${units} units of ${recipe.name}
• Consumed Raw Materials deducted from inventory.
• Stock transferred to Herbal Pharmacy for sale.`);
      closeModal('md-batch-prod');
      renderAushadhiNirman();
      renderPharmacy();
      updateDashboardStats();
      populateAllAutocompletes();
    }

    /* HERBAL PHARMACY & POS */
    function renderPharmacy() {
      document.getElementById('tbl-pharmacy').innerHTML = db.pharmacy.map(p => `
        <tr>
          <td><code>${p.barcode}</code></td>
          <td><b>${p.name}</b></td>
          <td>${p.batch_code}</td>
          <td>${p.expiry}</td>
          <td>₹${p.price}</td>
          <td><b>${p.stock} units</b></td>
          <td><button class="btn btn-danger" style="padding:2px 6px;" onclick="delPharmacyStock('${p.id||p.barcode}')">Delete</button></td>
        </tr>
      `).join('');
    }

        function populateVendorDropdown() {
      const sel = document.getElementById('ph-vendor-select');
      if (!sel) return;
      const vendors = db.accounts.filter(a => a.entity_type === 'Vendor' || a.entity_type === 'Supplier');
      if (vendors.length > 0) {
        sel.innerHTML = vendors.map(v => `<option value="${v.title}">${v.title}</option>`).join('');
      } else {
        sel.innerHTML = '<option value="General Supplier">General Supplier</option><option value="Direct Manufacturing / Internal">Direct Manufacturing / Internal</option>';
      }
    }

    function openPharmacyStockModal() {
      document.getElementById('ph-item-id').value = '';
      document.getElementById('ph-name').value = '';
      document.getElementById('ph-barcode').value = '890' + Math.floor(1000000 + Math.random() * 9000000);
      document.getElementById('ph-batch').value = 'BATCH-' + new Date().getFullYear() + '-09';
      document.getElementById('ph-expiry').value = '12/2028';
      document.getElementById('ph-purchase-rate').value = '';
      document.getElementById('ph-price').value = '';
      document.getElementById('ph-stock-qty').value = '';
      populateVendorDropdown();
      openModal('md-pharmacy-stock');
    }

    async function savePharmacyStock(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('ph-name').value,
        barcode: document.getElementById('ph-barcode').value,
        batch_code: document.getElementById('ph-batch').value,
        expiry: document.getElementById('ph-expiry').value,
        vendor_name: document.getElementById('ph-vendor-select').value,
        purchase_rate: Number(document.getElementById('ph-purchase-rate').value) || 0,
        price: Number(document.getElementById('ph-price').value) || 0,
        stock: Number(document.getElementById('ph-stock-qty').value) || 0
      };
      if (sbClient) await sbClient.from('pharmacy_stock').insert([payload]);
      else db.pharmacy.unshift(payload);
      closeModal('md-pharmacy-stock'); init();
    }

    async function delPharmacyStock(id) {
      if (!confirm('Delete item?')) return;
      if (sbClient) await sbClient.from('pharmacy_stock').delete().eq('id', id);
      else db.pharmacy = db.pharmacy.filter(p => (p.id !== id && p.barcode !== id));
      init();
    }

        let userEditedPaidAmt = false;

    function populatePosMedDropdown() {
      const sel = document.getElementById('pos-med-select');
      if (!sel) return;
      if (!db.pharmacy || db.pharmacy.length === 0) {
        sel.innerHTML = '<option value="">No stock available in pharmacy</option>';
        return;
      }
      sel.innerHTML = db.pharmacy.map(p => `
        <option value="${p.barcode}">${p.name} (Batch: ${p.batch_code || 'N/A'}) - ₹${p.price} | Stock: ${p.stock}</option>
      `).join('');
    }

    function addPosCartItem() {
      const barcode = document.getElementById('pos-med-select')?.value;
      if (!barcode) return alert('Select a valid medicine item from stock.');

      const med = db.pharmacy.find(p => p.barcode === barcode);
      if (!med) return alert('Selected medicine not found in inventory.');

      const qty = Number(document.getElementById('pos-qty').value) || 1;
      const availStock = Number(med.stock) || 0;

      if (availStock < qty) {
        return alert(`Insufficient Stock! Only ${availStock} units available for ${med.name}.`);
      }

      const existingIdx = posCart.findIndex(c => c.barcode === barcode);
      if (existingIdx !== -1) {
        if (availStock < posCart[existingIdx].qty + qty) {
          return alert(`Cannot add more! Reached total available stock limit (${availStock} units).`);
        }
        posCart[existingIdx].qty += qty;
        posCart[existingIdx].total = posCart[existingIdx].qty * med.price;
      } else {
        posCart.push({
          barcode: med.barcode,
          name: med.name,
          batch_code: med.batch_code || 'N/A',
          price: Number(med.price) || 0,
          qty: qty,
          total: qty * (Number(med.price) || 0)
        });
      }

      userEditedPaidAmt = false;
      renderPosCart();
    }

    function renderPosCart() {
      const tbl = document.getElementById('tbl-pos-cart');
      if (!tbl) return;

      if (posCart.length === 0) {
        tbl.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1rem;">Cart is empty. Select item above and click "+ Add to Bill".</td></tr>';
      } else {
        tbl.innerHTML = posCart.map((item, idx) => `
          <tr>
            <td><b>${item.name}</b></td>
            <td>${item.batch_code}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.qty}</td>
            <td><b>₹${item.total.toFixed(2)}</b></td>
            <td><button type="button" onclick="posCart.splice(${idx},1);userEditedPaidAmt=false;renderPosCart();" style="color:#ef4444; background:none; border:none; cursor:pointer; font-weight:bold;">✕ Remove</button></td>
          </tr>
        `).join('');
      }

      calculatePosTotals();
    }

    function calculatePosTotals() {
      const subtotal = posCart.reduce((acc, c) => acc + c.total, 0);
      const discMode = document.getElementById('pos-disc-type')?.value || 'percent';
      let discVal = Number(document.getElementById('pos-disc-val')?.value) || 0;
      let taxPercent = Number(document.getElementById('pos-tax-percent')?.value) || 0;

      let discAmt = 0;
      let discPct = 0;

      if (discMode === 'percent') {
        discPct = discVal;
        discAmt = (subtotal * discPct) / 100;
      } else {
        discAmt = discVal;
        discPct = subtotal > 0 ? (discAmt / subtotal) * 100 : 0;
      }

      if (discAmt > subtotal) discAmt = subtotal;

      const taxableAmt = subtotal - discAmt;
      const taxAmt = (taxableAmt * taxPercent) / 100;
      const grandTotal = Math.max(0, taxableAmt + taxAmt);

      let paidAmtInput = document.getElementById('pos-paid-amt');
      
      if (!userEditedPaidAmt && paidAmtInput) {
        paidAmtInput.value = grandTotal.toFixed(2);
      }

      let paidAmt = Number(paidAmtInput?.value) || 0;
      const balanceDue = Math.max(0, grandTotal - paidAmt);

      if (document.getElementById('pos-lbl-subtotal')) document.getElementById('pos-lbl-subtotal').innerText = '₹' + subtotal.toFixed(2);
      if (document.getElementById('pos-lbl-discount')) document.getElementById('pos-lbl-discount').innerText = `-₹${discAmt.toFixed(2)} (${discPct.toFixed(1)}%)`;
      if (document.getElementById('pos-lbl-tax')) document.getElementById('pos-lbl-tax').innerText = `+₹${taxAmt.toFixed(2)} (${taxPercent}%)`;
      if (document.getElementById('pos-lbl-grandtotal')) document.getElementById('pos-lbl-grandtotal').innerText = '₹' + grandTotal.toFixed(2);
      if (document.getElementById('pos-lbl-paid')) document.getElementById('pos-lbl-paid').innerText = '₹' + paidAmt.toFixed(2);
      if (document.getElementById('pos-lbl-due')) document.getElementById('pos-lbl-due').innerText = '₹' + balanceDue.toFixed(2);

      return { subtotal, discPct, discAmt, taxPercent, taxAmt, grandTotal, paidAmt, balanceDue };
    }

    async function checkoutPosSale() {
      if (!posCart || posCart.length === 0) {
        return alert('⚠️ CANNOT COMPLETE SALE: Cart is empty!
Select a medicine item from dropdown and click "+ Add to Bill" before completing checkout.');
      }

      const custName = document.getElementById('pos-cust-name')?.value || 'Walk-in Customer';
      const custMobile = document.getElementById('pos-cust-mobile')?.value || 'N/A';
      const patientId = document.getElementById('pos-patient-id')?.value || null;
      const payMode = document.getElementById('pos-pay-mode')?.value || 'Cash';

      const calc = calculatePosTotals();
      const billNo = 'POS-' + Math.floor(100000 + Math.random() * 900000);
      const status = calc.balanceDue === 0 ? 'Paid' : (calc.paidAmt > 0 ? 'Partial' : 'Unpaid');

      // 1. Deduct Stock from Pharmacy Database
      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, Number(med.stock) - item.qty);
          if (sbClient) {
            try { await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode); } catch(e){}
          }
        }
      }

      // 2. Insert Invoice to Billing Ledger
      const billPayload = {
        bill_no: billNo,
        rx_no: 'POS',
        patient_id: patientId,
        patient_name: custName,
        mobile_no: custMobile,
        bill_type: 'POS Retail',
        subtotal: calc.subtotal,
        discount_percent: calc.discPct,
        discount_amount: calc.discAmt,
        tax_percent: calc.taxPercent,
        tax_amount: calc.taxAmt,
        total_amount: calc.grandTotal,
        paid_amount: calc.paidAmt,
        balance_due: calc.balanceDue,
        payment_status: status,
        items: posCart
      };

      if (sbClient) {
        try { await sbClient.from('billing').insert([billPayload]); } catch(e){}
      }

      db.billing.unshift({ 
        ...billPayload, 
        id: 'b-' + Date.now(), 
        created_at: new Date().toISOString(),
        pay_mode: payMode 
      });

      if (confirm(`✅ POS Sale Completed!
• Invoice No: ${billNo}
• Grand Total: ₹${calc.grandTotal.toFixed(2)}
• Paid: ₹${calc.paidAmt.toFixed(2)}

Would you like to PRINT the customer receipt right now?`)) {
        printPosInvoice(billNo);
      }

      posCart = [];
      userEditedPaidAmt = false;
      closeModal('md-pos');
      init();
    }

    function printPosInvoice(billNo) {
      const sale = db.billing.find(b => b.bill_no === billNo);
      if (!sale) return alert('Invoice record not found');

      document.getElementById('pos-pr-billno').innerText = sale.bill_no;
      document.getElementById('pos-pr-custname').innerText = sale.patient_name;
      document.getElementById('pos-pr-date').innerText = sale.created_at ? new Date(sale.created_at).toLocaleDateString() : new Date().toLocaleDateString();
      document.getElementById('pos-pr-mobile').innerText = sale.mobile_no || 'N/A';

      let items = sale.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch(e) { items = []; }
      }
      items = items || [];

      let html = items.map((i, idx) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 6px;">${idx + 1}</td>
          <td style="padding: 6px;"><b>${i.name}</b></td>
          <td style="padding: 6px;">${i.batch_code || '-'}</td>
          <td style="padding: 6px;">₹${Number(i.price).toFixed(2)}</td>
          <td style="padding: 6px;">${i.qty}</td>
          <td style="padding: 6px; text-align:right;">₹${Number(i.total).toFixed(2)}</td>
        </tr>
      `).join('');

      if (items.length === 0) {
        html = `<tr><td colspan="6" style="padding:10px; text-align:center;">Herbal Medicines Purchase</td></tr>`;
      }

      // Append summary breakdown rows
      const sub = Number(sale.subtotal || sale.total_amount || 0);
      const disc = Number(sale.discount_amount || 0);
      const tax = Number(sale.tax_amount || 0);
      const grand = Number(sale.total_amount || 0);
      const paid = Number(sale.paid_amount || 0);
      const due = Number(sale.balance_due || 0);

      html += `
        <tr style="border-top: 2px solid #000;"><td colspan="5" style="padding:4px; text-align:right;">Subtotal:</td><td style="padding:4px; text-align:right;">₹${sub.toFixed(2)}</td></tr>
        ${disc > 0 ? `<tr><td colspan="5" style="padding:4px; text-align:right;">Discount:</td><td style="padding:4px; text-align:right;">-₹${disc.toFixed(2)}</td></tr>` : ''}
        ${tax > 0 ? `<tr><td colspan="5" style="padding:4px; text-align:right;">Tax (GST):</td><td style="padding:4px; text-align:right;">+₹${tax.toFixed(2)}</td></tr>` : ''}
        <tr style="font-weight:bold; font-size:1.05rem;"><td colspan="5" style="padding:6px; text-align:right;">Grand Total:</td><td style="padding:6px; text-align:right;">₹${grand.toFixed(2)}</td></tr>
        <tr><td colspan="5" style="padding:4px; text-align:right;">Amount Paid:</td><td style="padding:4px; text-align:right; color:green;">₹${paid.toFixed(2)}</td></tr>
        ${due > 0 ? `<tr style="font-weight:bold; color:red;"><td colspan="5" style="padding:4px; text-align:right;">Balance Due:</td><td style="padding:4px; text-align:right;">₹${due.toFixed(2)}</td></tr>` : ''}
      `;

      document.getElementById('pos-pr-tbl-body').innerHTML = html;
      document.getElementById('pos-pr-total').innerText = '₹' + grand.toFixed(2);

      const printArea = document.getElementById('print-pos-sheet');
      printArea.style.display = 'block';
      window.print();
      printArea.style.display = 'none';
    }

    function whatsappPosInvoice(billNo) {
      const sale = db.billing.find(b => b.bill_no === billNo);
      if (!sale) return alert('Bill record not found');
      if (!sale.mobile_no || sale.mobile_no === 'N/A') return alert('Customer mobile number is missing');

      let msg = `💊 *AASU AROGYAM HERBAL PHARMACY* 💊%0A`;
      msg += `*Retail Cash Memo Invoice*%0A%0A`;
      msg += `*Bill No:* ${sale.bill_no}%0A`;
      msg += `*Customer Name:* ${sale.patient_name}%0A`;
      msg += `*Total Paid:* ₹${sale.total_amount}%0A%0A`;
      msg += `*Items Purchased:*%0A`;

      if (sale.items && sale.items.length) {
        sale.items.forEach(i => {
          msg += `• ${i.name} (Qty: ${i.qty}) - ₹${i.total}%0A`;
        });
      }

      msg += `%0A_Thank you for your visit! Wish you good health._ 🙏`;
      window.open(`https://api.whatsapp.com/send?phone=91${sale.mobile_no}&text=${msg}`);
    }


    async function checkoutPosSale() {
      if (!posCart.length) return alert('Cart empty');
      const custName = document.getElementById('pos-cust-name')?.value || 'Walk-in Customer';
      const custMobile = document.getElementById('pos-cust-mobile')?.value || 'N/A';
      const payMode = document.getElementById('pos-pay-mode')?.value || 'Cash';
      const grandTotal = posCart.reduce((a,c) => a + c.total, 0);
      const billNo = 'POS-' + Math.floor(100000 + Math.random() * 900000);

      for (let item of posCart) {
        const med = db.pharmacy.find(p => p.barcode === item.barcode);
        if (med) {
          med.stock = Math.max(0, med.stock - item.qty);
          if (sbClient) await sbClient.from('pharmacy_stock').update({ stock: med.stock }).eq('barcode', item.barcode);
        }
      }

      const billPayload = {
        bill_no: billNo,
        rx_no: 'POS',
        patient_name: custName,
        mobile_no: custMobile,
        bill_type: 'POS Retail',
        total_amount: grandTotal,
        paid_amount: grandTotal,
        balance_due: 0,
        payment_status: 'Paid',
        items: posCart
      };

      if (sbClient) {
        try { await sbClient.from('billing').insert([billPayload]); } catch(e){}
      }
      db.billing.unshift({ ...billPayload, created_at: new Date().toISOString(), pay_mode: payMode });

      if (confirm(`✅ POS Sale Completed!
Bill No: ${billNo}
Total: ₹${grandTotal}

Would you like to PRINT the customer receipt right now?`)) {
        printPosInvoice(billNo);
      }

      posCart = [];
      closeModal('md-pos');
      init();
    }

    /* SCHEDULE */
        function renderScheduleGrid() {
      const grid = document.getElementById('sch-week-grid');
      if (!grid) return;

      // 1. Calculate dynamic dates for Sun-Sat based on currentWeekOffset
      const today = new Date(2026, 8, 12); // Sep 12, 2026 reference
      const currentSunday = new Date(today);
      currentSunday.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));

      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentSunday);
        d.setDate(currentSunday.getDate() + i);
        days.push({
          label: `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
          dateStr: d.toISOString().split('T')[0]
        });
      }

      // 2. Full 8:00 AM to 8:00 PM slots (45-min sessions with 15-min gap)
      const slots = [
        "08:00 - 08:45",
        "09:00 - 09:45",
        "10:00 - 10:45",
        "11:00 - 11:45",
        "12:00 - 12:45",
        "13:00 - 13:45",
        "13:45 - 14:45", // Lunch Break
        "15:00 - 15:45",
        "16:00 - 16:45",
        "17:00 - 17:45",
        "18:00 - 18:45",
        "19:00 - 19:45"
      ];

      let html = `<div class="sch-header-cell">Time</div>`;
      days.forEach(d => { html += `<div class="sch-header-cell">${d.label}</div>`; });

      slots.forEach(slot => {
        const isLunch = slot === "13:45 - 14:45";
        html += `<div class="sch-time-cell">${slot}</div>`;

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          if (isLunch) {
            html += `<div class="sch-slot-cell sch-lunch-cell">🍱 LUNCH BREAK</div>`;
          } else {
            const res = (db.reservations || []).find(r => r.day_date === days[dayIdx].dateStr && r.time_slot === slot);
            if (res) {
              html += `<div class="sch-slot-cell" onclick="alert('Booked for ${res.patient_name} (${res.room_name})')"><div class="sch-booking-card"><div>${res.patient_name}</div><div style="font-size:0.6rem; opacity:0.8;">${res.room_name}</div></div></div>`;
            } else {
              html += `<div class="sch-slot-cell" onclick="openReservationModal('${slot}', '${days[dayIdx].dateStr}')"></div>`;
            }
          }
        }
      });

      grid.innerHTML = html;

      // Update Header Week Label
      const endSaturday = new Date(currentSunday);
      endSaturday.setDate(currentSunday.getDate() + 6);
      const weekNum = 37 + currentWeekOffset;
      const labelEl = document.getElementById('sch-week-label');
      if (labelEl) {
        labelEl.innerText = `Week ${weekNum} (${monthNames[currentSunday.getMonth()]} ${currentSunday.getFullYear()})`;
      }
    }

    /* PATIENTS */
    function renderPatients() {
      document.getElementById('tbl-patients').innerHTML = db.patients.map(p => `
        <tr><td><b>${p.uhid||'AA-101'}</b></td><td>${p.full_name}</td><td>${p.mobile_no}</td><td>${p.age}/${p.gender}</td><td>${p.prakriti}</td><td>${p.weight}kg</td><td><button class="btn btn-danger" style="padding:2px 6px;" onclick="delPatient('${p.id}')">Delete</button></td></tr>
      `).join('');
    }

    async function savePatient(e) {
      e.preventDefault();
      const payload = { full_name: document.getElementById('p-name').value, mobile_no: document.getElementById('p-mobile').value, age: document.getElementById('p-age').value, gender: document.getElementById('p-gender').value, prakriti: document.getElementById('p-prakriti').value, weight: document.getElementById('p-weight').value, uhid: 'AA-P-' + Math.floor(1000 + Math.random()*9000) };
      if (sbClient) await sbClient.from('patients').insert([payload]);
      else db.patients.unshift(payload);
      closeModal('md-patient'); init();
    }

    async function delPatient(id) {
      if (!confirm('Delete patient?')) return;
      if (sbClient) await sbClient.from('patients').delete().eq('id', id);
      else db.patients = db.patients.filter(p => p.id !== id);
      init();
    }

    /* THERAPIES, ACCOUNTS, IPD */
    function renderTherapies() {
      document.getElementById('tbl-therapies').innerHTML = db.therapies.map(t => `
        <tr><td><b>${t.id}</b></td><td><b>${t.name}</b></td><td>${t.duration_mins} mins</td><td>₹${t.price}</td><td>${t.room_type||'Standard Room'}</td><td><button class="btn btn-danger" style="padding:2px 6px;" onclick="delTherapy('${t.id}')">Delete</button></td></tr>
      `).join('');
    }

    async function saveTherapy(e) {
      e.preventDefault();
      const payload = { name: document.getElementById('th-name').value, duration_mins: Number(document.getElementById('th-dur').value), price: Number(document.getElementById('th-price').value) };
      if (sbClient) await sbClient.from('therapies').insert([payload]);
      else db.therapies.push(payload);
      closeModal('md-therapy-add'); init();
    }

    async function delTherapy(id) {
      if (sbClient) await sbClient.from('therapies').delete().eq('id', id);
      else db.therapies = db.therapies.filter(t => t.id !== id);
      init();
    }

    function renderAccounts() {
      document.getElementById('tbl-accounts').innerHTML = db.accounts.map(a => `
        <tr><td>${a.entity_type}</td><td><b>${a.title}</b></td><td>General</td><td>₹${a.amount}</td><td>Settled</td></tr>
      `).join('');
    }

    async function saveAccounts(e) {
      e.preventDefault();
      const payload = { entity_type: document.getElementById('acc-type').value, title: document.getElementById('acc-title').value, amount: Number(document.getElementById('acc-amt').value) };
      if (sbClient) await sbClient.from('accounts_vendors').insert([payload]);
      else db.accounts.push(payload);
      closeModal('md-acc-add'); init();
    }

    function renderIPD() {
      document.getElementById('tbl-ipd').innerHTML = db.ipd.map(i => `
        <tr><td><b>${i.bed_no}</b></td><td>General Ward</td><td>${i.patient_name}</td><td>2026-09-12</td><td>₹${i.daily_charge}</td><td>Occupied</td></tr>
      `).join('');
    }

    async function saveIPDBed(e) {
      e.preventDefault();
      const payload = { bed_no: document.getElementById('ipd-bed').value, patient_name: document.getElementById('ipd-pname').value, daily_charge: Number(document.getElementById('ipd-rate').value) };
      if (sbClient) await sbClient.from('ipd_beds').insert([payload]);
      else db.ipd.push(payload);
      closeModal('md-ipd-add'); init();
    }

    
    function openPaymentModal(id) {
      const b = db.billing.find(x => x.id === id || x.bill_no === id);
      if (!b) return alert('Invoice record not found in ledger');
      
      document.getElementById('pay-bill-id').value = b.id || b.bill_no;
      document.getElementById('pay-bill-no').value = b.bill_no;
      document.getElementById('pay-patient-name').value = b.patient_name;
      document.getElementById('pay-total-amt').value = Number(b.total_amount || 0).toFixed(2);
      document.getElementById('pay-already-paid').value = Number(b.paid_amount || 0).toFixed(2);
      
      const due = Number(b.balance_due || 0);
      document.getElementById('pay-due-amt').value = due.toFixed(2);
      document.getElementById('pay-collect-amt').value = due.toFixed(2);
      
      openModal('md-pay');
    }

    async function savePayment(e) {
      e.preventDefault();
      const id = document.getElementById('pay-bill-id').value;
      const b = db.billing.find(x => x.id === id || x.bill_no === id);
      if (!b) return alert('Bill record not found');

      const collectAmt = Number(document.getElementById('pay-collect-amt').value) || 0;
      if (collectAmt <= 0) return alert('Enter a valid payment amount');

      const oldPaid = Number(b.paid_amount) || 0;
      const oldDue = Number(b.balance_due) || 0;

      if (collectAmt > oldDue + 0.01) return alert(`Payment cannot exceed current balance due of ₹${oldDue.toFixed(2)}`);

      const newPaid = oldPaid + collectAmt;
      const newDue = Math.max(0, oldDue - collectAmt);
      const newStatus = newDue === 0 ? 'Paid' : 'Partial';

      b.paid_amount = newPaid;
      b.balance_due = newDue;
      b.payment_status = newStatus;

      if (sbClient) {
        try {
          await sbClient.from('billing').update({ 
            paid_amount: newPaid, 
            balance_due: newDue, 
            payment_status: newStatus 
          }).eq('bill_no', b.bill_no);
        } catch(err) { console.error('Supabase update error:', err); }
      }

      if (newDue === 0) {
        alert(`✅ Payment of ₹${collectAmt.toFixed(2)} collected!
Bill ${b.bill_no} is fully settled and removed from Pending Payment Ledger.`);
      } else {
        alert(`✅ Partial payment of ₹${collectAmt.toFixed(2)} recorded!
Remaining Balance Due: ₹${newDue.toFixed(2)}`);
      }

      closeModal('md-pay');
      renderBilling();
      updateDashboardStats();
      populateAllAutocompletes();
    }


    window.onload = init;
  