with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Update init() function to load Supabase payroll table cleanly
if "const { data: pr } = await sbClient.from('payroll').select('*');" not in html:
    html = html.replace(
        "const { data: ip } = await sbClient.from('ipd_beds').select('*'); if (ip && ip.length) db.ipd = ip;",
        "const { data: ip } = await sbClient.from('ipd_beds').select('*'); if (ip && ip.length) db.ipd = ip;\n          const { data: pr } = await sbClient.from('payroll').select('*'); if (pr && pr.length) db.payroll = pr;"
    )

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Supabase payroll DB sync wired successfully.")
