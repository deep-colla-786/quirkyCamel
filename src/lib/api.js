// JSON fetch helper for /api/*. The session lives in an HttpOnly cookie, which
// the browser sends automatically on same-origin requests.
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    return { ok: false, status: 0, data: { error: 'Could not reach the server. Check your connection.' } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const authApi = {
  me: () => api('/auth/me'),
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (fields) => api('/auth/signup', { method: 'POST', body: fields }),
  logout: () => api('/auth/logout', { method: 'POST', body: {} })
};

export const ordersApi = {
  list: () => api('/orders'),
  createDemo: (items, customer) => api('/orders/demo', { method: 'POST', body: { items, customer } })
};

export const adminApi = {
  stats: () => api('/admin/stats'),
  users: (q = '') => api('/admin/users' + (q ? '?q=' + encodeURIComponent(q) : '')),
  logins: () => api('/admin/logins'),
  orders: () => api('/admin/orders'),
  products: () => api('/admin/products'),
  createProduct: (fields) => api('/admin/products', { method: 'POST', body: fields }),
  updateProduct: (slug, fields) => api('/admin/products/' + encodeURIComponent(slug), { method: 'PUT', body: fields }),
  deleteProduct: (slug) => api('/admin/products/' + encodeURIComponent(slug), { method: 'DELETE' }),
  upload: (dataUrl) => api('/admin/upload', { method: 'POST', body: { dataUrl } }),
  resendEmails: (orderId) => api('/admin/orders/' + encodeURIComponent(orderId) + '/resend', { method: 'POST', body: {} }),
  mailStatus: () => api('/admin/mail-status'),
  testEmail: (to) => api('/admin/test-email', { method: 'POST', body: { to } })
};
