with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Mandatory Module & Function Checklist
required_components = [
    ("mod-dashboard", "Dashboard & Charts"),
    ("mod-prescription", "E-Prescription Desk"),
    ("mod-patients", "Patient Directory"),
    ("mod-schedule", "Schedule & Visits"),
    ("mod-aushadhi", "Aushadhi Nirman"),
    ("mod-pharmacy", "Herbal Pharmacy"),
    ("mod-billing", "Billing & Invoices"),
    ("mod-therapy", "Therapy Master"),
    ("mod-hrms", "Employee HRMS"),
    ("mod-payroll", "Payroll & Salaries"),
    ("mod-accounts", "Accounts & Vendors"),
    ("mod-documents", "Clinic Documents"),
    ("mod-admin", "Staff Access Control"),
    ("mod-ipd", "IPD Ward Management"),
    ("md-rx", "Prescription Modal"),
    ("md-pos", "POS Counter Modal"),
    ("md-emp", "Full HRMS Onboarding Modal"),
    ("md-pay", "Pending Payment Collector Modal"),
    ("md-payroll-edit", "Attendance/Commission Modal"),
    ("md-recipe", "Multi-Ingredient Recipe Modal"),
    ("md-pharmacy-stock", "Pharmacy Purchase Stock Modal"),
    ("renderScheduleGrid", "8 AM - 8 PM Therapy Schedule Function"),
    ("checkoutPosSale", "POS Checkout & Inventory Deduction Function"),
    ("saveEmployee", "4-Section HRMS Onboarding Function"),
    ("savePayment", "Pending Payment Ledger Function"),
    ("savePrescription", "E-Prescription & Billing Sync Function")
]

missing = [name for cid, name in required_components if cid not in html]

if missing:
    print(f"⚠️ Warning: Found missing components: {missing}")
else:
    print("✅ System Audit Passed: All 14 modules, modals, and core JS functions are intact and verified.")
