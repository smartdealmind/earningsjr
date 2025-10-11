import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_BASE

export default function Admin() {
  const [stats, setStats] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [after, setAfter] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadStats(); loadAudit(0) }, [])

  async function loadStats() {
    const r = await fetch(`${API}/admin/metrics`, { credentials:'include' })
    if (!r.ok) { toast.error('Admin only'); return }
    setStats(await r.json())
  }

  async function loadAudit(cursor:number){
    setLoading(true)
    const url = new URL(`${API}/admin/audit`)
    if (cursor>0) url.searchParams.set('after', String(cursor))
    const r = await fetch(url, { credentials:'include' })
    setLoading(false)
    if (!r.ok) { toast.error('Admin only'); return }
    const j = await r.json()
    setRows((cursor>0)? [...rows, ...(j.rows||[])] : (j.rows||[]))
    if (j.rows?.length) setAfter(j.rows[j.rows.length-1].ts)
  }

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Parents" value={stats?.stats?.parents} />
          <Metric label="Kids" value={stats?.stats?.kids} />
          <Metric label="Chores last 7d" value={stats?.stats?.chores_created_last7d} />
          <Metric label="Approvals 24h" value={stats?.stats?.approvals_last24h} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="text-left sticky top-0 bg-card border-b border-border">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Family</th>
                  <th>Target</th>
                  <th>Meta</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r:any)=>(
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{new Date(r.ts).toLocaleString()}</td>
                    <td>{r.action}</td>
                    <td>{r.user_id ?? '—'}</td>
                    <td>{r.family_id ?? '—'}</td>
                    <td>{r.target_id ?? '—'}</td>
                    <td className="max-w-[360px] truncate" title={r.meta_json}>{r.meta_json}</td>
                    <td>{r.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Button variant="outline" disabled={loading || !after} onClick={()=>loadAudit(after)}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({label, value}:{label:string; value:any}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value ?? '—'}</div>
    </div>
  )
}

