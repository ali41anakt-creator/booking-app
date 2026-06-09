// ─── Auth State ───────────────────────────────────────────
const Auth = {
  getToken:    () => localStorage.getItem('token'),
  getUser:     () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  isLoggedIn:  () => !!localStorage.getItem('token'),
  getRole:     () => { const u = Auth.getUser(); return u?.role || null; },

  login(user, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Router.navigate('/');
  },

  requireAuth(role = null) {
    if (!Auth.isLoggedIn()) { Router.navigate('/login'); return false; }
    if (role && Auth.getRole() !== role) { toast.error('Рұқсат жоқ'); Router.navigate('/'); return false; }
    return true;
  },
};
