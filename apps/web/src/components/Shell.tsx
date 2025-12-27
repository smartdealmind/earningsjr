import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/theme/ThemeProvider'
import { useEffect, useState } from 'react'
import { Api } from '../api'

export default function Shell({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useTheme();
  const cycle = () => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light');
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [me, setMe] = useState<any>(null);
  
  useEffect(() => {
    if (!isHome) {
      Api.me().then(setMe).catch(() => setMe(null));
    }
  }, [isHome]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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
              <button 
                onClick={cycle} 
                title="Toggle theme"
                className="rounded-full bg-zinc-800/60 p-2 backdrop-blur-md border border-zinc-700/40 hover:scale-105 transition text-zinc-300"
              >
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
              </button>
            </div>
          ) : (
            // App nav: organized by role
            <div className="ml-auto flex gap-2 flex-wrap items-center text-sm">
              {/* Parent/Helper Links */}
              {(me?.user?.role === 'parent' || me?.user?.role === 'helper') && (
                <>
                  <Link to="/approvals" className="text-zinc-300 hover:text-emerald-400 transition px-2">Approvals</Link>
                  <Link to="/balances" className="text-zinc-300 hover:text-emerald-400 transition px-2">Balances</Link>
                  <Link to="/rules" className="text-zinc-300 hover:text-emerald-400 transition px-2">Rules</Link>
                  <Link to="/requests" className="text-zinc-300 hover:text-emerald-400 transition px-2">Requests</Link>
                  <Link to="/reminders" className="text-zinc-300 hover:text-emerald-400 transition px-2">Reminders</Link>
                </>
              )}
              
              {/* Kid Links */}
              {me?.user?.role === 'kid' && (
                <>
                  <Link to="/kid" className="text-zinc-300 hover:text-emerald-400 transition px-2">Dashboard</Link>
                  <Link to="/goals" className="text-zinc-300 hover:text-emerald-400 transition px-2">Goals</Link>
                  <Link to="/achievements" className="text-zinc-300 hover:text-emerald-400 transition px-2">Achievements</Link>
                </>
              )}
              
              {/* Admin Only */}
              {me?.user?.is_admin && (
                <Link to="/admin" className="text-zinc-300 hover:text-emerald-400 transition px-2">Admin</Link>
              )}
              
              <button 
                onClick={cycle} 
                title="Toggle theme"
                className="rounded-full bg-zinc-800/60 p-2 backdrop-blur-md border border-zinc-700/40 hover:scale-105 transition ml-2"
              >
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className={isHome ? 'pt-16' : 'mx-auto max-w-6xl px-4 py-6 pt-24 min-h-[calc(100vh-8rem)]'}>{children}</main>
      {!isHome && (
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

