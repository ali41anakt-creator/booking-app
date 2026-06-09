// ─── Admin Dashboard ──────────────────────────────────────
async function renderAdminDashboard() {
  const user = Auth.getUser();
  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-section">
        <div style="padding:0 8px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(201,168,76,0.15);border:2px solid var(--gold-dim);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.2rem;color:var(--gold);margin-bottom:10px">
            ${initials(user?.name)}
          </div>
          <div style="font-weight:500;font-size:0.95rem">${user?.name}</div>
          <div>${roleBadge('admin')}</div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Навигация</div>
        <button class="sidebar-item active" id="atab-stats"   onclick="showAdminTab('stats')"><span class="sidebar-icon">📊</span> Статистика</button>
        <button class="sidebar-item"         id="atab-appts"  onclick="showAdminTab('appts')"><span class="sidebar-icon">📅</span> Жазылымдар</button>
        <button class="sidebar-item"         id="atab-users"  onclick="showAdminTab('users')"><span class="sidebar-icon">👥</span> Пайдаланушылар</button>
        <button class="sidebar-item"         id="atab-services" onclick="showAdminTab('services')"><span class="sidebar-icon">✂️</span> Қызметтер</button>
        <button class="sidebar-item" onclick="Auth.logout()"><span class="sidebar-icon">🚪</span> Шығу</button>
      </div>
    </aside>
    <main class="main-content">
      <div id="admin-tab-content"></div>
    </main>
  </div>`;

  showAdminTab('stats');
}

async function showAdminTab(tab) {
  document.querySelectorAll('.sidebar-item[id^="atab-"]').forEach(b => b.classList.remove('active'));
  document.getElementById(`atab-${tab}`)?.classList.add('active');
  const el = document.getElementById('admin-tab-content');
  if (tab === 'stats')    await renderAdminStats(el);
  if (tab === 'appts')    await renderAdminAppts(el);
  if (tab === 'users')    await renderAdminUsers(el);
  if (tab === 'services') await renderAdminServices(el);
}

async function renderAdminStats(el) {
  el.innerHTML = `<div class="page-header"><h2>Статистика</h2></div><div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const stats = await api.get('/admin/stats');
    el.innerHTML = `
      <div class="page-header"><h2>Статистика</h2><p>Жүйенің жалпы деректері</p></div>
      <div class="grid grid-4" style="margin-bottom:32px">
        <div class="stat-card">
          <div class="stat-label">Барлық жазылымдар</div>
          <div class="stat-value">${stats.total_appointments}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Бүгін</div>
          <div class="stat-value">${stats.today_appointments}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Жалпы табыс</div>
          <div class="stat-value" style="font-size:1.6rem">${formatPrice(stats.total_revenue)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Үздік шебер</div>
          <div class="stat-value" style="font-size:1.2rem">${stats.top_master?.name || '—'}</div>
          <div class="stat-sub">${stats.top_master ? stats.top_master.count + ' аяқталған' : ''}</div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`; }
}

async function renderAdminAppts(el) {
  el.innerHTML = `<div class="page-header"><h2>Барлық жазылымдар</h2></div><div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const appts = await api.get('/appointments');
    el.innerHTML = `
      <div class="page-header"><h2>Барлық жазылымдар</h2><p>${appts.length} жазылым</p></div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Клиент</th><th>Шебер</th><th>Қызмет</th><th>Күн / Уақыт</th><th>Баға</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>
            ${appts.map(a => `
              <tr>
                <td><strong>${a.client_name}</strong><br><span style="color:var(--gray-lt);font-size:0.8rem">${a.client_phone}</span></td>
                <td>${a.master_name}</td>
                <td>${a.service_name}</td>
                <td>${formatDate(a.appt_date)}<br><span style="color:var(--gray-lt)">${a.appt_time?.slice(0,5)}</span></td>
                <td>${formatPrice(a.price)}</td>
                <td>${statusBadge(a.status)}</td>
                <td>
                  <select class="form-control" style="padding:6px;font-size:0.82rem;width:130px" onchange="adminChangeStatus(${a.id},this.value)">
                    ${['pending','confirmed','completed','cancelled'].map(s =>
                      `<option value="${s}" ${a.status===s?'selected':''}>${{pending:'Күтілуде',confirmed:'Расталды',completed:'Аяқталды',cancelled:'Бас тарту'}[s]}</option>`
                    ).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`; }
}

async function adminChangeStatus(id, status) {
  try {
    await api.patch(`/appointments/${id}/status`, { status });
    toast.success('Статус жаңартылды');
  } catch (err) { toast.error(err.message); }
}

async function renderAdminUsers(el) {
  el.innerHTML = `<div class="page-header"><h2>Пайдаланушылар</h2></div><div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const users = await api.get('/admin/users');
    el.innerHTML = `
      <div class="page-header"><h2>Пайдаланушылар</h2><p>${users.length} адам тіркелген</p></div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Аты</th><th>Телефон</th><th>Email</th><th>Рөл</th><th>Белсенді</th><th>Тіркелу</th><th>Рөл өзгерту</th>
          </tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.phone}</td>
                <td style="color:var(--gray-lt)">${u.email||'—'}</td>
                <td>${roleBadge(u.role)}</td>
                <td><span style="color:${u.is_active?'var(--green)':'var(--red)'}">${u.is_active?'✓':'✕'}</span></td>
                <td style="color:var(--gray-lt);font-size:0.82rem">${formatDate(u.created_at)}</td>
                <td>
                  <select class="form-control" style="padding:6px;font-size:0.82rem;width:110px" onchange="adminChangeRole(${u.id},this.value)">
                    ${['user','master','admin'].map(r =>
                      `<option value="${r}" ${u.role===r?'selected':''}>${{user:'Клиент',master:'Шебер',admin:'Әкімші'}[r]}</option>`
                    ).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`; }
}

async function adminChangeRole(id, role) {
  try {
    await api.patch(`/admin/users/${id}`, { role });
    toast.success('Рөл жаңартылды');
  } catch (err) { toast.error(err.message); }
}

async function renderAdminServices(el) {
  el.innerHTML = `<div class="page-header"><h2>Қызметтер</h2></div><div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const svcs = await api.get('/services');
    el.innerHTML = `
      <div class="page-header">
        <div><h2>Қызметтер</h2><p>${svcs.length} қызмет</p></div>
        <button class="btn btn-primary" onclick="showServiceModal()">+ Қосу</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Атауы</th><th>Санат</th><th>Ұзақтығы</th><th>Бағасы</th><th></th>
          </tr></thead>
          <tbody>
            ${svcs.map(s => `
              <tr>
                <td><strong>${s.name}</strong><br><span style="color:var(--gray-lt);font-size:0.82rem">${s.description||''}</span></td>
                <td><span class="badge badge-user">${s.category||'—'}</span></td>
                <td>${s.duration_min} мин</td>
                <td style="color:var(--gold)">${formatPrice(s.price)}</td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-outline btn-sm" onclick="showServiceModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">✎</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService(${s.id})">✕</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div id="service-modal"></div>`;
  } catch (err) { el.innerHTML = `<p style="color:var(--gray-lt)">${err.message}</p>`; }
}

function showServiceModal(svc = null) {
  const modal = document.getElementById('service-modal') || document.body;
  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay';
  modalEl.id = 'svc-modal';
  modalEl.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${svc ? 'Өңдеу' : 'Жаңа қызмет'}</h3>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('svc-modal').remove()">✕</button>
      </div>
      <div class="form-group"><label class="form-label">Атауы</label>
        <input id="svc-name" class="form-control" value="${svc?.name||''}"></div>
      <div class="form-group"><label class="form-label">Сипаттама</label>
        <input id="svc-desc" class="form-control" value="${svc?.description||''}"></div>
      <div class="grid grid-2">
        <div class="form-group"><label class="form-label">Ұзақтығы (мин)</label>
          <input id="svc-dur" class="form-control" type="number" value="${svc?.duration_min||60}"></div>
        <div class="form-group"><label class="form-label">Бағасы (₸)</label>
          <input id="svc-price" class="form-control" type="number" value="${svc?.price||0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Санат</label>
        <input id="svc-cat" class="form-control" value="${svc?.category||''}"></div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="document.getElementById('svc-modal').remove()">Бас тарту</button>
        <button class="btn btn-primary" onclick="saveService(${svc?.id||'null'})">Сақтау</button>
      </div>
    </div>`;
  document.body.appendChild(modalEl);
}

async function saveService(id) {
  const body = {
    name: document.getElementById('svc-name').value,
    description: document.getElementById('svc-desc').value,
    duration_min: parseInt(document.getElementById('svc-dur').value),
    price: parseFloat(document.getElementById('svc-price').value),
    category: document.getElementById('svc-cat').value,
  };
  try {
    if (id) await api.put(`/services/${id}`, body);
    else await api.post('/services', body);
    toast.success('Сақталды');
    document.getElementById('svc-modal')?.remove();
    await renderAdminServices(document.getElementById('admin-tab-content'));
  } catch (err) { toast.error(err.message); }
}

async function deleteService(id) {
  if (!confirm('Қызметті өшіресіз бе?')) return;
  try {
    await api.delete(`/services/${id}`);
    toast.success('Өшірілді');
    await renderAdminServices(document.getElementById('admin-tab-content'));
  } catch (err) { toast.error(err.message); }
}
