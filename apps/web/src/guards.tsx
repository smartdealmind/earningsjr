import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Api } from './api'

export function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'parent'|'kid' }) {
  const [state, setState] = useState<{ loading:boolean, ok:boolean } | null>(null)
  
  useEffect(() => { 
    Api.me().then(m => {
      const pass = !!m?.authenticated && (!role || m?.user?.role === role)
      setState({ loading:false, ok: pass })
    }).catch(() => setState({ loading:false, ok:false })) 
  }, [role])
  
  if (!state || state.loading) return <div className="p-6">Loading…</div>
  if (!state.ok) return <Navigate to="/" replace />
  return <>{children}</>
}

