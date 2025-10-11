import { useEffect, useState } from 'react';
import { Api } from './api';

export default function Onboarding() {
  const [me, setMe] = useState<any>(null);
  const [age, setAge] = useState<number>(8);
  const [templates, setTemplates] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [kidName, setKidName] = useState('');
  const [kidDob, setKidDob] = useState('');
  const [kidPin, setKidPin] = useState('');
  const [kidId, setKidId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { Api.me().then(setMe); }, []);
  useEffect(() => { Api.templates(age).then(j => setTemplates(j.templates || [])); }, [age]);

  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  }

  async function createKid() {
    setMsg('Creating kid...');
    const r = await Api.createKid(kidName || 'Kid', kidDob || undefined, kidPin || undefined);
    if (r.ok) { setKidId(r.kid_user_id); setMsg('Kid created'); }
    else setMsg('Error: ' + (r.error || 'unknown'));
  }

  async function seedChores() {
    if (!kidId) { setMsg('Create kid first'); return; }
    if (picked.size === 0) { setMsg('Pick at least one template'); return; }
    setMsg('Creating chores...');
    const r = await Api.createChoresFromTemplates([...picked], kidId);
    setMsg(r.ok ? `Created ${r.chore_ids.length} chores` : 'Error: ' + (r.error || 'unknown'));
  }

  return (
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">ChoreCoins Onboarding</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>
      <p className="text-zinc-400 mb-8">Logged in as: <span className="text-zinc-200">{me?.user?.email}</span></p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-glass p-6">
          <h2 className="text-xl font-semibold text-white mb-4">1) Create a Kid</h2>
          <div className="space-y-3">
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
              placeholder="Kid display name" 
              value={kidName} 
              onChange={e => setKidName(e.target.value)} 
            />
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
              placeholder="Birthdate (YYYY-MM-DD)" 
              value={kidDob} 
              onChange={e => setKidDob(e.target.value)} 
            />
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
              placeholder="PIN (optional)" 
              value={kidPin} 
              onChange={e => setKidPin(e.target.value)} 
            />
            <button className="btn-glass w-full" onClick={createKid}>Create Kid</button>
            {kidId && <div className="text-emerald-400 text-sm">Kid ID: {kidId}</div>}
          </div>
        </div>

        <div className="card-glass p-6">
          <h2 className="text-xl font-semibold text-white mb-4">2) Pick Starter Templates</h2>
          <label className="flex items-center gap-2 mb-4 text-zinc-300">
            Age: 
            <input 
              type="number" 
              value={age} 
              min={4}
              max={17}
              onChange={e => setAge(parseInt(e.target.value,10))} 
              className="w-20 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-1 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </label>
          <div className="max-h-64 overflow-auto rounded-lg border border-zinc-700/40 bg-zinc-900/20 p-2 mb-4">
            {templates.map(t => (
              <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={picked.has(t.id)} 
                  onChange={() => toggle(t.id)} 
                  className="w-4 h-4 text-emerald-500 rounded border-zinc-600 bg-zinc-800 focus:ring-emerald-500"
                />
                <div className="font-semibold text-zinc-200">{t.title}</div>
                <div className="ml-auto text-zinc-400 text-sm">
                  {t.default_points} pts {t.is_required_default && <span className="text-emerald-400">(required)</span>}
                </div>
              </label>
            ))}
          </div>
          <button className="btn-glass w-full disabled:opacity-50 disabled:cursor-not-allowed" onClick={seedChores} disabled={!kidId}>
            Create Chores
          </button>
        </div>
      </div>

      {msg && <div className="mt-6 p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/50 text-zinc-200 backdrop-blur-md">{msg}</div>}
    </div>
  );
}
