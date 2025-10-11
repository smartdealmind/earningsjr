import { useEffect, useState } from 'react';
import { Api } from './api';

export default function Requests() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const j = await Api.requestsList('pending');
    setRows(j.requests || []);
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) { const r = await Api.requestsApprove(id); setMsg(r.ok?'Approved':'Error'); await load(); }
  async function deny(id: string) { const r = await Api.requestsDeny(id); setMsg(r.ok?'Denied':'Error'); await load(); }

  return (
    <div style={{ maxWidth: 900, margin:'2rem auto' }}>
      <h1>Kid Requests</h1>
      {rows.length === 0 && <p>No pending requests.</p>}
      <ul style={{ listStyle:'none', padding:0 }}>
        {rows.map(r => (
          <li key={r.id} style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:8, display:'flex', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700 }}>{r.title}</div>
              <div style={{ fontSize:12, opacity:.8 }}>{r.description}</div>
              <div style={{ fontSize:12 }}>Suggested: {r.suggested_points ?? '—'} pts</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => approve(r.id)}>Approve</button>
              <button onClick={() => deny(r.id)}>Deny</button>
            </div>
          </li>
        ))}
      </ul>
      {msg && <div>{msg}</div>}
    </div>
  );
}

