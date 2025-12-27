import { useEffect, useState } from 'react';
import { Api } from './api';
import { toast } from 'sonner';

export default function Balances() {
  const [kids, setKids] = useState<any[]>([]);
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [ledger, setLedger] = useState<any[]>([]);
  const [points, setPoints] = useState<number>(250);
  const [quote, setQuote] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const j = await Api.kidsBalances();
    setKids(j.kids || []);
    if ((j.kids || []).length && !selectedKid) setSelectedKid(j.kids[0].kid_user_id);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => { if (selectedKid) Api.ledger(selectedKid).then(j => setLedger(j.ledger || [])); }, [selectedKid]);

  async function convert() {
    const q = await Api.exchangeQuote({ points });
    setQuote(q.ok ? q : null);
    if (!q.ok) setMsg(q.error || 'conversion_failed');
  }

  async function makeChart(kidId: string) {
    try {
      const r = await Api.generateChart(kidId);
      if (r.ok) {
        const url = `${import.meta.env.VITE_API_BASE}${r.url}`;
        window.open(url, '_blank');
        toast.success('Chart generated! Opening in new tab...');
      } else {
        toast.error('Failed to generate chart');
      }
    } catch (err) {
      toast.error('Error generating chart');
    }
  }

  // Format reason text to be human-readable
  function formatReason(reason: string): string {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Format date/time for mobile
  function formatDateTime(timestamp: number): { date: string; time: string } {
    const d = new Date(timestamp);
    const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { date, time };
  }

  return (
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white relative z-10">Family Balances</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      <div className="card-glass p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Kids</h2>
        <div className="space-y-2 md:space-y-3">
          {kids.map(k => (
            <div key={k.kid_user_id} className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-zinc-800/30 transition">
              <button 
                className="btn-glass-secondary text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
                onClick={() => setSelectedKid(k.kid_user_id)}
              >
                {k.display_name}
              </button>
              <div className="ml-auto flex items-center gap-2 md:gap-3 flex-shrink-0">
                <span className="text-emerald-400 font-semibold text-base md:text-lg">{k.points_balance} pts</span>
                <button 
                  className="btn-glass text-xs md:text-sm px-2 md:px-3 py-1"
                  onClick={() => makeChart(k.kid_user_id)}
                >
                  <span className="hidden sm:inline">📊 Reward Chart</span>
                  <span className="sm:hidden">📊</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Points Converter</h2>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <input 
            type="number" 
            value={points} 
            onChange={e => setPoints(parseInt(e.target.value || '0',10))} 
            className="w-24 md:w-32 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 md:px-4 py-2 text-zinc-100 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button className="btn-glass text-sm md:text-base px-3 md:px-4 py-2" onClick={convert}>Convert → $</button>
          {quote && (
            <div className="text-emerald-400 font-semibold text-base md:text-lg">
              ≈ ${(quote.amount_cents/100).toFixed(2)} {quote.currency}
            </div>
          )}
        </div>
        {msg && <div className="mt-2 md:mt-3 text-amber-400 text-xs md:text-sm">{msg}</div>}
      </div>

      <div className="card-glass p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">
          Ledger {selectedKid && `— ${kids.find(k => k.kid_user_id===selectedKid)?.display_name}`}
        </h2>
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 backdrop-blur overflow-hidden">
          {ledger.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-zinc-400 text-sm md:text-base">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800/40">
              {ledger.map(l => {
                const { date, time } = formatDateTime(l.created_at);
                return (
                  <div key={l.id} className="flex items-center gap-2 md:gap-4 p-2 md:p-3 hover:bg-zinc-800/20 transition">
                    <div className={`font-semibold text-sm md:text-base flex-shrink-0 ${l.delta_points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {l.delta_points > 0 ? '+' : ''}{l.delta_points} pts
                    </div>
                    <div className="flex-1 text-zinc-200 text-sm md:text-base min-w-0 truncate">{formatReason(l.reason)}</div>
                    <div className="flex flex-col items-end text-zinc-400 text-xs flex-shrink-0">
                      <span className="whitespace-nowrap">{date}</span>
                      <span className="whitespace-nowrap">{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
