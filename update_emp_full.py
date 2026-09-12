with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Employee Directory Table Header to match full profile columns
old_emp_table = '''      <table class="data-table">
        <thead><tr><th>EMP ID</th><th>NAME</th><th>ROLE</th><th>MOBILE</th><th>SALARY</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody id="tbl-emp"></tbody>
      </table>'''

new_emp_table = '''      <table class="data-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Full Name</th>
            <th>Role & Dept</th>
            <th>Contact</th>
            <th>Banking / UPI</th>
            <th>Base Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-emp"></tbody>
      </table>'''

if old_emp_table in html:
    html = html.replace(old_emp_table, new_emp_table)

# 2. Replace Employee Modal with Complete 4-Section Onboarding Form
old_emp_modal = '''  <div id="md-emp" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header"><h3>Onboard New Employee</h3><button class="modal-close" onclick="closeModal('md-emp')">✕</button></div>
      <form id="form-emp" onsubmit="saveEmployee(event)">
        <div class="form-grid grid-3">
          <div class="form-group"><label>FIRST NAME *</label><input type="text" id="e-fname" class="form-control" required /></div>
          <div class="form-group"><label>MIDDLE NAME</label><input type="text" id="e-mname" class="form-control" /></div>
          <div class="form-group"><label>LAST NAME *</label><input type="text" id="e-lname" class="form-control" required /></div>
        </div>
        <div class="form-grid grid-3">
          <div class="form-group"><label>PERSONAL MOBILE NUMBER *</label><input type="text" maxlength="10" id="e-mobile" class="form-control" required /></div>
          <div class="form-group"><label>JOB TITLE *</label><input type="text" id="e-title" class="form-control" required /></div>
          <div class="form-group"><label>MONTHLY BASE SALARY (₹) *</label><input type="number" id="e-salary" class="form-control" required /></div>
        </div>
        <div style="text-align: right; margin-top: 1rem;"><button type="submit" class="btn btn-orange">Save Employee Record</button></div>
      </form>
    </div>
  </div>'''

new_emp_modal = '''  <!-- FULL 4-SECTION EMPLOYEE ONBOARDING MODAL -->
  <div id="md-emp" class="modal-overlay">
    <div class="modal-container" style="max-width: 920px;">
      <div class="modal-header">
        <h3 id="title-emp-modal">👤 Complete Employee Onboarding Registration</h3>
        <button class="modal-close" onclick="closeModal('md-emp')">✕</button>
      </div>
      <form id="form-emp" onsubmit="saveEmployee(event)">
        <input type="hidden" id="e-db-id" />

        <!-- SECTION 1: PERSONAL INFORMATION -->
        <div style="background:var(--bg-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:1rem;">
          <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.75rem;">1. Personal Information</span>
          <div class="form-grid grid-3">
            <div class="form-group"><label>FIRST NAME *</label><input type="text" id="e-fname" class="form-control" placeholder="e.g. Ramesh" required /></div>
            <div class="form-group"><label>MIDDLE NAME</label><input type="text" id="e-mname" class="form-control" placeholder="e.g. Kumar" /></div>
            <div class="form-group"><label>LAST NAME *</label><input type="text" id="e-lname" class="form-control" placeholder="e.g. Sharma" required /></div>
          </div>
          <div class="form-grid grid-3">
            <div class="form-group"><label>DATE OF BIRTH *</label><input type="date" id="e-dob" class="form-control" required /></div>
            <div class="form-group">
              <label>GOVERNMENT ID TYPE *</label>
              <select id="e-govtid-type" class="form-control">
                <option>PAN & Aadhaar (India)</option>
                <option>Passport</option>
                <option>Voter ID</option>
              </select>
            </div>
            <div class="form-group"><label>TAX ID / PAN NUMBER</label><input type="text" id="e-pan" class="form-control" placeholder="e.g. ABCDE1234F" /></div>
          </div>
          <div class="form-grid grid-2">
            <div class="form-group">
              <label>GENDER *</label>
              <select id="e-gender" class="form-control">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>MARITAL STATUS *</label>
              <select id="e-marital" class="form-control">
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECTION 2: CONTACT DETAILS -->
        <div style="background:var(--bg-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:1rem;">
          <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.75rem;">2. Contact Details</span>
          <div class="form-grid grid-2">
            <div class="form-group"><label>PERSONAL MOBILE NUMBER *</label><input type="text" id="e-mobile" maxlength="10" class="form-control" placeholder="10-digit mobile" required /></div>
            <div class="form-group"><label>PERSONAL EMAIL ADDRESS</label><input type="email" id="e-pemail" class="form-control" placeholder="personal@email.com" /></div>
          </div>
          <div class="form-grid grid-2">
            <div class="form-group"><label>CURRENT RESIDENTIAL ADDRESS</label><input type="text" id="e-caddr" class="form-control" placeholder="Full residential street address..." /></div>
            <div class="form-group"><label>PERMANENT ADDRESS</label><input type="text" id="e-paddr" class="form-control" placeholder="Permanent address if different..." /></div>
          </div>
        </div>

        <!-- SECTION 3: EMPLOYMENT & JOB DETAILS -->
        <div style="background:var(--bg-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:1rem;">
          <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.75rem;">3. Employment & Job Details</span>
          <div class="form-grid grid-3">
            <div class="form-group"><label>JOB TITLE *</label><input type="text" id="e-title" class="form-control" placeholder="e.g. Senior Panchakarma Vaidya" required /></div>
            <div class="form-group">
              <label>DEPARTMENT *</label>
              <select id="e-dept" class="form-control">
                <option>Consultation & Panchakarma</option>
                <option>Pharmacy & Store</option>
                <option>Therapist Team</option>
                <option>Reception & Billing</option>
                <option>Administration</option>
              </select>
            </div>
            <div class="form-group"><label>JOINING / HIRE DATE *</label><input type="date" id="e-jdate" class="form-control" required /></div>
          </div>
          <div class="form-grid grid-3">
            <div class="form-group"><label>WORK EMAIL / EMPLOYEE ID</label><input type="text" id="e-wemail" class="form-control" placeholder="ramesh@ayurcare.com" /></div>
            <div class="form-group">
              <label>SYSTEM ROLE ACCESS *</label>
              <select id="e-role" class="form-control">
                <option value="Doctor (Vaidya)">Doctor (Vaidya)</option>
                <option value="Therapist">Therapist</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>SHIFT TIMING *</label>
              <select id="e-shift" class="form-control">
                <option>Morning (8:00 AM - 4:00 PM)</option>
                <option>Evening (12:00 PM - 8:00 PM)</option>
                <option>Full Day Shift</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECTION 4: PAYROLL, FINANCIAL INFO & CREDENTIALS -->
        <div style="background:var(--bg-dark); padding:1rem; border-radius:8px; border:1px solid var(--border-dark); margin-bottom:1.25rem;">
          <span style="font-size:0.75rem; font-weight:bold; color:var(--accent-orange); display:block; margin-bottom:0.75rem;">4. Payroll, Financial Info & Portal Credentials</span>
          <div class="form-grid grid-3">
            <div class="form-group"><label>BANK NAME</label><input type="text" id="e-bank" class="form-control" placeholder="e.g. State Bank of India" /></div>
            <div class="form-group"><label>ACCOUNT NUMBER</label><input type="text" id="e-accno" class="form-control" placeholder="Direct deposit account #" /></div>
            <div class="form-group"><label>IFSC / ROUTING CODE</label><input type="text" id="e-ifsc" class="form-control" placeholder="e.g. SBIN0001020" /></div>
          </div>
          <div class="form-grid grid-3">
            <div class="form-group"><label>UPI ID</label><input type="text" id="e-upi" class="form-control" placeholder="e.g. user@upi" /></div>
            <div class="form-group"><label>MONTHLY BASE SALARY (₹) *</label><input type="number" id="e-salary" class="form-control" placeholder="50000" required /></div>
            <div class="form-group"><label>PORTAL ACCOUNT PASSWORD</label><input type="password" id="e-password" class="form-control" placeholder="Initial system password" /></div>
          </div>
        </div>

        <button type="submit" class="btn btn-orange" style="width:100%; justify-content:center; font-size:0.95rem;">Save Complete Employee Record</button>
      </form>
    </div>
  </div>'''

if old_emp_modal in html:
    html = html.replace(old_emp_modal, new_emp_modal)

# 3. Update JavaScript Functions to Load, Save, Edit and Render Full Employee Records
js_emp_functions = '''    function renderEmployees() {
      const tbl = document.getElementById('tbl-emp');
      if (!tbl) return;

      tbl.innerHTML = db.emp.map(e => `
        <tr>
          <td><b>${e.emp_id || 'EMP-001'}</b></td>
          <td><b>${e.first_name || ''} ${e.middle_name || ''} ${e.last_name || ''}</b></td>
          <td>${e.job_title || e.system_role || 'Staff'} (${e.department || 'General'})</td>
          <td>${e.personal_mobile || 'N/A'}<br/><span style="font-size:0.7rem; color:var(--text-muted);">${e.personal_email || ''}</span></td>
          <td><span style="font-size:0.75rem;">UPI: ${e.upi_id || 'N/A'}<br/>Acc: ${e.account_number || 'N/A'}</span></td>
          <td><b>₹${Number(e.monthly_base_salary || 0).toLocaleString('en-IN')}</b></td>
          <td><span style="color:#10b981; font-weight:bold;">${e.status || 'Active'}</span></td>
          <td>
            <button class="btn btn-blue" style="padding:2px 8px; font-size:0.75rem;" onclick="editEmployee('${e.id}')">Edit</button>
            <button class="btn btn-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="delEmp('${e.id}')">Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="8" style="text-align:center;">No employee records registered. Click "+ Onboard Employee".</td></tr>';
    }

    function openEmployeeModal() {
      document.getElementById('form-emp').reset();
      document.getElementById('e-db-id').value = '';
      document.getElementById('e-jdate').value = new Date().toISOString().split('T')[0];
      document.getElementById('title-emp-modal').innerText = '👤 Complete Employee Onboarding Registration';
      openModal('md-emp');
    }

    function editEmployee(id) {
      const e = db.emp.find(x => x.id === id); if (!e) return;
      document.getElementById('e-db-id').value = e.id;
      document.getElementById('e-fname').value = e.first_name || '';
      document.getElementById('e-mname').value = e.middle_name || '';
      document.getElementById('e-lname').value = e.last_name || '';
      document.getElementById('e-dob').value = e.dob || '';
      if (e.govt_id_type) document.getElementById('e-govtid-type').value = e.govt_id_type;
      document.getElementById('e-pan').value = e.tax_id_pan || '';
      if (e.gender) document.getElementById('e-gender').value = e.gender;
      if (e.marital_status) document.getElementById('e-marital').value = e.marital_status;
      document.getElementById('e-mobile').value = e.personal_mobile || '';
      document.getElementById('e-pemail').value = e.personal_email || '';
      document.getElementById('e-caddr').value = e.current_address || '';
      document.getElementById('e-paddr').value = e.permanent_address || '';
      document.getElementById('e-title').value = e.job_title || '';
      if (e.department) document.getElementById('e-dept').value = e.department;
      document.getElementById('e-jdate').value = e.joining_date || '';
      document.getElementById('e-wemail').value = e.work_email || '';
      if (e.system_role) document.getElementById('e-role').value = e.system_role;
      if (e.shift_timing) document.getElementById('e-shift').value = e.shift_timing;
      document.getElementById('e-bank').value = e.bank_name || '';
      document.getElementById('e-accno').value = e.account_number || '';
      document.getElementById('e-ifsc').value = e.ifsc_code || '';
      document.getElementById('e-upi').value = e.upi_id || '';
      document.getElementById('e-salary').value = e.monthly_base_salary || '';
      document.getElementById('e-password').value = e.portal_password || '';
      document.getElementById('title-emp-modal').innerText = '✏️ Edit Employee Profile';
      openModal('md-emp');
    }

    async function saveEmployee(e) {
      e.preventDefault();
      const dbId = document.getElementById('e-db-id').value;
      const empId = 'EMP-' + Math.floor(100 + Math.random() * 900);

      const payload = {
        emp_id: dbId ? (db.emp.find(x=>x.id===dbId)?.emp_id || empId) : empId,
        first_name: document.getElementById('e-fname').value,
        middle_name: document.getElementById('e-mname').value,
        last_name: document.getElementById('e-lname').value,
        dob: document.getElementById('e-dob').value,
        govt_id_type: document.getElementById('e-govtid-type').value,
        tax_id_pan: document.getElementById('e-pan').value,
        gender: document.getElementById('e-gender').value,
        marital_status: document.getElementById('e-marital').value,
        personal_mobile: document.getElementById('e-mobile').value,
        personal_email: document.getElementById('e-pemail').value,
        current_address: document.getElementById('e-caddr').value,
        permanent_address: document.getElementById('e-paddr').value,
        job_title: document.getElementById('e-title').value,
        department: document.getElementById('e-dept').value,
        joining_date: document.getElementById('e-jdate').value,
        work_email: document.getElementById('e-wemail').value,
        system_role: document.getElementById('e-role').value,
        shift_timing: document.getElementById('e-shift').value,
        bank_name: document.getElementById('e-bank').value,
        account_number: document.getElementById('e-accno').value,
        ifsc_code: document.getElementById('e-ifsc').value,
        upi_id: document.getElementById('e-upi').value,
        monthly_base_salary: Number(document.getElementById('e-salary').value) || 0,
        portal_password: document.getElementById('e-password').value,
        status: 'Active'
      };

      if (sbClient) {
        if (dbId) await sbClient.from('employees').update(payload).eq('id', dbId);
        else await sbClient.from('employees').insert([payload]);
      } else {
        if (dbId) {
          const idx = db.emp.findIndex(x => x.id === dbId);
          if (idx !== -1) db.emp[idx] = { id: dbId, ...payload };
        } else {
          db.emp.unshift({ id: 'emp-' + Date.now(), ...payload });
        }
      }

      alert('Employee Record Saved Successfully!');
      closeModal('md-emp');
      init();
    }'''

if 'async function saveEmployee(e)' in html:
    start_pos = html.find('function renderEmployees()')
    end_pos = html.find('async function deboardEmp(id)')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + js_emp_functions + '\n\n    ' + html[end_pos:]

# Make sure "+ Onboard Employee" button calls openEmployeeModal()
html = html.replace("onclick=\"openModal('md-emp')\"", "onclick=\"openEmployeeModal()\"")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Employee HRMS Onboarding Form and table updated with default theme styling.")
