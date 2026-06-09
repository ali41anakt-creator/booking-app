// ─── Login Page ───────────────────────────────────────────
function renderLoginPage() {
  if (Auth.isLoggedIn()) { Router.navigate('/dashboard'); return; }
  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <h2>Book<span>KZ</span></h2>
        <p style="color:var(--gray-lt);font-size:0.9rem;margin-top:8px">Жүйеге кіру</p>
      </div>
      <div id="login-error" style="display:none;padding:12px;background:rgba(192,57,43,0.1);border:1px solid var(--red);border-radius:var(--radius);color:#f1948a;font-size:0.88rem;margin-bottom:16px"></div>
      <div class="form-group">
        <label class="form-label">Телефон</label>
        <input id="login-phone" class="form-control" type="tel" placeholder="+77001234567" value="+7">
      </div>
      <div class="form-group">
        <label class="form-label">Құпия сөз</label>
        <input id="login-pass" class="form-control" type="password" placeholder="••••••••">
      </div>
      <button class="btn btn-primary btn-block" id="login-btn" onclick="submitLogin()">Кіру</button>
      <div class="auth-switch">
        Аккаунт жоқ па? <a href="#/register">Тіркелу</a>
      </div>
      <div style="margin-top:20px;padding:16px;background:var(--surface2);border-radius:var(--radius);font-size:0.8rem;color:var(--gray-lt)">
        <strong style="color:var(--gray)">Тест аккаунттары:</strong><br>
        Admin: +77001234567 / admin123<br>
        Master: +77012345678 / master123<br>
        User: +77034567890 / user123
      </div>
    </div>
  </div>`;

  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key==='Enter') submitLogin(); });
}

async function submitLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const { user, token } = await api.post('/auth/login', { phone, password });
    Auth.login(user, token);
    toast.success(`Қош келдіңіз, ${user.name}!`);
    Router.navigate('/dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = 'Кіру';
  }
}

// ─── Register Page ────────────────────────────────────────
function renderRegisterPage() {
  if (Auth.isLoggedIn()) { Router.navigate('/dashboard'); return; }
  document.getElementById('app').innerHTML = renderNavbar() + `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <h2>Book<span>KZ</span></h2>
        <p style="color:var(--gray-lt);font-size:0.9rem;margin-top:8px">Тіркелу</p>
      </div>
      <div id="reg-error" style="display:none;padding:12px;background:rgba(192,57,43,0.1);border:1px solid var(--red);border-radius:var(--radius);color:#f1948a;font-size:0.88rem;margin-bottom:16px"></div>
      <div class="form-group">
        <label class="form-label">Аты-жөні</label>
        <input id="reg-name" class="form-control" type="text" placeholder="Иванов Иван">
      </div>
      <div class="form-group">
        <label class="form-label">Телефон</label>
        <input id="reg-phone" class="form-control" type="tel" placeholder="+77001234567" value="+7">
      </div>
      <div class="form-group">
        <label class="form-label">Email (міндетті емес)</label>
        <input id="reg-email" class="form-control" type="email" placeholder="email@mail.kz">
      </div>
      <div class="form-group">
        <label class="form-label">Құпия сөз</label>
        <input id="reg-pass" class="form-control" type="password" placeholder="Кем дегенде 6 символ">
      </div>
      <button class="btn btn-primary btn-block" id="reg-btn" onclick="submitRegister()">Тіркелу</button>
      <div class="auth-switch">
        Аккаунт бар ма? <a href="#/login">Кіру</a>
      </div>
    </div>
  </div>`;
}

async function submitRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('reg-error');
  const btn = document.getElementById('reg-btn');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const { user, token } = await api.post('/auth/register', { name, phone, email: email||undefined, password });
    Auth.login(user, token);
    toast.success('Тіркелу сәтті!');
    Router.navigate('/dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = 'Тіркелу';
  }
}
