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
                  🌟 Join 100+ families already teaching money skills
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                  Turn Chores Into <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Life Lessons</span>
                </h1>
                <p className="text-xl text-zinc-300 mb-4 leading-relaxed">
                  Your kids learn <span className="text-white font-semibold">responsibility</span>, <span className="text-white font-semibold">work ethic</span>, and <span className="text-white font-semibold">money management</span>—while you stay in control.
                </p>
                <p className="text-base text-zinc-400 mb-8">
                  Points convert to real rewards. Required chores teach family responsibility. Goals and achievements make earning fun. All with parent-controlled guardrails.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link to="/register">
                    <button className="btn-glass text-lg px-8 py-4 font-semibold hover:scale-105 transition-transform">
                      Start Free Today →
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="btn-glass-secondary text-lg px-8 py-4">
                      Sign In
                    </button>
                  </Link>
                </div>
                <div className="space-y-3">
                  <Check>✅ Free forever for 2 kids & 10 chores</Check>
                  <Check>🔒 You control exchange rates, allowances, and rules</Check>
                  <Check>🎯 Kids earn points, badges, and real-world money skills</Check>
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
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Why Parents <span className="text-emerald-400">Love</span> EarningsJr
          </h2>
          <p className="text-xl text-zinc-400 mt-3 max-w-2xl mx-auto">Teaching kids about money shouldn't be complicated. We make it simple, fun, and effective.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-glass p-6 text-center group hover:border-emerald-500/50 transition-all">
            <div className="text-emerald-400 mb-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Real Money Lessons</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Kids see how time and effort turn into points—and how points convert to real dollars. No more abstract "someday" lessons.</p>
          </div>
          <div className="card-glass p-6 text-center group hover:border-emerald-500/50 transition-all">
            <div className="text-emerald-400 mb-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">You Stay In Control</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Set your own exchange rate, weekly allowance, and required chore minimums. Your family, your rules.</p>
          </div>
          <div className="card-glass p-6 text-center group hover:border-emerald-500/50 transition-all">
            <div className="text-emerald-400 mb-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Family Responsibilities</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Required chores teach that some jobs are just part of being a family. No points earned, but eligibility matters.</p>
          </div>
          <div className="card-glass p-6 text-center group hover:border-emerald-500/50 transition-all">
            <div className="text-emerald-400 mb-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">Goals & Achievements</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Kids set savings goals, request extra tasks, earn badges, and learn delayed gratification—all while having fun!</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-center mb-4">
          Get Started in <span className="text-emerald-400">3 Simple Steps</span>
        </h2>
        <p className="text-xl text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          From signup to first chore completed in less than 5 minutes.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="card-glass p-8 relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center border-4 border-zinc-950">1</div>
            <div className="mt-4 text-2xl font-bold text-white mb-3">Create Your Family</div>
            <p className="text-zinc-300 mb-4 leading-relaxed">Register as a parent and add your kids. Choose age-appropriate chore templates or create custom ones.</p>
            <div className="text-sm text-zinc-400">⏱️ Takes 2 minutes</div>
          </div>
          <div className="card-glass p-8 relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center border-4 border-zinc-950">2</div>
            <div className="mt-4 text-2xl font-bold text-white mb-3">Set Your Rules</div>
            <p className="text-zinc-300 mb-4 leading-relaxed">Configure exchange rate (e.g., 100 points = $1), weekly allowance, and required chore minimums. Your family, your way.</p>
            <div className="text-sm text-zinc-400">⏱️ Takes 1 minute</div>
          </div>
          <div className="card-glass p-8 relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center border-4 border-zinc-950">3</div>
            <div className="mt-4 text-2xl font-bold text-white mb-3">Kids Start Earning!</div>
            <p className="text-zinc-300 mb-4 leading-relaxed">Kids claim chores, complete them, submit for approval. Points add up. Badges unlock. Learning happens!</p>
            <div className="text-sm text-zinc-400">🎉 Watch them grow!</div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Link to="/register">
            <button className="btn-glass text-lg px-8 py-4 font-semibold hover:scale-105 transition-transform">
              Start Your Free Family Today →
            </button>
          </Link>
          <p className="text-zinc-400 text-sm mt-4">No credit card required • Free forever for 2 kids</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <div className="card-glass p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Raise<br />
              <span className="text-emerald-400">Financially Savvy Kids?</span>
            </h2>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join 100+ families teaching their kids responsibility, work ethic, and money management—the fun way.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Link to="/register">
                <button className="btn-glass text-lg px-8 py-4 font-semibold">
                  Start Free Now →
                </button>
              </Link>
              <Link to="/pricing">
                <button className="btn-glass-secondary text-lg px-8 py-4">
                  View Pricing
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Free forever tier</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="card-glass p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-300 mb-8 text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you're ready for unlimited features. Cancel anytime.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <div className="border border-zinc-700/50 rounded-2xl p-8 bg-zinc-900/30 hover:border-zinc-600/50 transition-all">
              <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wide mb-2">Free Forever</div>
              <div className="text-5xl font-bold text-white mb-1">$0</div>
              <div className="text-zinc-400 text-sm mb-6">Perfect for small families</div>
              <ul className="text-left text-sm text-zinc-300 space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span><strong>2 kids</strong> maximum</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span><strong>10 active chores</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span>Full chore tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span>Points ledger</span>
                </li>
              </ul>
              <Link to="/register">
                <button className="w-full btn-glass-secondary text-base px-6 py-3">
                  Start Free
                </button>
              </Link>
            </div>
            <div className="border-2 border-emerald-500/70 rounded-2xl p-8 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 relative hover:border-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-2">Premium</div>
              <div className="text-5xl font-bold text-white mb-1">
                $9.99<span className="text-lg text-zinc-400">/mo</span>
              </div>
              <div className="text-zinc-300 text-sm mb-6">For growing families</div>
              <ul className="text-left text-sm text-zinc-200 space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span><strong>Unlimited kids</strong> & chores</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span><strong>Goals & achievements</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span>Printable reward charts</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400 flex-shrink-0 mt-0.5"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link to="/pricing">
                <button className="w-full btn-glass text-base px-6 py-3 font-semibold">
                  Upgrade to Premium →
                </button>
              </Link>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">
            💳 30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
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
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          What Parents Are Saying
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-glass p-6">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-yellow-400"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ))}
            </div>
            <p className="text-zinc-300 text-sm mb-4 italic leading-relaxed">
              "Our kids finally understand the difference between family jobs and paid jobs. The 'Act As Kid' feature is perfect for younger children—I can help them while they learn!"
            </p>
            <div className="text-sm">
              <div className="text-white font-semibold">Sarah M.</div>
              <div className="text-zinc-400 text-xs">Mom of 3 (ages 6, 8, 11)</div>
            </div>
          </div>
          <div className="card-glass p-6">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-yellow-400"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ))}
            </div>
            <p className="text-zinc-300 text-sm mb-4 italic leading-relaxed">
              "The goals feature has been amazing for teaching them to save for things they want. My 10-year-old saved up 500 points for a new video game and was SO proud!"
            </p>
            <div className="text-sm">
              <div className="text-white font-semibold">James T.</div>
              <div className="text-zinc-400 text-xs">Dad of 2 (ages 10, 12)</div>
            </div>
          </div>
          <div className="card-glass p-6">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-yellow-400"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ))}
            </div>
            <p className="text-zinc-300 text-sm mb-4 italic leading-relaxed">
              "Best $10/month we spend! No more arguments about chores. The kids check their balances daily and actually ASK for extra chores to earn more points."
            </p>
            <div className="text-sm">
              <div className="text-white font-semibold">Lisa & Mark R.</div>
              <div className="text-zinc-400 text-xs">Parents of 4 (ages 7-14)</div>
            </div>
          </div>
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

