// ─── Booking Wizard ───────────────────────────────────────
const BookingState = { step: 1, service: null, master: null, date: null, time: null, notes: '' };

async function renderBookingPage() {
  if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="booking-page">
    <h2 style="margin-bottom:8px">Онлайн жазылу</h2>
    <p style="color:var(--gray-lt);margin-bottom:40px">Шебер таңдап, ыңғайлы уақытты белгілеңіз</p>

    <div class="booking-steps">
      ${['Қызмет', 'Шебер & Уақыт', 'Растау'].map((l,i) => `
        <div class="booking-step ${BookingState.step===i+1?'active':BookingState.step>i+1?'done':''}" id="step-${i+1}">
          <div class="step-number">${BookingState.step>i+1?'✓':i+1}</div>
          <div class="step-label">${l}</div>
        </div>`).join('')}
    </div>

    <div id="booking-content"></div>
  </div>`;

  renderBookingStep();
}

async function renderBookingStep() {
  const el = document.getElementById('booking-content');
  if (!el) return;

  // Update step indicators
  [1,2,3].forEach(i => {
    const s = document.getElementById(`step-${i}`);
    if (s) {
      s.className = `booking-step ${BookingState.step===i?'active':BookingState.step>i?'done':''}`;
      s.querySelector('.step-number').textContent = BookingState.step>i?'✓':i;
    }
  });

  if (BookingState.step === 1) await renderStep1(el);
  else if (BookingState.step === 2) await renderStep2(el);
  else await renderStep3(el);
}

async function renderStep1(el) {
  el.innerHTML = `<div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const categories = await api.get('/services/meta/categories').catch(() => []);
    el.innerHTML = `
      <h3 style="margin-bottom:20px">Қызмет таңдаңыз</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        <input type="text" id="booking-svc-search" placeholder="Іздеу..."
               style="flex:1;min-width:200px;padding:10px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:inherit">
        <select id="booking-svc-category" style="padding:10px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:inherit">
          <option value="">Барлық санаттар</option>
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div id="booking-services-grid" class="grid grid-2">
        <div class="loading-wrap"><div class="spinner"></div></div>
      </div>`;

    async function loadBookingServices() {
      const search = document.getElementById('booking-svc-search').value.trim();
      const category = document.getElementById('booking-svc-category').value;
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const grid = document.getElementById('booking-services-grid');
      try {
        const services = await api.get(`/services${params.toString() ? '?' + params.toString() : ''}`);
        grid.innerHTML = services.length ? services.map(s => `
          <div class="service-card" id="svc-${s.id}" onclick="selectService(${JSON.stringify(s).replace(/"/g,'&quot;')})"
               style="${BookingState.service?.id===s.id?'border-color:var(--gold);background:rgba(201,168,76,0.05)':''}">
            <div class="service-name">${s.name}</div>
            <div class="service-desc">${s.description||''}</div>
            <div class="service-meta">
              <span class="service-price">${formatPrice(s.price)}</span>
              <span class="service-duration">${s.duration_min} мин</span>
            </div>
          </div>`).join('') : '<p style="color:var(--gray-lt)">Сәйкес қызмет табылмады</p>';
      } catch { grid.innerHTML = '<p style="color:var(--gray-lt)">Қызметтерді жүктеу қатесі</p>'; }
    }

    let svcSearchTimeout;
    document.getElementById('booking-svc-search').addEventListener('input', () => {
      clearTimeout(svcSearchTimeout);
      svcSearchTimeout = setTimeout(loadBookingServices, 300);
    });
    document.getElementById('booking-svc-category').addEventListener('change', loadBookingServices);
    await loadBookingServices();
  } catch { el.innerHTML = '<p style="color:var(--gray-lt)">Қызметтерді жүктеу қатесі</p>'; }
}

function selectService(s) {
  BookingState.service = s;
  BookingState.step = 2;
  renderBookingStep();
}

async function renderStep2(el) {
  el.innerHTML = `<div class="loading-wrap"><div class="spinner"></div></div>`;
  try {
    const masters = await api.get('/masters');
    const today = new Date().toISOString().split('T')[0];
    el.innerHTML = `
      <h3 style="margin-bottom:20px">Шебер таңдаңыз</h3>
      <div class="grid grid-2" style="margin-bottom:32px">
        ${masters.map(m => `
          <div class="master-card" id="master-${m.id}" onclick="selectMaster(${m.id})"
               style="cursor:pointer;${BookingState.master===m.id?'border-color:var(--gold);background:rgba(201,168,76,0.05)':''}">
            <div class="master-avatar">${initials(m.name)}</div>
            <div class="master-name">${m.name}</div>
            <div class="master-rating">${stars(m.rating)} ${Number(m.rating||0).toFixed(1)}</div>
            <div class="master-bio">${m.bio||''}</div>
          </div>`).join('')}
      </div>

      <div id="slots-section" style="${BookingState.master?'':'display:none'}">
        <h3 style="margin-bottom:16px">Күн таңдаңыз</h3>
        <input type="date" id="appt-date" class="form-control" style="max-width:240px;margin-bottom:24px"
               min="${today}" value="${BookingState.date||today}" onchange="loadSlots()">
        <h3 style="margin-bottom:12px">Уақыт таңдаңыз</h3>
        <div id="slots-grid" class="slot-grid"></div>
      </div>

      <div style="display:flex;gap:12px;margin-top:32px">
        <button class="btn btn-outline" onclick="BookingState.step=1;renderBookingStep()">← Артқа</button>
        <button class="btn btn-primary" id="next-btn" onclick="toStep3()" ${BookingState.time?'':'disabled'}>Растауға →</button>
      </div>`;

    if (BookingState.master) {
      document.getElementById(`master-${BookingState.master}`).style.borderColor = 'var(--gold)';
      document.getElementById(`master-${BookingState.master}`).style.background = 'rgba(201,168,76,0.05)';
      document.getElementById('slots-section').style.display = 'block';
      if (BookingState.date) loadSlots();
    }
  } catch { el.innerHTML = '<p style="color:var(--gray-lt)">Шеберлерді жүктеу қатесі</p>'; }
}

async function selectMaster(id) {
  BookingState.master = id;
  BookingState.time = null;
  document.querySelectorAll('.master-card').forEach(el => {
    el.style.borderColor = ''; el.style.background = '';
  });
  const sel = document.getElementById(`master-${id}`);
  if (sel) { sel.style.borderColor='var(--gold)'; sel.style.background='rgba(201,168,76,0.05)'; }
  document.getElementById('slots-section').style.display = 'block';
  const date = document.getElementById('appt-date')?.value;
  if (date) { BookingState.date = date; await loadSlots(); }
}

async function loadSlots() {
  const date = document.getElementById('appt-date')?.value;
  if (!date || !BookingState.master) return;
  BookingState.date = date;
  const slotGrid = document.getElementById('slots-grid');
  if (!slotGrid) return;
  slotGrid.innerHTML = '<div class="loading-wrap" style="padding:16px"><div class="spinner"></div></div>';
  try {
    const slots = await api.get(`/masters/${BookingState.master}/schedule?date=${date}`);
    slotGrid.innerHTML = slots.map(s => `
      <button class="slot-btn ${BookingState.time===s.time?'selected':''}"
              onclick="selectSlot('${s.time}')" ${s.available?'':'disabled'}>
        ${s.time}
      </button>`).join('');
  } catch { slotGrid.innerHTML = '<p style="color:var(--gray-lt)">Уақыттарды жүктеу қатесі</p>'; }
}

function selectSlot(time) {
  BookingState.time = time;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('selected', b.textContent.trim()===time));
  const nb = document.getElementById('next-btn');
  if (nb) nb.disabled = false;
}

function toStep3() {
  if (!BookingState.master || !BookingState.time) { toast.error('Шебер мен уақытты таңдаңыз'); return; }
  BookingState.step = 3;
  renderBookingStep();
}

async function renderStep3(el) {
  let masterName = 'Жүктелуде...';
  try {
    const masters = await api.get('/masters');
    const m = masters.find(x => x.id === BookingState.master);
    masterName = m?.name || '—';
  } catch {}

  el.innerHTML = `
    <h3 style="margin-bottom:24px">Жазылуды растаңыз</h3>
    <div class="card" style="margin-bottom:24px">
      <div class="summary-row">
        <span class="summary-label">Қызмет</span>
        <span class="summary-value">${BookingState.service?.name}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Шебер</span>
        <span class="summary-value">${masterName}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Күн</span>
        <span class="summary-value">${formatDate(BookingState.date)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Уақыт</span>
        <span class="summary-value">${BookingState.time}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Баға</span>
        <span class="summary-value" style="color:var(--gold);font-size:1.1rem">${formatPrice(BookingState.service?.price)}</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Ескерту (міндетті емес)</label>
      <textarea id="notes" class="form-control" rows="3" placeholder="Ерекше тілектер...">${BookingState.notes}</textarea>
    </div>
    <div style="display:flex;gap:12px">
      <button class="btn btn-outline" onclick="BookingState.step=2;renderBookingStep()">← Артқа</button>
      <button class="btn btn-primary btn-lg" id="confirm-btn" onclick="confirmBooking()">✓ Растау</button>
    </div>`;
}

async function confirmBooking() {
  BookingState.notes = document.getElementById('notes')?.value || '';
  const btn = document.getElementById('confirm-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    await api.post('/appointments', {
      master_id: BookingState.master,
      service_id: BookingState.service.id,
      appt_date: BookingState.date,
      appt_time: BookingState.time,
      notes: BookingState.notes,
    });
    toast.success('Жазылу сәтті! Шебер сізге хабарласады.');
    // Reset
    BookingState.step = 1; BookingState.service = null; BookingState.master = null;
    BookingState.date = null; BookingState.time = null; BookingState.notes = '';
    Router.navigate('/dashboard');
  } catch (err) {
    toast.error(err.message);
    btn.disabled = false; btn.innerHTML = '✓ Растау';
  }
}
