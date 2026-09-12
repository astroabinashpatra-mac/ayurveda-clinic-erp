with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Full 8:00 AM to 8:00 PM 45-minute session schedule renderer with dynamic dates
full_schedule_js = '''    function renderScheduleGrid() {
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
    }'''

if 'function renderScheduleGrid()' in html:
    start_pos = html.find('function renderScheduleGrid()')
    end_pos = html.find('/* PATIENTS */')
    if start_pos != -1 and end_pos != -1:
        html = html[:start_pos] + full_schedule_js + '\n\n    ' + html[end_pos:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Schedule module successfully restored with dynamic dates and full 8 AM - 8 PM 45-min slots.")
