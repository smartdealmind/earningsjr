import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { GlassPanel } from '@/components/Glass'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.ok) {
        setSent(true)
        toast.success('Password reset email sent!')
      } else {
        toast.error(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <GlassPanel className="max-w-md mx-auto w-full">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-zinc-400">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-zinc-300 mb-2">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="text-sm text-zinc-400 text-left space-y-1">
                <li>• Check your spam folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
                className="w-full"
              >
                Try Different Email
              </Button>
              <Link to="/login" className="block text-sm text-emerald-400 hover:text-emerald-300 transition">
                ← Back to login
              </Link>
            </div>
          </div>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <GlassPanel className="max-w-md mx-auto w-full">
        <div className="relative mb-8">
          <h1 className="text-3xl font-bold text-white relative z-10 text-center">
            Forgot Password?
          </h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        <p className="text-zinc-400 text-center mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="parent@example.com"
              autoComplete="email"
              required
              autoFocus
              className="bg-zinc-900/50 border-zinc-700/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link to="/login" className="block text-sm text-emerald-400 hover:text-emerald-300 transition">
            ← Back to login
          </Link>
          <Link to="/" className="block text-sm text-zinc-500 hover:text-zinc-400 transition">
            ← Back to home
          </Link>
        </div>
      </GlassPanel>
    </div>
  )
}

