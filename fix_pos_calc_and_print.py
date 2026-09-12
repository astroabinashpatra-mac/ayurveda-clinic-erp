with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update CSS @media print rules so print sheets never print blank
old_css_print = '''    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden; }
      #print-rx-sheet, #print-rx-sheet * { visibility: visible; }
      #print-rx-sheet { display: block !important; position: absolute; left: 0; top: 0; width: 100%; color: #000 !important; background: #fff !important; padding: 15mm !important; }
      #sidebar, #main-content, .modal-overlay { display: none !important; }
    }'''

new_css_print = '''    @media print {
      @page { size: A4 portrait; margin: 10mm; }
      body * { visibility: hidden !important; }
      #print-rx-sheet, #print-rx-sheet *, 
      #print-pos-sheet, #print-pos-sheet *, 
      #print-payroll-sheet, #print-payroll-sheet * { 
        visibility: visible !important; 
      }
      #print-pos-sheet { 
        display: block !important; 
        position: absolute !important; 
        left: 0 !important; 
        top: 0 !important; 
        width: 100% !important; 
        color: #000 !important; 
        background: #fff !important; 
        font-family: Arial, sans-serif !important;
        padding: 10mm !important;
        z-index: 999999 !important;
      }
      #sidebar, #main-content, .modal-overlay { display: none !important; }
    }'''

if old_css_print in html:
    html = html.replace(old_css_print, new_css_print)

# 2. Complete POS Cart, Calculation, Validation & Printing JavaScript Engine
pos_engine_fix = '''    let userEditedPaidAmt = false;

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
        return alert('⚠️ CANNOT COMPLETE SALE: Cart is empty!\nSelect a medicine item from dropdown and click "+ Add to Bill" before completing checkout.');
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

      if (confirm(`✅ POS Sale Completed!\n• Invoice No: ${billNo}\n• Grand Total: ₹${calc.grandTotal.toFixed(2)}\n• Paid: ₹${calc.paidAmt.toFixed(2)}\n\nWould you like to PRINT the customer receipt right now?`)) {
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
    }'''

if 'function populatePosMedDropdown()' in html:
    start_pos = html.find('function populatePosMedDropdown()')
    end_pos = html.find('function whatsappPosInvoice(billNo)')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + pos_engine_fix + '\n\n    ' + html[end_pos:]

# Hook manual change listener for pos-paid-amt
if "id=\"pos-paid-amt\"" in html:
    html = html.replace(
        "id=\"pos-paid-amt\"",
        "id=\"pos-paid-amt\" oninput=\"userEditedPaidAmt=true; calculatePosTotals();\""
    )

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("POS calculation engine, cart verification, and invoice print template fully patched.")
