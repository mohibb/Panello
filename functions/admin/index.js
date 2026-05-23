const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panello Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0f1117; color: #e8eaf0; min-height: 100vh; padding: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; color: #fff; }
    h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #a0a8c0; }
    section { background: #1a1d27; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
    input, select { background: #262a38; border: 1px solid #2e3347; color: #e8eaf0;
                    border-radius: 6px; padding: 0.45rem 0.7rem; font-size: 0.9rem; }
    input[type="text"] { flex: 1; }
    button { background: #3D8EE8; color: #fff; border: none; border-radius: 6px;
             padding: 0.45rem 1rem; cursor: pointer; font-size: 0.9rem; white-space: nowrap; }
    button:hover { background: #2d7ed8; }
    button.danger { background: #c0392b; }
    button.danger:hover { background: #a93226; }
    button.secondary { background: #2e3347; }
    button.secondary:hover { background: #3a3f58; }
    .task-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;
                 border-bottom: 1px solid #2e3347; }
    .task-item:last-child { border-bottom: none; }
    .task-item span { flex: 1; }
    .task-item .owner { font-size: 0.78rem; color: #666e88; min-width: 60px; }
    .task-item input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .done span { text-decoration: line-through; color: #555e78; }
    .meal-grid { display: grid; grid-template-columns: 90px 1fr 1fr; gap: 0.4rem; }
    .meal-grid .header { font-size: 0.78rem; color: #666e88; font-weight: 600;
                         padding: 0.3rem 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .meal-grid .day-label { font-size: 0.85rem; color: #a0a8c0; display: flex;
                            align-items: center; }
    .week-nav { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .week-nav span { font-size: 0.9rem; color: #a0a8c0; min-width: 160px; text-align: center; }
    .save-row { margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem; }
    #status { font-size: 0.85rem; color: #48B368; display: none; }
  </style>
</head>
<body>
  <h1>Panello Admin</h1>

  <section id="tasks-section">
    <h2>Tasks</h2>
    <div id="task-list"></div>
    <div class="row" style="margin-top:1rem">
      <input type="text" id="new-task-title" placeholder="New task title…">
      <select id="new-task-owner">
        <option value="shared">Shared</option>
        <option value="mohibb">Mohibb</option>
        <option value="saffa">Saffa</option>
        <option value="jonas">Jonas</option>
        <option value="noah">Noah</option>
      </select>
      <button onclick="addTask()">Add</button>
    </div>
  </section>

  <section id="meals-section">
    <h2>Meals</h2>
    <div class="week-nav">
      <button class="secondary" onclick="shiftWeek(-7)">&#8592; Prev</button>
      <span id="week-label"></span>
      <button class="secondary" onclick="shiftWeek(7)">Next &#8594;</button>
    </div>
    <div class="meal-grid">
      <div class="header">Day</div>
      <div class="header">Lunch</div>
      <div class="header">Dinner</div>
      <div id="meal-rows"></div>
      <div></div>
      <div></div>
    </div>
    <div class="save-row">
      <span id="status">Saved!</span>
      <button onclick="saveMeals()">Save meals</button>
    </div>
  </section>

  <script>
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let weekOffset = 0;
    let mealData = {};

    function isoMonday(offsetDays = 0) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      const dow = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - dow + 1 + offsetDays);
      return d;
    }

    function weekDates() {
      const monday = isoMonday(weekOffset);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
      });
    }

    function shiftWeek(days) { weekOffset += days; loadMeals(); }

    async function loadTasks() {
      const res = await fetch('/api/tasks');
      const tasks = await res.json();
      const list = document.getElementById('task-list');
      if (!tasks.length) { list.innerHTML = '<p style="color:#555e78;font-size:.85rem">No tasks.</p>'; return; }
      list.innerHTML = tasks.map(t =>
        \`<div class="task-item\${t.done ? ' done' : ''}" data-id="\${t.id}">
          <input type="checkbox" \${t.done ? 'checked' : ''} onchange="toggleTask(\${t.id}, this.checked)">
          <span>\${t.title}</span>
          <span class="owner">\${t.owner}</span>
          <button class="danger" onclick="deleteTask(\${t.id})">Delete</button>
        </div>\`
      ).join('');
    }

    async function addTask() {
      const title = document.getElementById('new-task-title').value.trim();
      const owner = document.getElementById('new-task-owner').value;
      if (!title) return;
      await fetch('/api/tasks', { method: 'POST', headers: {'Content-Type':'application/json'},
                                  body: JSON.stringify({ title, owner }) });
      document.getElementById('new-task-title').value = '';
      loadTasks();
    }

    async function toggleTask(id, done) {
      await fetch(\`/api/tasks/\${id}\`, { method: 'PATCH', headers: {'Content-Type':'application/json'},
                                          body: JSON.stringify({ done }) });
      loadTasks();
    }

    async function deleteTask(id) {
      if (!confirm('Delete this task?')) return;
      await fetch(\`/api/tasks/\${id}\`, { method: 'DELETE' });
      loadTasks();
    }

    async function loadMeals() {
      const dates = weekDates();
      const monday = dates[0];
      document.getElementById('week-label').textContent =
        monday + ' – ' + dates[6];
      const res = await fetch(\`/api/meals?week=\${monday}\`);
      const rows = await res.json();
      mealData = {};
      for (const r of rows) mealData[r.date] = r;
      renderMeals(dates);
    }

    function renderMeals(dates) {
      const container = document.getElementById('meal-rows');
      container.innerHTML = dates.map(date => {
        const m = mealData[date] || {};
        const day = DAY_NAMES[new Date(date).getUTCDay()];
        return \`<div class="day-label">\${day} \${date.slice(5)}</div>
          <input type="text" data-date="\${date}" data-field="lunch"
                 value="\${m.lunch || ''}" placeholder="—">
          <input type="text" data-date="\${date}" data-field="dinner"
                 value="\${m.dinner || ''}" placeholder="—">\`;
      }).join('');
    }

    async function saveMeals() {
      const inputs = document.querySelectorAll('#meal-rows input[type="text"]');
      const byDate = {};
      for (const inp of inputs) {
        const { date, field } = inp.dataset;
        if (!byDate[date]) byDate[date] = { date };
        byDate[date][field] = inp.value.trim() || null;
      }
      await Promise.all(Object.values(byDate).map(row =>
        fetch('/api/meals', { method: 'POST', headers: {'Content-Type':'application/json'},
                              body: JSON.stringify(row) })
      ));
      const s = document.getElementById('status');
      s.style.display = 'inline';
      setTimeout(() => { s.style.display = 'none'; }, 2000);
    }

    document.getElementById('new-task-title').addEventListener('keydown', e => {
      if (e.key === 'Enter') addTask();
    });

    loadTasks();
    loadMeals();
  </script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(ADMIN_HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
