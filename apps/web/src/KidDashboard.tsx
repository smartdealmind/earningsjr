import { useEffect, useState } from 'react';
import { Api } from './api';

export default function KidDashboard() {
  const [me, setMe] = useState<any>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  async function load() {
    setMe(await Api.me());
    const j = await fetchChores();
    setChores(j);
  }
  async function fetchChores() {
    const j = await (await fetch(`${import.meta.env.VITE_API_BASE}/chores`, { credentials: 'include' })).json();
    return j.chores || [];
  }

  useEffect(() => { load(); }, []);

  async function doKidLogin() {
    setMsg('Logging in...');
    const r = await Api.kidLogin({ display_name: name, pin });
    setMsg(r.ok ? 'Logged in' : `Error: ${r.error || 'login_failed'}`);
    if (r.ok) { await load(); }
  }

  async function claim(id: string) {
    setMsg('Claiming...');
    const r = await (await fetch(`${import.meta.env.VITE_API_BASE}/chores/${id}/claim`, { method: 'POST', credentials: 'include' })).json();
    setMsg(r.ok ? 'Claimed' : 'Error'); await load();
  }
  async function submit(id: string) {
    setMsg('Submitting...');
    const r = await (await fetch(`${import.meta.env.VITE_API_BASE}/chores/${id}/submit`, { method: 'POST', credentials: 'include' })).json();
    setMsg(r.ok ? 'Submitted' : 'Error'); await load();
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h1>Kid Dashboard</h1>

      {!me?.authenticated || me?.user?.role !== 'kid' ? (
        <section style={{ border:'1px solid #eee', padding: 16, borderRadius: 8 }}>
          <h2>Kid Login (PIN)</h2>
          <input placeholder="Your name (display name)" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} type="password" />
          <button onClick={doKidLogin}>Login</button>
          {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
        </section>
      ) : (
        <>
          <div>Hi, {me?.user?.first_name || me?.user?.email}</div>
          <h2>Your Chores</h2>
          <ul style={{ listStyle:'none', padding:0 }}>
            {chores.map(c => (
              <li key={c.id} style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:8, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>{c.title}</div>
                  <div style={{ fontSize:12, opacity:.8 }}>
                    {c.category || 'general'} • {c.points} pts • {c.is_required ? 'required' : 'paid'} • status: {c.status}
                  </div>
                </div>
                {c.status === 'open' && <button onClick={() => claim(c.id)}>Claim</button>}
                {['open','claimed'].includes(c.status) && <button onClick={() => submit(c.id)}>Submit</button>}
              </li>
            ))}
          </ul>
          {msg && <div>{msg}</div>}
        </>
      )}
    </div>
  );
}

