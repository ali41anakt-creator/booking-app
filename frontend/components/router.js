// ─── Simple Hash Router ───────────────────────────────────
const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path, params = {}) {
    window.location.hash = path;
  },

  resolve() {
    const hash = window.location.hash.replace('#', '') || '/';
    const [path, queryStr] = hash.split('?');
    const query = {};
    if (queryStr) queryStr.split('&').forEach(p => { const [k,v] = p.split('='); query[k] = decodeURIComponent(v||''); });

    const handler = this.routes[path] || this.routes['*'];
    if (handler) {
      this.current = path;
      handler({ path, query });
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },
};
