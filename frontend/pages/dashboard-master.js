// ─── Master Dashboard ─────────────────────────────────────
async function renderMasterDashboard() {
  const user = Auth.getUser();
  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-section">
        <div style="padding:0 8px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(155,89,182,0.2);border:2px solid rgba(155,89,182,0.4);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.2rem;color:#a569bd;margin-bottom:10px">
            ${initials(user?.name)}
          </div>
          <div style="font-weight:500;font-size:0.95rem">${user?.name}</div>
          <div>${roleBadge('master')}</div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Навигация</div>
        <button class="sidebar-item active" id="tab-orders" onclick="showMasterTab('orders')">
          <span class="sidebar-icon">📋</span> Жазылымдар
        </button>
        <button class="sidebar-item" id="tab-schedule" onclick="showMasterTab('schedule')">
          <span class="sidebar-icon">📅</span> Кесте
        </button>
        <button class="sidebar-item" onclick="Auth.logout()">
          <span class="sidebar-icon">🚪</span> Шығу
        </button>
      </div>
    </aside>
    <main class="main-content">
      <div id="master-tab-content"></div>
    </main>
  </div>`;

  showMasterTab('orders');
}

async function showMasterTab(tab) {
  document.querySelectorAll('.sidebar-item[id^="tab-"]').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  const el = document.getElementById('master-tab-content');
  if (tab === 'orders') await renderMasterOrders(el);
  else await renderMasterSchedule(el);
}

async function renderMasterOrders(el) {
  el.innerHTML = `
    <div class="page-header"><h2>Жазылымдар</h2><p>Сіздің барлық клиент жазылымдары</p></div>
    <div class="tabs">
      <button class="tab-btn active" onclick="filterAppts('all',this)">Барлығы</button>
      <button class="tab-btn" onclick="filterAppts('pending',this)">Күтілуде</button>
      <button class="tab-btn" onclick="filterAppts('confirmed',this)">Расталды</button>
      <button class="tab-btn" onclick="filterAppts('completed',this)">Аяқталды</button>
    </div>
    <div id="master-appts"><div class="loading-wrap"><div class="spinner"></div></div></div>`;

  await loadMasterAppts('all');
}

let allMasterAppts = [];
async function loadMasterAppts(filter) {
  try {
    allMasterAppts = await api.get('/appointments');
    renderMasterApptsList(filter);
  } catch (err) { document.getElementById('master-appts').innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`; }
}

function filterAppts(filter, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMasterApptsList(filter);
}

function renderMasterApptsList(filter) {
  const appts = filter === 'all' ? allMasterAppts : allMasterAppts.filter(a => a.status === filter);
  const el = document.getElementById('master-appts');
  if (!appts.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>Жазылым жоқ</h3></div>`;
    return;
  }
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Клиент</th><th>Телефон</th><th>Қызмет</th><th>Күн</th><th>Уақыт</th><th>Статус</th><th>Әрекет</th>
        </tr></thead>
        <tbody>
          ${appts.map(a => `
            <tr>
              <td><strong>${a.client_name}</strong></td>
              <td style="color:var(--gray-lt)">${a.client_phone}</td>
              <td>${a.service_name}</td>
              <td>${formatDate(a.appt_date)}</td>
              <td>${a.appt_time?.slice(0,5)}</td>
              <td>${statusBadge(a.status)}</td>
              <td>
                <div style="display:flex;gap:6px">
                  ${a.status==='pending' ? `
                    <button class="btn btn-sm" style="background:rgba(39,174,96,0.15);color:#27ae60;border:1px solid rgba(39,174,96,0.3)" onclick="updateStatus(${a.id},'confirmed')">✓</button>
                    <button class="btn btn-danger btn-sm" onclick="updateStatus(${a.id},'cancelled')">✕</button>` : ''}
                  ${a.status==='confirmed' ? `
                    <button class="btn btn-sm" style="background:rgba(52,152,219,0.15);color:#3498db;border:1px solid rgba(52,152,219,0.3)" onclick="updateStatus(${a.id},'completed')">✓ Аяқтау</button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function updateStatus(id, status) {
  try {
    await api.patch(`/appointments/${id}/status`, { status });
    toast.success('Статус жаңартылды');
    allMasterAppts = await api.get('/appointments');
    renderMasterApptsList('all');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.tab-btn')?.classList.add('active');
  } catch (err) { toast.error(err.message); }
}

async function renderMasterSchedule(el) {
  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = `
    <div class="page-header"><h2>Кесте</h2><p>Бос және бос емес уақыттар</p></div>
    <div class="form-group" style="max-width:240px">
      <label class="form-label">Күн</label>
      <input type="date" id="sched-date" class="form-control" min="${today}" value="${today}" onchange="loadMasterSchedule()">
    </div>
    <div id="sched-slots" class="slot-grid" style="max-width:500px"></div>`;
  await loadMasterSchedule();
}

async function loadMasterSchedule() {
  const date = document.getElementById('sched-date')?.value;
  const el = document.getElementById('sched-slots');
  if (!date || !el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    // Get master id from /masters list by user id
    const masters = await api.get('/masters');
    const user = Auth.getUser();
    const master = masters.find(m => m.user_id === user?.id) || masters[0];
    if (!master) { el.innerHTML = '<p style="color:var(--gray-lt)">Шебер профилі табылмады</p>'; return; }

    const slots = await api.get(`/masters/${master.id}/schedule?date=${date}`);
    el.innerHTML = slots.map(s => `
      <div class="slot-btn" style="cursor:default;${
        s.available
          ? 'border-color:rgba(34,197,94,0.4);'
          : 'background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.5);opacity:1;'
      }">
        ${s.time}<br><span style="font-size:0.75rem;display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.available?'#22c55e':'#ef4444'};vertical-align:middle;margin-top:4px;box-shadow:0 0 6px ${s.available?'#22c55e':'#ef4444'}"></span>
      </div>`).join('');
  } catch { el.innerHTML = '<p style="color:var(--gray-lt)">Жүктеу қатесі</p>'; }
}
