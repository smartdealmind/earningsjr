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
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h1>ChoreCoins Onboarding</h1>
      <p>Logged in as: {me?.user?.email}</p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h2>1) Create a Kid</h2>
          <input placeholder="Kid display name" value={kidName} onChange={e => setKidName(e.target.value)} />
          <input placeholder="Birthdate (YYYY-MM-DD)" value={kidDob} onChange={e => setKidDob(e.target.value)} />
          <input placeholder="PIN (optional)" value={kidPin} onChange={e => setKidPin(e.target.value)} />
          <button onClick={createKid}>Create Kid</button>
          {kidId && <div>Kid ID: {kidId}</div>}
        </section>

        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h2>2) Pick Starter Templates</h2>
          <label>Age: <input type="number" value={age} min={4} max={17} onChange={e => setAge(parseInt(e.target.value,10))} /></label>
          <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #ddd', borderRadius: 6, padding: 8, marginTop: 8 }}>
            {templates.map(t => (
              <label key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 4px' }}>
                <input type="checkbox" checked={picked.has(t.id)} onChange={() => toggle(t.id)} />
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                <div style={{ marginLeft: 'auto', opacity: .7 }}>{t.default_points} pts {t.is_required_default ? '(required)' : ''}</div>
              </label>
            ))}
          </div>
          <button onClick={seedChores} disabled={!kidId}>Create Chores</button>
        </section>
      </div>

      {msg && <div style={{ marginTop: 16 }}>{msg}</div>}
    </div>
  );
}

