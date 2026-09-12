with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Inject Payment Collection Modal HTML before </body>
pay_modal_html = '''
  <!-- MODAL: PAYMENT COLLECTOR FOR PENDING LEDGER -->
  <div id="md-pay" class="modal-overlay">
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-header">
        <h3>💰 Collect Outstanding Invoice Payment</h3>
        <button class="modal-close" onclick="closeModal('md-pay')">✕</button>
      </div>
      <form onsubmit="savePayment(event)">
        <input type="hidden" id="pay-bill-id" />
        <div class="form-group" style="margin-bottom:0.5rem;"><label>BILL NO</label><input type="text" id="pay-bill-no" class="form-control" readonly /></div>
        <div class="form-group" style="margin-bottom:0.5rem;"><label>PATIENT NAME</label><input type="text" id="pay-patient-name" class="form-control" readonly /></div>
        <div class="form-grid grid-2" style="margin-bottom:0.5rem;">
          <div><label>TOTAL AMOUNT (₹)</label><input type="text" id="pay-total-amt" class="form-control" readonly /></div>
          <div><label>ALREADY PAID (₹)</label><input type="text" id="pay-already-paid" class="form-control" readonly /></div>
        </div>
        <div class="form-group" style="margin-bottom:0.5rem;"><label>BALANCE DUE (₹)</label><input type="text" id="pay-due-amt" class="form-control" style="color:var(--accent-orange); font-weight:bold;" readonly /></div>
        <div class="form-group" style="margin-bottom:1rem;">
          <label>ENTER PAYMENT AMOUNT TO COLLECT (₹) *</label>
          <input type="number" step="0.01" id="pay-collect-amt" class="form-control" style="font-size:1.1rem; font-weight:bold; color:var(--accent-green);" required />
        </div>
        <button type="submit" class="btn btn-green" style="width:100%; justify-content:center; font-size:1rem;">Confirm & Update Ledger</button>
      </form>
    </div>
  </div>
'''

if 'md-pay' not in html and '</body' in html:
    html = html.replace('</body>', pay_modal_html + '\n</body>')

# 2. Add complete JS functions for opening payment modal, saving payments, and filtering the ledger
js_billing_fix = '''
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
        alert(`✅ Payment of ₹${collectAmt.toFixed(2)} collected!\nBill ${b.bill_no} is fully settled and removed from Pending Payment Ledger.`);
      } else {
        alert(`✅ Partial payment of ₹${collectAmt.toFixed(2)} recorded!\nRemaining Balance Due: ₹${newDue.toFixed(2)}`);
      }

      closeModal('md-pay');
      renderBilling();
      updateDashboardStats();
    }
'''

if 'function openPaymentModal' not in html:
    start_pos = html.find('/* PENDING PAYMENT LEDGER FUNCTIONS */')
    if start_pos != -1:
        html = html[:start_pos] + js_billing_fix + '\n\n    ' + html[start_pos:]
    else:
        html = html.replace('window.onload = init;', js_billing_fix + '\n\n    window.onload = init;')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Central Billing & Pending Payment Ledger functionality successfully repaired.")
