import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Api } from '../api'
import BottomTabBar from './BottomTabBar'
import ActingAsBanner from './ActingAsBanner'
import { useActingAs } from '@/contexts/ActingAsContext'

export default function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isPublicPage = ['/', '/register', '/login', '/forgot-password', '/reset-password', '/pricing'].includes(location.pathname);
  const [me, setMe] = useState<any>(null);
  const { actingAsKidId } = useActingAs();
  
  useEffect(() => {
    if (!isHome) {
      Api.me().then(setMe).catch(() => setMe(null));
    }
  }, [isHome]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Acting As Banner - Shows when parent is acting as kid */}
      <ActingAsBanner />
      
      {/* Top Header - Always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/30 backdrop-blur-xl border-b border-zinc-800/50">
        <nav className="mx-auto max-w-6xl flex items-center gap-3 px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-white tracking-tight">
            Earnings<span className="text-emerald-400">Jr</span>
          </Link>
          
          {isHome ? (
            // Marketing nav: prominent CTAs
            <div className="ml-auto flex gap-3 flex-wrap items-center">
              <Link to="/register"><button className="btn-glass text-sm px-4 py-2">Create family</button></Link>
              <Link to="/login" className="text-zinc-300 hover:text-emerald-400 transition text-sm">Sign In</Link>
            </div>
          ) : (
            // Desktop nav: show on md+ screens only
            <div className="ml-auto hidden md:flex gap-2 flex-wrap items-center text-sm">
              {/* Parent/Helper Links */}
              {(me?.user?.role === 'parent' || me?.user?.role === 'helper') && (
                <>
                  <Link to="/home" className="text-zinc-300 hover:text-emerald-400 transition px-2">Home</Link>
              <Link to="/approvals" className="text-zinc-300 hover:text-emerald-400 transition px-2">Approvals</Link>
                  <Link to="/kids" className="text-zinc-300 hover:text-emerald-400 transition px-2">Kids</Link>
                  <Link to="/settings" className="text-zinc-300 hover:text-emerald-400 transition px-2">Settings</Link>
                </>
              )}
              
              {/* Kid Links */}
              {me?.user?.role === 'kid' && (
                <>
                  <Link to="/kid" className="text-zinc-300 hover:text-emerald-400 transition px-2">Home</Link>
              <Link to="/goals" className="text-zinc-300 hover:text-emerald-400 transition px-2">Goals</Link>
              <Link to="/achievements" className="text-zinc-300 hover:text-emerald-400 transition px-2">Achievements</Link>
                  <Link to="/settings" className="text-zinc-300 hover:text-emerald-400 transition px-2">Settings</Link>
                </>
              )}
              
              {/* Admin Only */}
              {me?.user?.is_admin && (
              <Link to="/admin" className="text-zinc-300 hover:text-emerald-400 transition px-2">Admin</Link>
              )}
            </div>
          )}
        </nav>
      </header>
      
      {/* Main Content - with padding for bottom tabs on mobile */}
      <main className={
        isHome 
          ? 'pt-16' 
          : isPublicPage
          ? 'pt-16'
          : 'mx-auto max-w-6xl px-4 py-6 min-h-[calc(100vh-8rem)] pb-20 md:pb-6'
      } style={{ paddingTop: actingAsKidId ? '112px' : '64px' }}>
        {children}
      </main>
      
      {/* Bottom Tab Bar - Mobile only, hidden on desktop */}
      {!isPublicPage && <BottomTabBar />}
      
      {/* Footer - Only on public pages */}
      {isPublicPage && (
        <footer className="border-t border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md mt-12">
          <div className="mx-auto max-w-6xl px-6 py-6 text-center">
            <div className="text-xs text-zinc-500">
              © {new Date().getFullYear()} EarningsJr • Powered by <a href="https://smartdealmind.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition font-medium">SmartDealMind LLC</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

