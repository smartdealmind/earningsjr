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
    <div className="section-glass max-w-6xl mx-auto">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-white relative z-10">Parent Approvals</h1>
        <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
      </div>

      {rows.length === 0 && <p className="text-zinc-400 text-center py-8">No submitted chores awaiting approval.</p>}
      
      <div className="space-y-3">
        {rows.map(c => (
          <div key={c.id} className="card-glass p-4 hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-white text-lg">{c.title}</div>
                <div className="text-sm text-zinc-400 mt-1">
                  <span className="inline-flex items-center gap-2">
                    <span>{c.category || 'general'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{c.points} pts</span>
                    <span>•</span>
                    <span className={c.is_required ? 'text-amber-400' : 'text-zinc-400'}>
                      {c.is_required ? 'required' : 'paid'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-glass" onClick={() => doApprove(c.id)}>Approve</button>
                <button className="btn-glass-secondary" onClick={() => doDeny(c.id)}>Deny</button>
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
