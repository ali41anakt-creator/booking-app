// ─── App Entry Point ──────────────────────────────────────
(function() {
  // Register routes
  Router.register('/', () => renderHomePage());
  Router.register('/login', () => renderLoginPage());
  Router.register('/register', () => renderRegisterPage());
  Router.register('/booking', () => renderBookingPage());
  Router.register('/dashboard', () => {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }
    const role = Auth.getRole();
    if (role === 'admin')  renderAdminDashboard();
    else if (role === 'master') renderMasterDashboard();
    else renderUserDashboard();
  });
  Router.register('*', () => {
    document.getElementById('app').innerHTML = renderNavbar() + `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px">
        <h1 style="color:var(--gold)">404</h1>
        <p style="color:var(--gray-lt)">Бет табылмады</p>
        <a href="#/" class="btn btn-primary">Басты бетке</a>
      </div>`;
  });

  // Init
  Router.init();
})();
