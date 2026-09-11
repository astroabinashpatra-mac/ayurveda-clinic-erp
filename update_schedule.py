with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Add state variable and changeWeek function if not present
state_code = '''    let currentWeekOffset = 0;

    function changeWeek(dir) {
      currentWeekOffset += dir;
      renderScheduleGrid();
    }'''

if 'let currentWeekOffset' not in html:
    html = html.replace('let activeBillingFilter = \'All\';', f'let activeBillingFilter = \'All\';\n    {state_code}')

# Update schedule grid rendering to respect currentWeekOffset and dynamic dates
old_render = '''    function renderScheduleGrid() {
      const grid = document.getElementById('sch-week-grid');
      if (!grid) return;

      const days = ['SUN 30', 'MON 31', 'TUE 1', 'WED 2', 'THU 3', 'FRI 4', 'SAT 5'];'''

new_render = '''    function renderScheduleGrid() {
      const grid = document.getElementById('sch-week-grid');
      if (!grid) return;

      // Calculate dates dynamically based on currentWeekOffset
      const baseDate = new Date(2026, 8, 11); // Sep 11, 2026 reference
      baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));
      
      // Find Sunday of this week
      const sunday = new Date(baseDate);
      sunday.setDate(baseDate.getDate() - baseDate.getDay());

      const days = [];
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for(let i=0; i<7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        days.push(`${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`);
      }

      // Update week label text
      const weekLabelEl = document.getElementById('sch-week-label');
      if (weekLabelEl) {
        const weekNum = 37 + currentWeekOffset;
        weekLabelEl.innerText = `Week ${weekNum} (${monthNames[sunday.getMonth()]} 2026)`;
      }'''

html = html.replace(old_render, new_render)

# Also update the week label span ID so we can target it
html = html.replace('<span style="font-weight:bold; font-size:0.9rem; color:var(--accent-orange);">Week 37 (Sep 2026)</span>', '<span id="sch-week-label" style="font-weight:bold; font-size:0.9rem; color:var(--accent-orange);">Week 37 (Sep 2026)</span>')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Schedule week navigation updated successfully.")
