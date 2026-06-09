// ─── API Client ───────────────────────────────────────────
const API_BASE = '/api';

const api = {
  async request(method, path, body = null) {
    const token = localStorage.getItem('token');
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.error || data.errors?.[0]?.msg || 'Қате' };
    return data;
  },
  get:    (path)        => api.request('GET',    path),
  post:   (path, body)  => api.request('POST',   path, body),
  put:    (path, body)  => api.request('PUT',    path, body),
  patch:  (path, body)  => api.request('PATCH',  path, body),
  delete: (path)        => api.request('DELETE', path),
};

// Toast notifications
const toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(msg, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type]}</span> ${msg}`;
    this.container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
  },
  success: (m) => toast.show(m, 'success'),
  error:   (m) => toast.show(m, 'error'),
  info:    (m) => toast.show(m, 'info'),
};

// Helpers
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('kk-KZ', { day:'2-digit', month:'long', year:'numeric' });
}
function formatPrice(n) {
  return Number(n).toLocaleString('ru-KZ') + ' ₸';
}
function statusBadge(s) {
  const labels = { pending:'Күтілуде', confirmed:'Расталды', cancelled:'Бас тартылды', completed:'Аяқталды' };
  return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
}
function roleBadge(r) {
  const labels = { admin:'Әкімші', master:'Шебер', user:'Клиент' };
  return `<span class="badge badge-${r}">${labels[r] || r}</span>`;
}
function initials(name) {
  return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}
function stars(rating) {
  const n = Math.round(rating||0);
  return '★'.repeat(n) + '☆'.repeat(5-n);
}
