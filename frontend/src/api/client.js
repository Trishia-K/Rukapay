const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ADMIN_KEY_STORAGE = 'rukatrack_admin_key';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

function adminHeaders() {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE);
  return key ? { 'x-admin-key': key } : {};
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  adminPost: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data), headers: adminHeaders() }),
  adminDelete: (path) => request(path, { method: 'DELETE', headers: adminHeaders() }),
  adminLogin: (password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  setAdminKey: (password) => localStorage.setItem(ADMIN_KEY_STORAGE, password),
  hasAdminKey: () => !!localStorage.getItem(ADMIN_KEY_STORAGE),
  clearAdminKey: () => localStorage.removeItem(ADMIN_KEY_STORAGE),
};