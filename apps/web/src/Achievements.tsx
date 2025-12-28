import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useActingAs } from '@/contexts/ActingAsContext';
import UpgradePrompt from '@/components/UpgradePrompt';

const API = import.meta.env.VITE_API_BASE;

export default function Achievements() {
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const { actingAsKidId } = useActingAs();

  useEffect(() => {
    loadAchievements();
  }, [actingAsKidId]);

  async function loadAchievements() {
    setLoading(true);
    try {
      // Use actingAsKidId if parent is acting as kid, otherwise get from /me
      let kidId = actingAsKidId;
      
      if (!kidId) {
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
        kidId = me.id;
      }

      // Check subscription status first
      const subRes = await fetch(`${API}/stripe/subscription`, { credentials: 'include' });
      if (subRes.ok) {
        const sub = await subRes.json();
        setIsPremium(sub.hasSubscription || false);
      }

      // Use kid ID for kid-specific endpoint
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (actingAsKidId) {
        headers['X-Acting-As-Kid-Id'] = actingAsKidId;
      }
      
      const r = await fetch(`${API}/achievements?kid=${kidId}`, { 
        credentials: 'include',
        headers
      });
      
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Unknown error' }));
        if (err.error === 'premium_required' || err.upgradeRequired) {
          setIsPremium(false);
          setStats({ total_approved: 0, total_points_earned: 0, streak_days: 0 });
          setBadges([]);
          // Don't show error toast for premium requirement - UpgradePrompt handles it
        } else {
          setIsPremium(null); // Reset to show loading/error state
          toast.error(err.error || 'Failed to load achievements');
          setStats({ total_approved: 0, total_points_earned: 0, streak_days: 0 });
          setBadges([]);
        }
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

  // Show upgrade prompt if not premium
  if (isPremium === false) {
    return (
      <div className="max-w-4xl mx-auto my-6">
        <UpgradePrompt 
          title="Achievements are a Premium Feature"
          message="Track badges, stats, and streaks to motivate kids."
          feature="Achievements"
        />
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
            <StatBox label="Chores Approved" value={stats?.total_approved ?? 0} />
            <StatBox label="Points Earned" value={stats?.total_points_earned ?? 0} />
            <StatBox label="Current Streak" value={`${stats?.streak_days ?? 0} days`} />
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

