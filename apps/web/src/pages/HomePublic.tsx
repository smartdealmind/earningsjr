import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function Check({children}:{children:React.ReactNode}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-emerald-600"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <p className="text-base text-muted-foreground">{children}</p>
    </div>
  )
}

function Feature({title, desc, icon}:{title:string; desc:string; icon:React.ReactNode}) {
  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

export default function HomePublic() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-3">
                New • Built for families
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
                Teach real-life money skills with chores that <strong>count</strong>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Kids pick tasks, learn responsibility, and earn points that convert to money—with
                guardrails parents control. Required chores stay required. Rewards stay motivating.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/onboarding"><Button size="lg">Create your family</Button></Link>
                <Link to="/kid"><Button size="lg" variant="outline">I'm a kid</Button></Link>
              </div>
              <div className="mt-6 space-y-2">
                <Check>Parent-controlled exchange rate & weekly allowance</Check>
                <Check>Required chores (no points) vs. paid chores (points)</Check>
                <Check>Goals, requests, approvals, badges & payouts</Check>
              </div>
            </div>
            {/* Illustration / Placeholder */}
            <div className="relative">
              <div className="rounded-2xl border bg-card shadow-sm p-4">
                {/* Replace these with real screenshots later */}
                <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-200 to-sky-200 dark:from-emerald-900/30 dark:to-sky-900/30 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">App preview (add screenshot)</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-lg bg-muted" />
                  <div className="h-20 rounded-lg bg-muted" />
                  <div className="h-20 rounded-lg bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Why families love ChoreCoins</h2>
          <p className="text-muted-foreground mt-2">Kid-friendly tasks. Parent-friendly controls. Real-world learning.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Money lessons"
            desc="Kids see how time and effort turn into points—and how points convert to dollars."
            icon={<svg width="20" height="20" viewBox="0 0 24 24" className="text-primary"><path fill="currentColor" d="M12 1a11 11 0 1 0 .001 22.001A11 11 0 0 0 12 1Zm1 17.93V19h-2v-.07A8.994 8.994 0 0 1 3.07 13H5a7 7 0 1 0 14 0h1.93A8.994 8.994 0 0 1 13 18.93Z"/></svg>}
          />
          <Feature
            title="Parent controls"
            desc="Set exchange rates, weekly allowance, and required chore minimums per family."
            icon={<svg width="20" height="20" viewBox="0 0 24 24" className="text-primary"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm8.94-3.5a7.968 7.968 0 0 0-.49-2.74l2.12-1.64-2-3.46-2.46 1a8.08 8.08 0 0 0-2.37-1.38l-.37-2.62h-4l-.37 2.62a8.08 8.08 0 0 0-2.37 1.38l-2.46-1-2 3.46 2.12 1.64A7.968 7.968 0 0 0 3.06 12c0 .94.16 1.86.45 2.72L1.4 16.36l2 3.46 2.48-1.04c.72.58 1.53 1.05 2.4 1.39l.37 2.83h4l.37-2.83a8.5 8.5 0 0 0 2.4-1.39l2.48 1.04 2-3.46-2.11-1.64c.29-.86.45-1.78.45-2.72Z"/></svg>}
          />
          <Feature
            title="Required chores"
            desc="Some chores are just part of being a family—no points, but they count toward eligibility."
            icon={<svg width="20" height="20" viewBox="0 0 24 24" className="text-primary"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>}
          />
          <Feature
            title="Goals & payouts"
            desc="Kids set goals, request extra tasks, earn badges, and cash out with parent approval."
            icon={<svg width="20" height="20" viewBox="0 0 24 24" className="text-primary"><path fill="currentColor" d="M12 3l9 6-9 6-9-6 9-6Zm0 8.73 8.99-5.99V18H3V5.74L12 11.73Z"/></svg>}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-6"><div className="text-xs uppercase text-muted-foreground">Step 1</div><div className="mt-1 text-lg font-semibold">Create your family</div><p className="text-muted-foreground mt-2">Register as a parent and add kids with age-appropriate chore templates.</p></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-xs uppercase text-muted-foreground">Step 2</div><div className="mt-1 text-lg font-semibold">Set rules & allowance</div><p className="text-muted-foreground mt-2">Choose exchange rate, weekly allowance, and required minimums.</p></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-xs uppercase text-muted-foreground">Step 3</div><div className="mt-1 text-lg font-semibold">Kids earn & learn</div><p className="text-muted-foreground mt-2">Kids claim, submit, and get approved. Points turn into rewards and badges.</p></CardContent></Card>
        </div>
        <div className="mt-8">
          <Link to="/onboarding"><Button size="lg">Get started free</Button></Link>
        </div>
      </section>

      {/* Tiny testimonial / FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="text-lg font-semibold">Parents say</div>
              <p className="text-muted-foreground mt-2">"Our kids finally understand the difference between family jobs and paid jobs—and they're excited to help."</p>
              <div className="mt-3 text-sm text-muted-foreground">— A happy ChoreCoins family</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-lg font-semibold">Is this free?</div>
              <p className="text-muted-foreground mt-2">Yes, during MVP. We'll keep a generous free tier.</p>
              <div className="mt-4">
                <Link to="/onboarding"><Button>Create your family</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground flex flex-wrap gap-3 items-center">
          <span>© {new Date().getFullYear()} ChoreCoins</span>
          <span className="opacity-50">•</span>
          <Link to="/balances" className="hover:underline">Parent dashboard</Link>
          <span className="opacity-50">•</span>
          <Link to="/kid" className="hover:underline">Kid dashboard</Link>
          <span className="opacity-50">•</span>
          <Link to="/admin" className="hover:underline">Admin</Link>
        </div>
      </footer>
    </div>
  )
}

