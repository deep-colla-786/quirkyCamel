// JSON fetch helper for /api/*. Sessions live in HttpOnly cookies, which the browser
// sends automatically on same-origin requests (the admin cookie only to /api/admin).

// Fired when a request is refused because the session has ended (expired, logged out
// elsewhere, or ended from the admin panel). detail.area is 'store' or 'admin'.
export const SESSION_ENDED_EVENT = 'qc:session-ended';

const isAuthCall = (path) => path.includes('/auth/');
const jsonInit = (method, body) =>
  body === undefined
    ? { method }
    : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, jsonInit(method, body));
  } catch {
    return { ok: false, status: 0, data: { error: 'Could not reach the server. Check your connection.' } };
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !isAuthCall(path)) {
    const area = path.startsWith('/admin/') ? 'admin' : 'store';
    globalThis.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: { area } }));
  }
  return { ok: res.ok, status: res.status, data };
}

const post = (path, body = {}) => api(path, { method: 'POST', body });
const enc = encodeURIComponent;

export const authApi = {
  me: () => api('/auth/me'),
  login: (email, password) => post('/auth/login', { email, password }),
  signup: (fields) => post('/auth/signup', fields),
  logout: () => post('/auth/logout'),
  logoutAll: () => post('/auth/logout-all')
};

export const ordersApi = {
  list: () => api('/orders'),
  createDemo: (items, customer) => post('/orders/demo', { items, customer })
};

export const adminApi = {
  me: () => api('/admin/auth/me'),
  login: (email, password) => post('/admin/auth/login', { email, password }),
  logout: () => post('/admin/auth/logout'),
  stats: () => api('/admin/stats'),
  users: (q = '') => {
    const query = q ? `?q=${enc(q)}` : '';
    return api(`/admin/users${query}`);
  },
  logins: () => api('/admin/logins'),
  sessions: () => api('/admin/sessions'),
  endSession: (id) => api(`/admin/sessions/${enc(id)}`, { method: 'DELETE' }),
  endUserSessions: (userId) => api(`/admin/users/${enc(userId)}/sessions`, { method: 'DELETE' }),
  orders: () => api('/admin/orders'),
  invoice: (orderId) => api(`/admin/orders/${enc(orderId)}/invoice`),
  products: () => api('/admin/products'),
  createProduct: (fields) => post('/admin/products', fields),
  updateProduct: (slug, fields) => api(`/admin/products/${enc(slug)}`, { method: 'PUT', body: fields }),
  deleteProduct: (slug) => api(`/admin/products/${enc(slug)}`, { method: 'DELETE' }),
  upload: (dataUrl) => post('/admin/upload', { dataUrl }),
  resendEmails: (orderId) => post(`/admin/orders/${enc(orderId)}/resend`),
  mailStatus: () => api('/admin/mail-status'),
  testEmail: (to) => post('/admin/test-email', { to })
};
