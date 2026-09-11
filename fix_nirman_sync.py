with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update renderAushadhiNirman to parse and display multi-ingredients cleanly in the table
old_render_aushadhi = '''    function renderAushadhiNirman() {
      const rawTbl = document.getElementById('tbl-raw-mat');
      if (rawTbl) {
        rawTbl.innerHTML = db.rawMaterials.map(r => {
          const stockNum = Number(r.stock) || 0;
          const reorderNum = Number(r.reorder) || 0;
          const isLow = stockNum <= reorderNum;
          const badge = isLow ? `<span class="badge-low">REORDER NEEDED</span>` : `<span class="badge-sufficient">SUFFICIENT</span>`;
          return `
            <tr>
              <td><b>${r.id}</b></td>
              <td><b>${r.name}</b></td>
              <td><span class="tab-btn" style="padding:2px 6px; font-size:0.65rem;">${r.category}</span></td>
              <td><b>${stockNum.toFixed(2)} ${r.unit}</b></td>
              <td>${reorderNum} ${r.unit}</td>
              <td>${badge}</td>
              <td>
                <button class="btn btn-blue" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editRawMaterial('${r.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="delRawMaterial('${r.id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colSpan="7">No raw materials registered.</td></tr>';
      }

      const recTbl = document.getElementById('tbl-recipes');
      if (recTbl) {
        recTbl.innerHTML = db.recipes.map(rc => {
          const raw = db.rawMaterials.find(x => x.id === rc.raw_req_id);
          const ingredientStr = raw ? `${raw.id} (${rc.req_qty_per_unit}${raw.unit})` : `${rc.raw_req_id || 'Raw Ingredients'}`;
          return `
            <tr>
              <td><b>${rc.id}</b></td>
              <td><b>${rc.name}</b></td>
              <td><code>${rc.barcode}</code></td>
              <td>${ingredientStr}</td>
              <td>
                <button class="btn btn-blue" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editMasterRecipe('${rc.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="delMasterRecipe('${rc.id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colSpan="5">No master recipes registered.</td></tr>';
      }
    }'''

new_render_aushadhi = '''    function renderAushadhiNirman() {
      const rawTbl = document.getElementById('tbl-raw-mat');
      if (rawTbl) {
        rawTbl.innerHTML = db.rawMaterials.map(r => {
          const stockNum = Number(r.stock) || 0;
          const reorderNum = Number(r.reorder) || 0;
          const isLow = stockNum <= reorderNum;
          const badge = isLow ? `<span class="badge-low">REORDER NEEDED</span>` : `<span class="badge-sufficient">SUFFICIENT</span>`;
          return `
            <tr>
              <td><b>${r.id}</b></td>
              <td><b>${r.name}</b></td>
              <td><span class="tab-btn" style="padding:2px 6px; font-size:0.65rem;">${r.category}</span></td>
              <td><b>${stockNum.toFixed(2)} ${r.unit}</b></td>
              <td>${reorderNum} ${r.unit}</td>
              <td>${badge}</td>
              <td>
                <button class="btn btn-blue" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editRawMaterial('${r.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="delRawMaterial('${r.id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colSpan="7">No raw materials registered.</td></tr>';
      }

      const recTbl = document.getElementById('tbl-recipes');
      if (recTbl) {
        recTbl.innerHTML = db.recipes.map(rc => {
          let ingredientStr = '';
          let ingList = [];
          try {
            ingList = typeof rc.ingredients === 'string' ? JSON.parse(rc.ingredients) : (rc.ingredients || []);
          } catch(e) { ingList = []; }

          if (ingList.length > 0) {
            ingredientStr = ingList.map(i => `${i.raw_id} (${i.qty_per_unit} ${i.unit || ''})`).join(', ');
          } else if (rc.raw_req_id) {
            const raw = db.rawMaterials.find(x => x.id === rc.raw_req_id);
            ingredientStr = raw ? `${raw.id} (${rc.req_qty_per_unit}${raw.unit})` : `${rc.raw_req_id} (${rc.req_qty_per_unit})`;
          } else {
            ingredientStr = 'None';
          }

          return `
            <tr>
              <td><b>${rc.id}</b></td>
              <td><b>${rc.name}</b></td>
              <td><code>${rc.barcode || 'N/A'}</code></td>
              <td><b>${ingredientStr}</b></td>
              <td>
                <button class="btn btn-blue" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="editMasterRecipe('${rc.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="delMasterRecipe('${rc.id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colSpan="5">No master recipes registered.</td></tr>';
      }
    }'''

if old_render_aushadhi in html:
    html = html.replace(old_render_aushadhi, new_render_aushadhi)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Aushadhi Nirman sync and recipe rendering fixed.")
