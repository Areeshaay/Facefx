import { useEffect, useState } from 'react';
import { api, session } from './api';
import Camera from './Camera';
import Gallery from './Gallery';
import Admin from './Admin';

function Login({ done }) {
  const [reg, setReg] = useState(false), [f, setF] = useState({}), [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault();
    try { const d = await api(reg ? '/auth/register' : '/auth/login', 'POST', f); session.set(d.token, d.user); done(d.user); }
    catch (x) { setErr(x.message); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card" onSubmit={go}><h2>{reg ? 'Create account' : 'Sign in'}</h2>
      {reg && <input placeholder="Name" onChange={set('name')} />}
      <input placeholder="Email" type="email" onChange={set('email')} /><input placeholder="Password" type="password" onChange={set('password')} />
      <button>{reg ? 'Sign up' : 'Sign in'}</button><p className="err">{err}</p>
      <a onClick={() => setReg(!reg)}>{reg ? 'Have an account? Sign in' : 'New here? Create account'}</a></form>
  );
}

export default function App() {
  const [user, setUser] = useState(session.user), [page, setPage] = useState('camera'), [filters, setFilters] = useState([]);
  const load = () => api('/filters').then(setFilters).catch(() => {});
  useEffect(() => { load(); }, []);
  const out = () => { session.clear(); setUser(null); setPage('camera'); };
  return (
    <div className="app">
      <header><b>🎭 FaceFX</b>
        <nav><button onClick={() => setPage('camera')}>Camera</button>
          {user && <button onClick={() => setPage('gallery')}>Gallery</button>}
          {user?.role === 'admin' && <button onClick={() => setPage('admin')}>Admin</button>}
          {user ? <button onClick={out}>Logout</button> : <button onClick={() => setPage('login')}>Login</button>}</nav></header>
      {page === 'camera' && <Camera filters={filters} />}
      {page === 'gallery' && <Gallery />}
      {page === 'admin' && <Admin reload={load} />}
      {page === 'login' && <Login done={u => { setUser(u); setPage('camera'); }} />}
    </div>
  );
}
