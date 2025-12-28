import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Api } from '../api'
import { useActingAs } from '@/contexts/ActingAsContext'

export default function BottomTabBar() {
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)
  const [me, setMe] = useState<any>(null)
  const { actingAsKidId } = useActingAs()

  useEffect(() => {
    Api.me().then(setMe).catch(() => setMe(null))
  }, [])

  // Get pending approvals count for badge
  useEffect(() => {
    if (me?.user?.role === 'parent' || me?.user?.role === 'helper') {
      Api.listChores('submitted').then(res => {
        if (res.ok) {
          setPendingCount(res.chores?.length || 0)
        }
      }).catch(() => {})
    }
  }, [me])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Parent/Helper tabs
  if (me?.user?.role === 'parent' || me?.user?.role === 'helper') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto flex items-center justify-around h-16 px-2">
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/home') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link
            to="/approvals"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              isActive('/approvals') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1 relative">
              ✓
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </span>
            <span className="text-xs font-medium">Approve</span>
          </Link>
          
          <Link
            to="/kids"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/kids') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">👶</span>
            <span className="text-xs font-medium">Kids</span>
          </Link>
          
          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/settings') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    )
  }

  // Kid tabs (show when kid OR parent acting as kid)
  if (me?.user?.role === 'kid' || actingAsKidId || me?.actingAsKid) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto flex items-center justify-around h-16 px-2">
          <Link
            to="/kid"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/kid') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link
            to="/goals"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/goals') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">🎯</span>
            <span className="text-xs font-medium">Goals</span>
          </Link>
          
          <Link
            to="/achievements"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/achievements') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">🏆</span>
            <span className="text-xs font-medium">Achievements</span>
          </Link>
          
          <Link
            to="/kid/chores"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/kid/chores') ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <span className="text-2xl mb-1">📋</span>
            <span className="text-xs font-medium">Chores</span>
          </Link>
        </div>
      </nav>
    )
  }

  return null
}

