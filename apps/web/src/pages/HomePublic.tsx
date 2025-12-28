import { Link } from "react-router-dom"

function Check({children}:{children:React.ReactNode}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-emerald-600"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <p className="text-base text-zinc-400">{children}</p>
    </div>
  )
}

export default function HomePublic() {
  return (
    <div className="bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="glass-section glow-edge">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm px-3 py-1 text-xs text-emerald-300 mb-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                  New • Built for families
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
                  EarningsJr — <span className="text-emerald-400">Earn. Learn. Grow.</span>
                </h1>
                <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                  Teach your kids the value of work with fun tasks, rewards, and real-life responsibility. 
                  Points that convert to money—with guardrails parents control. Perfect for families who want to raise financially savvy kids.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link to="/register"><button className="btn-glass text-base px-6 py-3">Start Free</button></Link>
                  <Link to="/login"><button className="btn-glass-secondary text-base px-6 py-3">Sign In</button></Link>
                </div>
                <div className="space-y-3">
                  <Check>Parent-controlled exchange rate & weekly allowance</Check>
                  <Check>Required chores (no points) vs. paid chores (points)</Check>
                  <Check>Goals, requests, approvals, badges & payouts</Check>
                </div>
              </div>
              {/* Illustration / Placeholder */}
              <div className="relative">
                <div className="card-glass p-4">
                  {/* Replace these with real screenshots later */}
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center border border-zinc-700/30">
                    <span className="text-sm text-zinc-400">App preview (add screenshot)</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="h-20 rounded-lg bg-zinc-700/40 border border-zinc-600/30" />
                    <div className="h-20 rounded-lg bg-zinc-700/40 border border-zinc-600/30" />
                    <div className="h-20 rounded-lg bg-zinc-700/40 border border-zinc-600/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Why families love EarningsJr</h2>
          <p className="text-zinc-400 mt-2">Kid-friendly tasks. Parent-friendly controls. Real-world learning.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-glass p-6 text-center group">
            <div className="text-emerald-400 mb-3 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 1a11 11 0 1 0 .001 22.001A11 11 0 0 0 12 1Zm1 17.93V19h-2v-.07A8.994 8.994 0 0 1 3.07 13H5a7 7 0 1 0 14 0h1.93A8.994 8.994 0 0 1 13 18.93Z"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-white">Money lessons</h3>
            <p className="text-zinc-400 text-sm">Kids see how time and effort turn into points—and how points convert to dollars.</p>
          </div>
          <div className="card-glass p-6 text-center group">
            <div className="text-emerald-400 mb-3 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm8.94-3.5a7.968 7.968 0 0 0-.49-2.74l2.12-1.64-2-3.46-2.46 1a8.08 8.08 0 0 0-2.37-1.38l-.37-2.62h-4l-.37 2.62a8.08 8.08 0 0 0-2.37 1.38l-2.46-1-2 3.46 2.12 1.64A7.968 7.968 0 0 0 3.06 12c0 .94.16 1.86.45 2.72L1.4 16.36l2 3.46 2.48-1.04c.72.58 1.53 1.05 2.4 1.39l.37 2.83h4l.37-2.83a8.5 8.5 0 0 0 2.4-1.39l2.48 1.04 2-3.46-2.11-1.64c.29-.86.45-1.78.45-2.72Z"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-white">Parent controls</h3>
            <p className="text-zinc-400 text-sm">Set exchange rates, weekly allowance, and required chore minimums per family.</p>
          </div>
          <div className="card-glass p-6 text-center group">
            <div className="text-emerald-400 mb-3 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-white">Required chores</h3>
            <p className="text-zinc-400 text-sm">Some chores are just part of being a family—no points, but they count toward eligibility.</p>
          </div>
          <div className="card-glass p-6 text-center group">
            <div className="text-emerald-400 mb-3 flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 3l9 6-9 6-9-6 9-6Zm0 8.73 8.99-5.99V18H3V5.74L12 11.73Z"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-white">Goals & payouts</h3>
            <p className="text-zinc-400 text-sm">Kids set goals, request extra tasks, earn badges, and cash out with parent approval.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white text-center mb-8">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-glass p-6">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-wider">Step 1</div>
            <div className="mt-2 text-lg font-semibold text-white">Create your family</div>
            <p className="text-zinc-400 mt-2 text-sm">Register as a parent and add kids with age-appropriate chore templates.</p>
          </div>
          <div className="card-glass p-6">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-wider">Step 2</div>
            <div className="mt-2 text-lg font-semibold text-white">Set rules & allowance</div>
            <p className="text-zinc-400 mt-2 text-sm">Choose exchange rate, weekly allowance, and required minimums.</p>
          </div>
          <div className="card-glass p-6">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-wider">Step 3</div>
            <div className="mt-2 text-lg font-semibold text-white">Kids earn & learn</div>
            <p className="text-zinc-400 mt-2 text-sm">Kids claim, submit, and get approved. Points turn into rewards and badges.</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/register"><button className="btn-glass text-base px-6 py-3">Get started free</button></Link>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="card-glass p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-zinc-400 mb-6 text-lg">Start free. Upgrade when you're ready for unlimited features.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
            <div className="border border-zinc-700/50 rounded-lg p-6 bg-zinc-900/30">
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-zinc-400 text-sm mb-4">Perfect for trying out</div>
              <ul className="text-left text-sm text-zinc-400 space-y-2 mb-4">
                <li>✓ 2 kids maximum</li>
                <li>✓ 10 active chores</li>
                <li>✓ Basic chore tracking</li>
                <li>✓ Points ledger</li>
              </ul>
              <div className="text-2xl font-bold text-white mb-2">$0<span className="text-sm text-zinc-400">/month</span></div>
            </div>
            <div className="border border-emerald-500/50 rounded-lg p-6 bg-emerald-500/10">
              <div className="text-3xl font-bold text-white mb-2">Premium</div>
              <div className="text-zinc-400 text-sm mb-4">For serious families</div>
              <ul className="text-left text-sm text-zinc-400 space-y-2 mb-4">
                <li>✓ Unlimited kids & chores</li>
                <li>✓ Goals & achievements</li>
                <li>✓ Advanced features</li>
                <li>✓ Priority support</li>
              </ul>
              <div className="text-2xl font-bold text-emerald-400 mb-2">$9.99<span className="text-sm text-zinc-400">/month</span></div>
            </div>
          </div>
          <Link to="/pricing"><button className="btn-glass text-base px-6 py-3">View Full Pricing</button></Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How does the points system work?</h3>
            <p className="text-zinc-400 text-sm">Parents set an exchange rate (e.g., 100 points = $1). Kids earn points by completing paid chores, which can be converted to real money or used for goals. Required chores don't earn points but count toward eligibility for payouts.</p>
          </div>
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What's the difference between free and premium?</h3>
            <p className="text-zinc-400 text-sm">Free tier includes 2 kids and 10 active chores—perfect for small families. Premium unlocks unlimited kids and chores, plus Goals, Achievements, and advanced features. Both tiers include core chore tracking and points management.</p>
          </div>
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
            <p className="text-zinc-400 text-sm">Yes! Cancel your Premium subscription anytime. You'll continue to have access until the end of your billing period. We offer a 30-day money-back guarantee if you're not satisfied.</p>
          </div>
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Is my data secure?</h3>
            <p className="text-zinc-400 text-sm">Absolutely. We use industry-standard encryption, secure authentication, and never share your family's data. Your information is stored securely in Cloudflare's infrastructure.</p>
          </div>
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What age is this for?</h3>
            <p className="text-zinc-400 text-sm">EarningsJr works best for kids ages 6-14. Younger kids can use it with parent help (via "Act As Kid" mode), while older kids can manage their own accounts independently.</p>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonial */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="card-glass p-8 text-center">
          <div className="text-lg font-semibold text-white mb-3">What parents are saying</div>
          <p className="text-zinc-400 italic text-lg mb-4 max-w-2xl mx-auto">
            "Our kids finally understand the difference between family jobs and paid jobs—and they're excited to help. The goals feature has been amazing for teaching them to save for things they want."
          </p>
          <div className="text-sm text-emerald-400">— A happy EarningsJr family</div>
        </div>
      </section>

      <footer className="border-t border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="text-sm text-zinc-400 flex flex-wrap gap-3 items-center justify-center mb-3">
            <span>© {new Date().getFullYear()} EarningsJr</span>
            <span className="opacity-50">•</span>
            <Link to="/balances" className="hover:text-emerald-400 transition">Parent dashboard</Link>
            <span className="opacity-50">•</span>
            <Link to="/kid" className="hover:text-emerald-400 transition">Kid dashboard</Link>
            <span className="opacity-50">•</span>
            <Link to="/admin" className="hover:text-emerald-400 transition">Admin</Link>
          </div>
          <div className="text-xs text-zinc-500 text-center">
            Powered by <a href="https://smartdealmind.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition font-medium">SmartDealMind LLC</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

