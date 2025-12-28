import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Api } from '../api'

// Redirects authenticated users away from public pages (like landing page)
export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ loading: boolean; redirectTo: string | null } | null>(null)

  useEffect(() => {
    Api.me().then(m => {
      // If authenticated, redirect based on role
      if (m?.authenticated) {
        const redirectTo = m?.user?.role === 'kid' ? '/kid' : '/home'
        setState({ loading: false, redirectTo })
      } else {
        // If not authenticated, show the page
        setState({ loading: false, redirectTo: null })
      }
    }).catch(() => {
      // If not authenticated, show the page
      setState({ loading: false, redirectTo: null })
    })
  }, [])

  if (!state || state.loading) {
    return <div className="p-6">Loading…</div>
  }

  if (state.redirectTo) {
    return <Navigate to={state.redirectTo} replace />
  }

  return <>{children}</>
}

