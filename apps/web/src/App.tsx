import { useEffect, useState } from 'react';
import { api } from './api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Block({title, children}:{title:string, children:React.ReactNode}) {
  return (
    <Card className="mb-4">
      <CardHeader><CardTitle className="tracking-tight">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export default function App() {
  const [health, setHealth] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [email, setEmail] = useState('parent1@example.com');
  const [password, setPassword] = useState('Test123!');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    api('/healthz').then(r => r.json()).then(setHealth).catch(() => setHealth({ ok:false }));
    api('/me').then(r => r.json()).then(setMe).catch(() => setMe(null));
  }, []);

  async function onRegister() {
    setLoading(true); setMsg('');
    const res = await api('/auth/register-parent', { method: 'POST', body: JSON.stringify({ email, password, family_name: 'My Family' }) });
    const j = await res.json();
    setLoading(false);
    setMsg(res.ok ? 'Registered + logged in' : `Error: ${j.error || res.status}`);
    if (res.ok) {
      const meRes = await api('/me');
      setMe(await meRes.json());
    }
  }

  async function onLogin() {
    setLoading(true); setMsg('');
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const j = await res.json();
    setLoading(false);
    setMsg(res.ok ? 'Logged in' : `Error: ${j.error || res.status}`);
    if (res.ok) {
      const meRes = await api('/me');
      setMe(await meRes.json());
    }
  }

  async function onLogout() {
    setLoading(true); setMsg('');
    await api('/auth/logout', { method: 'POST' });
    setLoading(false);
    setMsg('Logged out');
    setMe(null);
  }

  const Pre = ({ json }: { json: any }) => (
    <pre className="text-sm leading-relaxed bg-muted text-foreground p-3 rounded-md overflow-auto border border-border">
      {JSON.stringify(json, null, 2)}
    </pre>
  );

  return (
    <div className="max-w-3xl mx-auto my-8">
      <h1 className="text-2xl font-semibold mb-4 tracking-tight">EarningsJr — MVP</h1>

      <Block title="Health">
        <Pre json={health} />
      </Block>

      <Block title="Auth">
        <div className="grid gap-2 max-w-md">
          <Input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button disabled={loading} onClick={onRegister}>Register Parent</Button>
            <Button variant="outline" disabled={loading} onClick={onLogin}>Login</Button>
            <Button variant="outline" disabled={loading} onClick={onLogout}>Logout</Button>
          </div>
          {msg && <div className="text-sm">{msg}</div>}
        </div>
      </Block>

      <Block title="/me">
        <Pre json={me} />
      </Block>
    </div>
  );
}
