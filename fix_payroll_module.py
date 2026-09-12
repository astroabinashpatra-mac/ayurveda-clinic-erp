with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Payroll Module Section HTML with exact required columns
old_payroll_section = '''    <!-- MODULE 10: PAYROLL -->
    <div id="mod-payroll" class="module-section">
      <div class="section-header">
        <h2>💵 Payroll & Salaries Payout</h2>
        <button class="btn btn-green" onclick="processPayrollRun()">⚙️ Generate Monthly Payroll</button>
      </div>
      <table class="data-table">
        <thead><tr><th>EMP ID</th><th>EMPLOYEE NAME</th><th>MONTH</th><th>BASE SALARY</th><th>NET PAY</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody id="tbl-payroll"></tbody>
      </table>
    </div>'''

new_payroll_section = '''    <!-- MODULE 10: PAYROLL CALCULATION, ATTENDANCE, COMMISSION & DISBURSAL -->
    <div id="mod-payroll" class="module-section">
      <div class="section-header">
        <div>
          <h2>💵 PAYROLL CALCULATION, ATTENDANCE, COMMISSION & DISBURSAL</h2>
          <span style="font-size:0.75rem; color:var(--text-muted)">Calculate pro-rated salaries, commissions, disburse payments, and generate payslips.</span>
        </div>
        <button class="btn btn-orange" onclick="syncEmployeesToPayroll()">🔄 Sync Active Employees to Payroll</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>SLIP ID</th>
            <th>EMPLOYEE</th>
            <th>BASE SALARY</th>
            <th>ATTENDANCE (DAYS)</th>
            <th>COMMISSION (₹)</th>
            <th>NET PAYABLE (₹)</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody id="tbl-payroll"></tbody>
      </table>
    </div>'''

if old_payroll_section in html:
    html = html.replace(old_payroll_section, new_payroll_section)

# 2. Ensure renderPayroll runs automatically on init
if 'renderEmployees();' in html and 'renderPayroll();' not in html:
    html = html.replace('renderEmployees();', 'renderEmployees();\n      renderPayroll();')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Payroll module table headers and sync buttons restored successfully.")
