import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/ThemeProvider'

export default function Shell({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useTheme();
  const cycle = () => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light');
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <nav className="mx-auto max-w-6xl flex items-center gap-3 px-4 py-3 text-card-foreground">
          <Link to="/" className="font-semibold tracking-tight text-lg mr-4">ChoreCoins</Link>
          
          {isHome ? (
            // Marketing nav: prominent CTAs
            <div className="ml-auto flex gap-2 flex-wrap items-center">
              <Link to="/onboarding"><Button size="sm">Create family</Button></Link>
              <Link to="/kid"><Button variant="ghost" size="sm">I'm a kid</Button></Link>
              <Link to="/balances"><Button variant="ghost" size="sm">Parent dashboard</Button></Link>
              <Button variant="outline" size="sm" onClick={cycle} title="Toggle theme">
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
              </Button>
            </div>
          ) : (
            // App nav: full internal links
            <div className="ml-auto flex gap-2 flex-wrap">
              <Link to="/onboarding"><Button variant="ghost" size="sm">Onboarding</Button></Link>
              <Link to="/kid"><Button variant="ghost" size="sm">Kid</Button></Link>
              <Link to="/approvals"><Button variant="ghost" size="sm">Approvals</Button></Link>
              <Link to="/balances"><Button variant="ghost" size="sm">Balances</Button></Link>
              <Link to="/rules"><Button variant="ghost" size="sm">Rules</Button></Link>
              <Link to="/goals"><Button variant="ghost" size="sm">Goals</Button></Link>
              <Link to="/achievements"><Button variant="ghost" size="sm">Achievements</Button></Link>
              <Link to="/requests"><Button variant="ghost" size="sm">Requests</Button></Link>
              <Link to="/reminders"><Button variant="ghost" size="sm">Reminders</Button></Link>
              <Link to="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
              <Button variant="outline" size="sm" onClick={cycle} title="Toggle theme">
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
              </Button>
            </div>
          )}
        </nav>
      </header>
      <main className={isHome ? '' : 'mx-auto max-w-6xl px-4 py-6'}>{children}</main>
    </div>
  )
}

