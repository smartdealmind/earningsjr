import { useEffect, useState } from 'react';
import { Api } from './api';

export default function Rules() {
  const [r, setR] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { Api.rules().then(j => setR(j.rules)); }, []);

  async function save() {
    const res = await Api.updateRules(r);
    setMsg(res.ok ? 'Saved' : ('Error: ' + (res.error || '')));
  }

  if (!r) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <h1>Family Rules</h1>
      <div style={{ display:'grid', gap:12 }}>
        <label>Points per Currency (100 pts = $1): 
          <input type="number" value={r.points_per_currency} onChange={e => setR({ ...r, points_per_currency: parseInt(e.target.value||'0',10) })} />
        </label>
        <label>Currency Code:
          <input value={r.currency_code} onChange={e => setR({ ...r, currency_code: e.target.value })} />
        </label>
        <label>Rounding:
          <select value={r.rounding} onChange={e => setR({ ...r, rounding: e.target.value })}>
            <option value="down">down</option>
            <option value="nearest">nearest</option>
            <option value="up">up</option>
          </select>
        </label>
        <label>Weekly Allowance (points):
          <input type="number" value={r.weekly_allowance_points} onChange={e => setR({ ...r, weekly_allowance_points: parseInt(e.target.value||'0',10) })} />
        </label>
        <label>Required chores minimum (%):
          <input type="number" value={r.required_task_min_pct} onChange={e => setR({ ...r, required_task_min_pct: parseInt(e.target.value||'0',10) })} />
        </label>
        <div>
          <button onClick={save}>Save</button>
          {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}

