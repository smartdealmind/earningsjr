import { useEffect, useState } from 'react'
import { Api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function Home() {
  const [me, setMe] = useState<any>(null)
  const [recentChores, setRecentChores] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [kids, setKids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [meRes, choresRes, kidsRes] = await Promise.all([
        Api.me(),
        Api.listChores(),
        Api.kidsBalances().catch(() => ({ ok: false, kids: [] }))
      ])

      setMe(meRes)
      
      if (choresRes.ok) {
        const allChores = choresRes.chores || []
        setRecentChores(allChores.slice(0, 5))
        setPendingCount(allChores.filter((c: any) => c.status === 'submitted').length)
      }

      if (kidsRes.ok) {
        setKids(kidsRes.kids || [])
      }
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto my-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading dashboard...
          </CardContent>
        </Card>
      </div>
    )
  }

  const role = me?.user?.role

  // Parent/Helper Dashboard
  if (role === 'parent' || role === 'helper') {
    return (
      <div className="max-w-6xl mx-auto my-6 space-y-6 pb-20">
        <div className="relative mb-8">
          <h1 className="text-3xl font-bold text-white relative z-10">Dashboard</h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/approvals">
            <Card className="hover:bg-zinc-800/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Approvals</span>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-sm rounded-full px-3 py-1 font-bold">
                      {pendingCount}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {pendingCount === 0 
                    ? 'No chores waiting for approval'
                    : `${pendingCount} chore${pendingCount > 1 ? 's' : ''} need your review`
                  }
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/kids">
            <Card className="hover:bg-zinc-800/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle>Kids Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {kids.length === 0 
                    ? 'Add kids to get started'
                    : `${kids.length} kid${kids.length > 1 ? 's' : ''} in your family`
                  }
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <ul className="space-y-2">
                {recentChores.map((chore: any) => (
                  <li key={chore.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{chore.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chore.status} • {new Date(chore.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold">{chore.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Kid Dashboard
  if (role === 'kid') {
    return (
      <div className="max-w-6xl mx-auto my-6 space-y-6 pb-20">
        <div className="relative mb-8">
          <h1 className="text-3xl font-bold text-white relative z-10">My Dashboard</h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_10%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/goals">
            <Card className="hover:bg-zinc-800/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle>My Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View and manage your savings goals</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/achievements">
            <Card className="hover:bg-zinc-800/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">See your badges and stats</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Chores */}
        <Card>
          <CardHeader>
            <CardTitle>My Chores</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chores assigned yet</p>
            ) : (
              <ul className="space-y-2">
                {recentChores.map((chore: any) => (
                  <li key={chore.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{chore.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chore.status} • {new Date(chore.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold">{chore.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

