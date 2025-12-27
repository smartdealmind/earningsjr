import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { analytics } from '@/lib/analytics'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

export default function Pricing() {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async (priceId: string) => {
    setLoading(true)
    analytics.subscription_started('premium')
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/stripe/create-checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      
      const data = await res.json()
      
      if (data.ok && data.url) {
        const stripe = await stripePromise
        if (stripe) {
          window.location.href = data.url
        }
      } else {
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = {
    free: [
      '1 parent account',
      '2 kids maximum',
      '10 active chores',
      'Basic chore tracking',
      'Points ledger',
    ],
    premium: [
      'Unlimited parents',
      'Unlimited kids',
      'Unlimited chores',
      'Goals & achievements',
      'Daily reminders',
      'Chore templates',
      'Priority support',
      'Advanced analytics',
    ],
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for trying out EarningsJr</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>For families serious about teaching money skills</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Or $99/year (save $20)
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade(import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || '')}
                disabled={loading || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
              >
                {loading ? 'Loading...' : 'Start Free Trial'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                14-day free trial, then $9.99/month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div>
              <h3 className="font-semibold mb-1">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">What happens after the free trial?</h3>
              <p className="text-sm text-muted-foreground">
                After 14 days, you'll be automatically charged $9.99/month unless you cancel. You can cancel anytime during the trial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

