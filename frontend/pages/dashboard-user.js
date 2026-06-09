// ─── User Dashboard ───────────────────────────────────────
async function renderUserDashboard() {
  const user = Auth.getUser();
  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-section">
        <div style="padding:0 8px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--surface2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.2rem;color:var(--gold);margin-bottom:10px">
            ${initials(user?.name)}
          </div>
          <div style="font-weight:500;font-size:0.95rem">${user?.name}</div>
          <div>${roleBadge('user')}</div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Навигация</div>
        <button class="sidebar-item active" onclick="showUserTab('appointments')">
          <span class="sidebar-icon">📅</span> Жазылымдарым
        </button>
        <button class="sidebar-item" onclick="Router.navigate('/booking')">
          <span class="sidebar-icon">➕</span> Жазылу
        </button>
        <button class="sidebar-item" onclick="Auth.logout()">
          <span class="sidebar-icon">🚪</span> Шығу
        </button>
      </div>
    </aside>
    <main class="main-content">
      <div id="user-tab-content"></div>
    </main>
  </div>`;

  showUserTab('appointments');
}

async function showUserTab(tab) {
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`[onclick="showUserTab('${tab}')"]`)?.classList.add('active');

  const el = document.getElementById('user-tab-content');
  if (tab === 'appointments') await renderUserAppointments(el);
}

async function renderUserAppointments(el) {
  el.innerHTML = `
    <div class="page-header">
      <h2>Жазылымдарым</h2>
      <p>Барлық жазылымдарыңыздың тізімі</p>
    </div>
    <a href="#/booking" class="btn btn-primary" style="margin-bottom:24px">+ Жаңа жазылу</a>
    <div id="appt-list"><div class="loading-wrap"><div class="spinner"></div></div></div>`;

  try {
    const appts = await api.get('/appointments');
    const list = document.getElementById('appt-list');
    if (!appts.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><h3>Жазылым жоқ</h3><p>Алғашқы жазылымды жасаңыз!</p></div>`;
      return;
    }
    list.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Қызмет</th><th>Шебер</th><th>Күн</th><th>Уақыт</th><th>Баға</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>
            ${appts.map(a => `
              <tr>
                <td><strong>${a.service_name}</strong></td>
                <td>${a.master_name}</td>
                <td>${formatDate(a.appt_date)}</td>
                <td>${a.appt_time?.slice(0,5)}</td>
                <td>${formatPrice(a.price)}</td>
                <td>${statusBadge(a.status)}</td>
                <td>
                  ${a.status==='pending'||a.status==='confirmed'
                    ? `<button class="btn btn-danger btn-sm" onclick="cancelAppt(${a.id})">Бас тарту</button>`
                    : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById('appt-list').innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`;
  }
}

async function cancelAppt(id) {
  if (!confirm('Жазылымнан бас тартасыз ба?')) return;
  try {
    await api.delete(`/appointments/${id}`);
    toast.success('Жазылым бас тартылды');
    const el = document.getElementById('appt-list');
    await renderUserAppointments(document.getElementById('user-tab-content'));
  } catch (err) { toast.error(err.message); }
}
