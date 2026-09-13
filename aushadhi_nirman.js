/**
 * AUSHADHI NIRMAN - BULLETPROOF RENDER ENGINE
 */
(function() {
  window.nrmState = { raw: [], recipes: [], bom: [], activeRecipe: null };

  function getActiveDb() {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') return supabase;
    if (typeof sbClient !== 'undefined' && sbClient && typeof sbClient.from === 'function') return sbClient;
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
    if (window.sbClient && typeof window.sbClient.from === 'function') return window.sbClient;
    return null;
  }

  async function loadNirmanData() {
    const db = getActiveDb();
    if (!db) {
      setTimeout(loadNirmanData, 300);
      return;
    }
    try {
      const { data: raw, error } = await db.from('raw_materials').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Supabase fetch error:", error.message);
        return;
      }
      window.nrmState.raw = raw || [];
      
      // Find table body across any possible ID variation
      let tb = document.getElementById('tbody-raw-materials') || 
               document.getElementById('nrm-tb-raw') || 
               document.querySelector('#module-aushadhi-nirman tbody') ||
               document.querySelector('table tbody');

      if (!tb) {
        // If table body doesn't exist yet, try to find or create the container view
        console.warn("Raw materials table body not found in DOM.");
        return;
      }

      tb.innerHTML = window.nrmState.raw.map(r => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:white;">
          <td style="padding:0.5rem;">${r.id}</td>
          <td style="padding:0.5rem; font-weight:bold;">${r.name}</td>
          <td style="padding:0.5rem;">${r.category}</td>
          <td style="padding:0.5rem;">${r.stock} ${r.unit}</td>
          <td style="padding:0.5rem; color:#f59e0b;">${r.reorder || 0} ${r.unit}</td>
          <td style="padding:0.5rem; color:#10b981;">₹${r.stock > 0 ? (r.purchase_rate / r.stock).toFixed(2) : '0.00'}</td>
          <td style="padding:0.5rem; text-align:center;">
            <button onclick="if(confirm('Delete?')) getActiveDb().from('raw_materials').delete().eq('id','${r.id}').then(loadNirmanData);" style="background:#dc2626; color:white; border:none; padding:0.2rem 0.5rem; border-radius:3px; cursor:pointer;">Del</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1rem; color:white;">No raw materials found in database.</td></tr>';
    } catch (err) {
      console.error("Nirman Load Exception:", err);
    }
  }

  window.loadAushadhiNirmanData = loadNirmanData;

  // Hook into global switchTab so data refreshes instantly when clicking Module 5
  const originalSwitchTab = window.switchTab;
  window.switchTab = function(tabId, element) {
    if (typeof originalSwitchTab === 'function') originalSwitchTab(tabId, element);
    if (tabId === 'aushadhi-nirman' || tabId === '5' || tabId === 'module-aushadhi-nirman') {
      setTimeout(loadNirmanData, 100);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNirmanData);
  } else {
    loadNirmanData();
  }
  window.addEventListener('load', loadNirmanData);
})();
