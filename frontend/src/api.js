// Talks to the Express REST API over HTTPS/JSON
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const session = {
  get token() { return localStorage.getItem('t'); },
  get user() { return JSON.parse(localStorage.getItem('u') || 'null'); },
  set(t, u) { localStorage.setItem('t', t); localStorage.setItem('u', JSON.stringify(u)); },
  clear() { localStorage.clear(); }
};
export async function api(path, method = 'GET', body) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(session.token && { Authorization: 'Bearer ' + session.token }) }, body: body && JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
