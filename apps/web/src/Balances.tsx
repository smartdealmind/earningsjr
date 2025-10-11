import { useEffect, useState } from 'react';
import { Api } from './api';
import { Button } from '@/components/ui/button';
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

  return (
    <div style={{ maxWidth: 900, margin:'2rem auto' }}>
      <h1>Family Balances</h1>

      <section style={{ border:'1px solid #eee', borderRadius:8, padding:16, marginBottom:16 }}>
        <h2>Kids</h2>
        <ul style={{ listStyle:'none', padding:0 }}>
          {kids.map(k => (
            <li key={k.kid_user_id} style={{ padding:'8px 0', display:'flex', gap:12, alignItems:'center' }}>
              <button onClick={() => setSelectedKid(k.kid_user_id)}>{k.display_name}</button>
              <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                <span>{k.points_balance} pts</span>
                <Button size="sm" variant="outline" onClick={() => makeChart(k.kid_user_id)}>
                  📊 Reward Chart
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border:'1px solid #eee', borderRadius:8, padding:16, marginBottom:16 }}>
        <h2>Converter</h2>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="number" value={points} onChange={e => setPoints(parseInt(e.target.value || '0',10))} />
          <button onClick={convert}>Convert → $</button>
          {quote && <div style={{ marginLeft: 12 }}>
            ≈ {(quote.amount_cents/100).toFixed(2)} {quote.currency}
          </div>}
        </div>
        {msg && <div>{msg}</div>}
      </section>

      <section style={{ border:'1px solid #eee', borderRadius:8, padding:16 }}>
        <h2>Ledger {selectedKid && `— ${kids.find(k => k.kid_user_id===selectedKid)?.display_name}`}</h2>
        <ul style={{ listStyle:'none', padding:0 }}>
          {ledger.map(l => (
            <li key={l.id} style={{ display:'flex', gap:12, padding:'6px 0', borderBottom:'1px solid #f3f3f3' }}>
              <div style={{ width:90 }}>{(l.delta_points > 0 ? '+' : '') + l.delta_points} pts</div>
              <div style={{ flex:1 }}>{l.reason}</div>
              <div style={{ opacity:.7 }}>{new Date(l.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

