import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Api } from './api'
import { useActingAs } from './contexts/ActingAsContext'

export function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'parent'|'kid' }) {
  const [state, setState] = useState<{ loading:boolean, ok:boolean } | null>(null)
  const { actingAsKidId } = useActingAs()
  
  useEffect(() => { 
    Api.me().then(m => {
      let pass = !!m?.authenticated
      
      if (role) {
        // If role is 'kid', allow if:
        // 1. User is actually a kid, OR
        // 2. Parent is acting as kid
        if (role === 'kid') {
          pass = pass && (m?.user?.role === 'kid' || actingAsKidId || m?.actingAsKid)
        } else {
          // For parent role, must be parent (not acting as kid)
          pass = pass && m?.user?.role === role && !actingAsKidId
        }
      }
      
      setState({ loading:false, ok: pass })
    }).catch(() => setState({ loading:false, ok:false })) 
  }, [role, actingAsKidId])
  
  if (!state || state.loading) return <div className="p-6">Loading…</div>
  if (!state.ok) return <Navigate to="/" replace />
  return <>{children}</>
}

