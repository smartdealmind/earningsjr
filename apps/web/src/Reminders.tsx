import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE;

export default function Reminders() {
  const [prefs, setPrefs] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [prefsRes, remindersRes] = await Promise.all([
        fetch(`${API}/reminders/prefs`, { credentials: 'include' }),
        fetch(`${API}/reminders`, { credentials: 'include' })
      ]);
      
      if (prefsRes.ok) {
        const j = await prefsRes.json();
        setPrefs(j.prefs || []);
      } else {
        const err = await prefsRes.json().catch(() => ({}));
        if (prefsRes.status !== 404) {
          console.error('Failed to load reminder prefs:', err);
        }
      }
      
      if (remindersRes.ok) {
        const j = await remindersRes.json();
        setReminders(j.reminders || []);
      } else {
        const err = await remindersRes.json().catch(() => ({}));
        if (remindersRes.status === 500) {
          console.error('Reminders endpoint error:', err);
          toast.error('Failed to load reminders. Please try again.');
        } else if (remindersRes.status !== 404) {
          console.error('Failed to load reminders:', err);
        }
      }
    } catch (err) {
      console.error('Network error loading reminders:', err);
      toast.error('Network error loading reminders');
    } finally {
      setLoading(false);
    }
  }

  async function ackReminder(id: string) {
    const res = await fetch(`${API}/reminders/${id}/ack`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      toast.success('Reminder acknowledged');
      load();
    } else {
      toast.error('Failed to acknowledge');
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto my-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading reminders...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Reminder Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {prefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No kids added yet. Add kids from the Onboarding page.</p>
          ) : (
            <ul className="space-y-3">
              {prefs.map((pref: any) => (
                <PrefRow key={pref.kid_user_id} pref={pref} onSave={load} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.filter(r => r.status === 'new').length === 0 ? (
            <p className="text-sm text-muted-foreground">No new reminders</p>
          ) : (
            <ul className="space-y-2">
              {reminders.filter(r => r.status === 'new').map((rem: any) => (
                <li key={rem.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{rem.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rem.display_name} • {new Date(rem.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => ackReminder(rem.id)}>
                    Acknowledge
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrefRow({ pref, onSave }: { pref: any; onSave: () => void }) {
  const [enabled, setEnabled] = useState(!!pref.enabled);
  const [hour, setHour] = useState(pref.hour_local ?? 19);
  const [minute, setMinute] = useState(pref.minute_local ?? 0);
  const [tz, setTz] = useState(pref.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [days, setDays] = useState(pref.days_mask ?? 127);

  async function save() {
    const res = await fetch(`${API}/reminders/prefs`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        kid_user_id: pref.kid_user_id, 
        enabled, 
        hour_local: hour, 
        minute_local: minute, 
        timezone: tz, 
        days_mask: days 
      })
    });
    
    if (res.ok) {
      toast.success('Reminder preference saved');
      onSave();
    } else {
      toast.error('Failed to save');
    }
  }

  return (
    <li className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="font-medium w-32">{pref.display_name}</div>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={e => setEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Enabled</span>
        </label>
        
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            min={0} 
            max={23} 
            value={hour} 
            onChange={e => setHour(parseInt(e.target.value || '0', 10))} 
            className="w-16 border border-input rounded px-2 py-1 bg-background text-sm"
          />
          <span className="text-muted-foreground">:</span>
          <input 
            type="number" 
            min={0} 
            max={59} 
            value={minute} 
            onChange={e => setMinute(parseInt(e.target.value || '0', 10))} 
            className="w-16 border border-input rounded px-2 py-1 bg-background text-sm"
          />
        </div>
        
        <select 
          value={tz} 
          onChange={e => setTz(e.target.value)} 
          className="border border-input rounded px-2 py-1 bg-background text-sm"
        >
          <option>America/New_York</option>
          <option>America/Chicago</option>
          <option>America/Denver</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
          <option>Europe/Berlin</option>
          <option>Asia/Tokyo</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Days:</span>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <button 
            key={i} 
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              days & (1 << i) 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'border-input hover:bg-muted'
            }`}
            onClick={() => setDays(days ^ (1 << i))}
          >
            {d}
          </button>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button size="sm" onClick={save}>Save</Button>
      </div>
    </li>
  );
}

