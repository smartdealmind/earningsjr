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
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">Kid Dashboard</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      {!me?.authenticated || me?.user?.role !== 'kid' ? (
        <div className="card-glass p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-white mb-4">Kid Login (PIN)</h2>
          <div className="space-y-3">
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
              placeholder="Your name (display name)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
              placeholder="PIN" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              type="password" 
            />
            <button className="btn-glass w-full" onClick={doKidLogin}>Login</button>
            {msg && <div className="text-zinc-300 text-sm text-center">{msg}</div>}
          </div>
        </div>
      ) : (
        <>
          <div className="text-emerald-400 text-lg mb-6">Hi, <span className="text-white font-semibold">{me?.user?.first_name || me?.user?.email}</span>!</div>
          
          <h2 className="text-2xl font-semibold text-white mb-4">Your Chores</h2>
          
          <div className="space-y-3">
            {chores.map(c => (
              <div key={c.id} className="card-glass p-4 hover:scale-[1.01] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg">{c.title}</div>
                    <div className="text-sm text-zinc-400 mt-1">
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        <span>{c.category || 'general'}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{c.points} pts</span>
                        <span>•</span>
                        <span className={c.is_required ? 'text-amber-400' : 'text-zinc-400'}>
                          {c.is_required ? 'required' : 'paid'}
                        </span>
                        <span>•</span>
                        <span className="text-zinc-300">status: <span className="font-medium">{c.status}</span></span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.status === 'open' && <button className="btn-glass" onClick={() => claim(c.id)}>Claim</button>}
                    {['open','claimed'].includes(c.status) && <button className="btn-glass" onClick={() => submit(c.id)}>Submit</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {chores.length === 0 && (
            <p className="text-zinc-400 text-center py-8">No chores available. Check back later!</p>
          )}
          
          {msg && (
            <div className="mt-6 p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/50 text-zinc-200 backdrop-blur-md text-center">
              {msg}
            </div>
          )}
        </>
      )}
    </div>
  );
}
