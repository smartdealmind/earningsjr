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
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">Kid Requests</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      {rows.length === 0 && <p className="text-zinc-400 text-center py-8">No pending requests.</p>}
      
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="card-glass p-4 hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-white text-lg">{r.title}</div>
                <div className="text-sm text-zinc-400 mt-1">{r.description}</div>
                <div className="text-sm text-emerald-400 mt-2">
                  Suggested: {r.suggested_points ?? '—'} pts
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-glass" onClick={() => approve(r.id)}>Approve</button>
                <button className="btn-glass-secondary" onClick={() => deny(r.id)}>Deny</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mt-6 p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/50 text-zinc-200 backdrop-blur-md text-center">
          {msg}
        </div>
      )}
    </div>
  );
}
