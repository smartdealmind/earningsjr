import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <nav className="mx-auto max-w-6xl flex items-center gap-3 px-4 py-3">
          <Link to="/" className="font-bold text-lg mr-4">ChoreCoins</Link>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Link to="/onboarding"><Button variant="ghost" size="sm">Onboarding</Button></Link>
            <Link to="/kid"><Button variant="ghost" size="sm">Kid</Button></Link>
            <Link to="/approvals"><Button variant="ghost" size="sm">Approvals</Button></Link>
            <Link to="/balances"><Button variant="ghost" size="sm">Balances</Button></Link>
            <Link to="/rules"><Button variant="ghost" size="sm">Rules</Button></Link>
            <Link to="/goals"><Button variant="ghost" size="sm">Goals</Button></Link>
            <Link to="/requests"><Button variant="ghost" size="sm">Requests</Button></Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

