import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE;

export default function Achievements() {
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    setLoading(true);
    try {
      // Get current user ID first (kid routes use current user)
      const meRes = await fetch(`${API}/me`, { credentials: 'include' });
      if (!meRes.ok) {
        toast.error('Failed to load user data');
        setLoading(false);
        return;
      }
      const me = await meRes.json();
      if (!me?.id) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      // Use current user ID for kid-specific endpoint
      const r = await fetch(`${API}/achievements?kid=${me.id}`, { credentials: 'include' });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error || 'Failed to load achievements');
        return;
      }
      const j = await r.json();
      setStats(j.stats || { total_approved: 0, total_points_earned: 0, streak_days: 0 });
      setBadges(j.badges || []);
    } catch (err) {
      toast.error('Network error loading achievements');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading achievements...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox label="Chores Approved" value={stats.total_approved} />
            <StatBox label="Points Earned" value={stats.total_points_earned} />
            <StatBox label="Current Streak" value={`${stats.streak_days} days`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No achievements available yet.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {badges.map((b: any) => (
                <li
                  key={b.key}
                  className={`border rounded-lg p-4 transition-opacity ${
                    b.awarded_at ? 'border-primary/30 bg-primary/5' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{b.icon || '🏆'}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{b.title}</div>
                      <div className="text-sm text-muted-foreground">{b.description}</div>
                      <div className="text-xs mt-2">
                        {b.awarded_at ? (
                          <span className="text-primary font-medium">
                            ✅ Earned {new Date(b.awarded_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">🔒 Locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs uppercase text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

