import { useEffect, useState } from 'react';
import { Api } from './api';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(2000); // cents
  const [elig, setElig] = useState<any>(null);
  const [reqMsg, setReqMsg] = useState('');

  async function load() {
    const g = await Api.goalsList(); setGoals(g.goals || []);
    const e = await Api.eligibility(); setElig(e);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const r = await Api.goalCreate({ title, target_amount_cents: amount });
    if (r.ok) { setTitle(''); await load(); }
  }
  async function cancel(id: string) {
    await Api.goalCancel(id); await load();
  }
  async function requestExtra() {
    const r = await Api.requestsCreate({
      title: `Extra task toward "${title || (goals[0]?.title || 'my goal')}"`,
      description: 'I would like to do an extra task to earn more points.',
      suggested_points: 20
    });
    setReqMsg(r.ok ? 'Request sent!' : ('Error: ' + (r.error || '')));
  }

  return (
    <div style={{ maxWidth: 900, margin:'2rem auto' }}>
      <h1>Your Goals</h1>

      {elig && (
        <div style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:16 }}>
          <strong>Eligibility</strong>: {elig.eligible ? '✅ Unlocked' : '⛔ Locked'} — Required ratio {elig.ratio.pct}% / minimum {elig.min_required_pct}% (last 7 days)
        </div>
      )}

      <section style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:16 }}>
        <h2>Create Goal</h2>
        <input placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} />
        <input placeholder="Target amount (cents)" type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value||'0',10))} />
        <button onClick={create}>Save Goal</button>
        <button onClick={requestExtra} style={{ marginLeft:8 }}>Request Extra Task</button>
        {reqMsg && <span style={{ marginLeft:8 }}>{reqMsg}</span>}
      </section>

      <section style={{ border:'1px solid #eee', borderRadius:8, padding:12 }}>
        <h2>My Goals</h2>
        <ul style={{ listStyle:'none', padding:0 }}>
          {goals.map(g => (
            <li key={g.id} style={{ borderBottom:'1px solid #f3f3f3', padding:'8px 0' }}>
              <div style={{ fontWeight:700 }}>{g.title}</div>
              <div style={{ fontSize:12, opacity:.8 }}>
                Target: {(g.target_amount_cents/100).toFixed(2)} {g.currency_code} • Target pts: {g.target_points} • Current: {g.current_points} • Remaining: {g.remaining_points}
                {g.status === 'active' && <> • ETA: {g.eta_days} days (avg {g.avg_pts_per_day}/day)</>}
              </div>
              {g.status === 'active' && <button onClick={() => cancel(g.id)}>Cancel</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

