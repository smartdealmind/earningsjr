import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from './api';
import { useActingAs } from '@/contexts/ActingAsContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KidDashboard() {
  const [me, setMe] = useState<any>(null);
  const [chores, setChores] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const { actingAsKidId } = useActingAs();

  async function load() {
    setMe(await Api.me());
    const j = await fetchChores();
    setChores(j);
  }
  async function fetchChores() {
    const j = await (await fetch(`${import.meta.env.VITE_API_BASE}/chores`, { credentials: 'include' })).json();
    return j.chores || [];
  }

  useEffect(() => { load(); }, [actingAsKidId]);

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
    if (r.ok) {
      if (actingAsKidId) {
        toast.success('Chore completed and auto-approved! Points added.');
      } else {
        toast.success('Chore submitted! Waiting for parent approval.');
      }
      setMsg('');
    } else {
      toast.error('Failed to submit chore');
      setMsg('Error');
    }
    await load();
  }

  return (
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white relative z-10">Kid Dashboard</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      {!me?.authenticated || (me?.user?.role !== 'kid' && !actingAsKidId) ? (
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
          <div className="text-emerald-400 text-base md:text-lg mb-4 md:mb-6">Hi, <span className="text-white font-semibold">{me?.user?.first_name || me?.user?.email}</span>!</div>
          
          {/* Three Main Cards: Goals, Achievements, Chores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <Link to="/goals">
              <Card className="card-glass hover:bg-zinc-800/60 transition cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    My Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">View and manage your savings goals</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/achievements">
              <Card className="card-glass hover:bg-zinc-800/60 transition cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">See your badges and stats</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="card-glass h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Your Chores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 mb-2">
                  {chores.length === 0 
                    ? 'No chores available' 
                    : `${chores.length} chore${chores.length === 1 ? '' : 's'} available`}
                </p>
                {chores.length > 0 && (
                  <p className="text-xs text-emerald-400">
                    {chores.filter((c: any) => c.status === 'open').length} open • {chores.filter((c: any) => c.status === 'claimed').length} claimed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Your Chores</h2>
          
          <div className="space-y-2 md:space-y-3">
            {chores.map(c => (
              <div key={c.id} className="card-glass p-3 md:p-4 hover:bg-zinc-800/40 transition-colors">
                {/* Line 1: Title + Points */}
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <h3 className="font-semibold text-white text-base md:text-lg flex-1">{c.title}</h3>
                  <span className="text-emerald-400 font-bold text-base md:text-lg ml-2">{c.points} pts</span>
                </div>
                
                {/* Line 2: Meta info (compact horizontal) */}
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-400 mb-2 md:mb-3 flex-wrap">
                  <span>{c.category || 'general'}</span>
                  <span>•</span>
                  <span className={c.is_required ? 'text-amber-400' : 'text-zinc-400'}>
                    {c.is_required ? 'required' : 'paid'}
                  </span>
                  {actingAsKidId && ['open','claimed'].includes(c.status) && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">✓ Auto-approves</span>
                    </>
                  )}
                </div>
                
                {/* Line 3: Action buttons */}
                <div className="flex gap-2">
                  {c.status === 'open' && (
                    <button 
                      className="btn-glass flex-1 text-sm md:text-base py-2 px-3 md:px-4" 
                      onClick={() => claim(c.id)}
                    >
                      Claim
                    </button>
                  )}
                  {['open','claimed'].includes(c.status) && (
                    <button 
                      className="btn-glass flex-1 text-sm md:text-base py-2 px-3 md:px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40" 
                      onClick={() => submit(c.id)}
                    >
                      {actingAsKidId ? 'Complete' : 'Submit'}
                    </button>
                  )}
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
