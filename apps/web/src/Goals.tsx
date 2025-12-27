import { useEffect, useState } from 'react';
import { Api } from './api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(2000); // cents
  const [elig, setElig] = useState<any>(null);
  const [reqMsg, setReqMsg] = useState('');
  const [me, setMe] = useState<any>(null);

  // Get current user ID (kid routes use current user)
  useEffect(() => {
    Api.me().then(setMe).catch(() => {});
  }, []);

  async function load() {
    if (!me?.id) return; // Wait for user data
    
    try {
      // For kid routes, use current user ID
      const g = await Api.goalsList(me.id);
      setGoals(g.goals || []);
      
      const e = await Api.eligibility(me.id);
      if (e.ok) {
        setElig(e);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
      toast.error('Failed to load goals');
    }
  }
  useEffect(() => { load(); }, [me]);

  async function create() {
    if (!title) {
      toast.error('Please enter a goal title');
      return;
    }
    const r = await Api.goalCreate({ title, target_amount_cents: amount });
    if (r.ok) {
      setTitle('');
      toast.success('Goal created!');
      await load();
    } else {
      toast.error('Failed to create goal');
    }
  }

  async function cancel(id: string) {
    await Api.goalCancel(id);
    toast.success('Goal cancelled');
    await load();
  }

  async function requestExtra() {
    const r = await Api.requestsCreate({
      title: `Extra task toward "${title || (goals[0]?.title || 'my goal')}"`,
      description: 'I would like to do an extra task to earn more points.',
      suggested_points: 20
    });
    if (r.ok) {
      toast.success('Request sent!');
      setReqMsg('Request sent!');
    } else {
      toast.error('Failed to send request');
      setReqMsg('Error: ' + (r.error || ''));
    }
  }

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-6">
      {elig && elig.ratio && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Eligibility:</span>
              <span className={elig.eligible ? 'text-green-600' : 'text-red-600'}>
                {elig.eligible ? '✅ Unlocked' : '⛔ Locked'}
              </span>
              <span className="text-sm text-muted-foreground">
                — Required ratio {elig.ratio.pct}% / minimum {elig.min_required_pct}% (last 7 days)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Goal title (e.g., New bike)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            placeholder="Target amount (cents)"
            type="number"
            value={amount}
            onChange={e => setAmount(parseInt(e.target.value || '0', 10))}
          />
          <div className="flex gap-2">
            <Button onClick={create}>Save Goal</Button>
            <Button variant="outline" onClick={requestExtra}>
              Request Extra Task
            </Button>
          </div>
          {reqMsg && <p className="text-sm text-muted-foreground">{reqMsg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals yet. Create one above!</p>
          ) : (
            <ul className="space-y-3">
              {goals.map(g => (
                <li key={g.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="font-semibold text-foreground">{g.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Target: ${(g.target_amount_cents / 100).toFixed(2)} {g.currency_code} • 
                    Target pts: {g.target_points} • Current: {g.current_points} • 
                    Remaining: {g.remaining_points}
                    {g.status === 'active' && (
                      <> • ETA: {g.eta_days} days (avg {g.avg_pts_per_day}/day)</>
                    )}
                  </div>
                  {g.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => cancel(g.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

