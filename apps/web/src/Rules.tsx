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

  if (!r) return <div className="text-zinc-400 text-center py-8">Loading...</div>;

  return (
    <div className="section-glass max-w-3xl mx-auto">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">Family Rules</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      <div className="card-glass p-6 space-y-5">
        <label className="block">
          <span className="text-zinc-300 font-medium mb-2 block">Points per Currency</span>
          <span className="text-zinc-500 text-sm block mb-2">e.g., 100 pts = $1</span>
          <input 
            type="number" 
            value={r.points_per_currency} 
            onChange={e => setR({ ...r, points_per_currency: parseInt(e.target.value||'0',10) })} 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </label>

        <label className="block">
          <span className="text-zinc-300 font-medium mb-2 block">Currency Code</span>
          <input 
            value={r.currency_code} 
            onChange={e => setR({ ...r, currency_code: e.target.value })} 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </label>

        <label className="block">
          <span className="text-zinc-300 font-medium mb-2 block">Rounding</span>
          <select 
            value={r.rounding} 
            onChange={e => setR({ ...r, rounding: e.target.value })} 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="down">down</option>
            <option value="nearest">nearest</option>
            <option value="up">up</option>
          </select>
        </label>

        <label className="block">
          <span className="text-zinc-300 font-medium mb-2 block">Weekly Allowance (points)</span>
          <input 
            type="number" 
            value={r.weekly_allowance_points} 
            onChange={e => setR({ ...r, weekly_allowance_points: parseInt(e.target.value||'0',10) })} 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </label>

        <label className="block">
          <span className="text-zinc-300 font-medium mb-2 block">Required chores minimum (%)</span>
          <input 
            type="number" 
            value={r.required_task_min_pct} 
            onChange={e => setR({ ...r, required_task_min_pct: parseInt(e.target.value||'0',10) })} 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </label>

        <div className="pt-4">
          <button className="btn-glass w-full" onClick={save}>Save Rules</button>
          {msg && <div className="mt-3 text-center text-emerald-400 text-sm">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
