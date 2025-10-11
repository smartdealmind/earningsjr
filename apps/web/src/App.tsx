import { useEffect, useState } from 'react';
import { api } from './api';

export default function App() {
  const [health, setHealth] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [email, setEmail] = useState('parent1@example.com');
  const [password, setPassword] = useState('Test123!');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    api('/healthz').then(r => r.json()).then(setHealth).catch(() => setHealth({ ok:false }));
    api('/me').then(r => r.json()).then(setMe).catch(() => setMe(null));
  }, []);

  async function onRegister() {
    setLoading(true); setMsg('');
    const res = await api('/auth/register-parent', { method: 'POST', body: JSON.stringify({ email, password, family_name: 'My Family' }) });
    const j = await res.json();
    setLoading(false);
    setMsg(res.ok ? 'Registered + logged in' : `Error: ${j.error || res.status}`);
    if (res.ok) {
      const meRes = await api('/me');
      setMe(await meRes.json());
    }
  }

  async function onLogin() {
    setLoading(true); setMsg('');
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const j = await res.json();
    setLoading(false);
    setMsg(res.ok ? 'Logged in' : `Error: ${j.error || res.status}`);
    if (res.ok) {
      const meRes = await api('/me');
      setMe(await meRes.json());
    }
  }

  async function onLogout() {
    setLoading(true); setMsg('');
    await api('/auth/logout', { method: 'POST' });
    setLoading(false);
    setMsg('Logged out');
    setMe(null);
  }

  return (
    <div style={{ maxWidth: 720, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>ChoreCoins — MVP</h1>

      <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
        <h2>Health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
        <h2>Auth</h2>
        <div style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
          <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={loading} onClick={onRegister}>Register Parent</button>
            <button disabled={loading} onClick={onLogin}>Login</button>
            <button disabled={loading} onClick={onLogout}>Logout</button>
          </div>
          {msg && <div>{msg}</div>}
        </div>
      </section>

      <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
        <h2>/me</h2>
        <pre>{JSON.stringify(me, null, 2)}</pre>
      </section>
    </div>
  );
}
