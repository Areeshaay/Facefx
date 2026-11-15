import { useEffect, useState } from 'react';
import { api } from './api';

export default function Admin({ reload }) {
  const [stats, setStats] = useState(), [users, setUsers] = useState([]), [list, setList] = useState([]);
  const [f, setF] = useState({ name: '', type: 'overlay', config: '{"emoji":"🎩","anchor":"forehead","scale":1}' });
  const load = () => { api('/admin/stats').then(setStats); api('/admin/users').then(setUsers); api('/filters').then(setList); };
  useEffect(() => { load(); }, []);
  const add = async e => {
    e.preventDefault();
    try { await api('/filters', 'POST', { name: f.name, type: f.type, category: f.type, config: JSON.parse(f.config) }); load(); reload(); }
    catch (x) { alert(x.message); }
  };
  const delF = async id => { await api('/filters/' + id, 'DELETE'); load(); reload(); };
  const delU = async id => { await api('/admin/users/' + id, 'DELETE'); load(); };
  return (
    <div>
      {stats && <div className="stats"><div>Users<b>{stats.users}</b></div><div>Filters<b>{stats.filters}</b></div><div>Photos<b>{stats.photos}</b></div></div>}
      <form className="card" onSubmit={add}><h3>Add filter</h3>
        <input placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option>overlay</option><option>color</option><option>ai</option></select>
        <textarea rows="3" value={f.config} onChange={e => setF({ ...f, config: e.target.value })} /><button>Add</button></form>
      <h3>Filters</h3>{list.map(x => <p key={x._id}>{x.name} <small>({x.type})</small> <button onClick={() => delF(x._id)}>Delete</button></p>)}
      <h3>Users</h3>{users.map(u => <p key={u._id}>{u.name} <small>{u.email} · {u.role}</small> {u.role !== 'admin' && <button onClick={() => delU(u._id)}>Delete</button>}</p>)}
    </div>
  );
}
