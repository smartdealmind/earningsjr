import { useEffect, useState } from 'react';
import { Api } from './api';

export default function Approvals() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const j = await Api.listChores('submitted');
    setRows(j.chores || []);
  }
  useEffect(() => { load(); }, []);

  async function doApprove(id: string) {
    const r = await Api.approve(id);
    setMsg(r.ok ? 'Approved' : 'Error approving');
    await load();
  }
  async function doDeny(id: string) {
    const r = await Api.deny(id);
    setMsg(r.ok ? 'Denied' : 'Error denying');
    await load();
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h1>Parent Approvals</h1>
      {rows.length === 0 && <p>No submitted chores.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map(c => (
          <li key={c.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{c.title}</div>
              <div style={{ fontSize: 12, opacity: .8 }}>
                {c.category || 'general'} • {c.points} pts • {c.is_required ? 'required' : 'paid'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => doApprove(c.id)}>Approve</button>
              <button onClick={() => doDeny(c.id)}>Deny</button>
            </div>
          </li>
        ))}
      </ul>
      {msg && <div>{msg}</div>}
    </div>
  );
}

