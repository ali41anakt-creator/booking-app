// ─── Home Page ────────────────────────────────────────────
function renderNavbar() {
  const user = Auth.getUser();
  const dashLink = user ? `<a href="#/dashboard" class="nav-link">Кабинет</a>` : '';
  const authLinks = user
    ? `<span style="color:var(--gray-lt);font-size:0.85rem">${user.name}</span>
       <button class="btn btn-outline btn-sm" onclick="Auth.logout()">Шығу</button>`
    : `<a href="#/login" class="btn btn-ghost btn-sm">Кіру</a>
       <a href="#/register" class="btn btn-primary btn-sm">Тіркелу</a>`;

  return `
  <nav class="navbar">
    <a href="#/" class="navbar-brand">Book<span>KZ</span></a>
    <div class="navbar-nav">
      <a href="#/" class="nav-link">Басты</a>
      <a href="#/booking" class="nav-link">Жазылу</a>
      ${dashLink}
      ${authLinks}
    </div>
  </nav>`;
}

async function renderHomePage() {
  const app = document.getElementById('app');
  app.innerHTML = renderNavbar() + `
  <main class="page">
    <section class="hero">
      <div class="hero-grid-bg"></div>
      <div class="container" style="position:relative;z-index:1">
        <div class="hero-eyebrow">Онлайн жазылу платформасы</div>
        <h1 class="hero-title">
          Кәсіби<br>
          шебер<em>лер</em>ге<br>
          жазылыңыз
        </h1>
        <p class="hero-sub">
          Барбершоп, сұлулық салоны, маникюр — барлық қызметке онлайн жазылу. Қолайлы уақытта, таңдаған шеберіңізбен.
        </p>
        <div class="hero-actions">
          <a href="#/booking" class="btn btn-primary btn-lg">Жазылу →</a>
          <a href="#/login" class="btn btn-outline btn-lg">Кіру</a>
        </div>
      </div>
    </section>

    <section class="section" style="background:var(--surface)">
      <div class="container">
        <div class="section-eyebrow">Қызметтер</div>
        <h2 class="section-title">Не ұсынамыз</h2>
        <div id="services-grid" class="grid grid-3">
          <div class="loading-wrap"><div class="spinner"></div> Жүктелуде...</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-eyebrow">Команда</div>
        <h2 class="section-title">Біздің шеберлер</h2>
        <div id="masters-grid" class="grid grid-3">
          <div class="loading-wrap"><div class="spinner"></div> Жүктелуде...</div>
        </div>
      </div>
    </section>

    <section class="section" style="background:var(--surface)">
      <div class="container" style="text-align:center;max-width:600px;margin:0 auto">
        <div class="section-eyebrow">Байланыс</div>
        <h2 style="margin-bottom:16px">Сұрақтарыңыз бар ма?</h2>
        <p style="color:var(--gray-lt);margin-bottom:32px">Бізбен байланысыңыз немесе бірден онлайн жазылыңыз.</p>
        <a href="#/booking" class="btn btn-primary btn-lg">Жазылу бастау</a>
      </div>
    </section>

    <footer style="border-top:1px solid var(--border);padding:32px;text-align:center;color:var(--gray);font-size:0.85rem">
      © 2024 BookKZ — Онлайн жазылу платформасы
    </footer>
  </main>`;

  // Load services
  try {
    const services = await api.get('/services');
    document.getElementById('services-grid').innerHTML = services.length
      ? services.map(s => `
        <div class="service-card">
          <div class="service-name">${s.name}</div>
          <div class="service-desc">${s.description || ''}</div>
          <div class="service-meta">
            <span class="service-price">${formatPrice(s.price)}</span>
            <span class="service-duration">${s.duration_min} мин</span>
          </div>
        </div>`).join('')
      : '<p style="color:var(--gray-lt)">Қызметтер жоқ</p>';
  } catch { document.getElementById('services-grid').innerHTML = '<p style="color:var(--gray-lt)">Жүктеу қатесі</p>'; }

  // Load masters
  try {
    const masters = await api.get('/masters');
    document.getElementById('masters-grid').innerHTML = masters.length
      ? masters.map(m => `
        <div class="master-card">
          <div class="master-avatar">${initials(m.name)}</div>
          <div class="master-name">${m.name}</div>
          <div class="master-rating">${stars(m.rating)} ${Number(m.rating||0).toFixed(1)}</div>
          <div class="master-bio">${m.bio || ''}</div>
          <div class="master-exp">${m.experience} жыл тәжірибе</div>
        </div>`).join('')
      : '<p style="color:var(--gray-lt)">Шеберлер жоқ</p>';
  } catch { document.getElementById('masters-grid').innerHTML = '<p style="color:var(--gray-lt)">Жүктеу қатесі</p>'; }
}
