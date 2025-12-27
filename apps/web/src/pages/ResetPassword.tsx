import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { GlassPanel } from '@/components/Glass'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.')
      navigate('/forgot-password')
    }
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your new password')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(true)
        toast.success('Password reset successfully!')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(data.error || 'Failed to reset password. The link may have expired.')
        if (data.error === 'invalid_or_expired_token') {
          setTimeout(() => {
            navigate('/forgot-password')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h1>
              <p className="text-zinc-400">
                Your password has been reset. Redirecting to login...
              </p>
            </div>

            <Link to="/login" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
              Go to login now →
            </Link>
          </div>
        </GlassPanel>
      </div>
    )
  }

  if (!token) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <GlassPanel className="max-w-md mx-auto w-full">
        <div className="relative mb-8">
          <h1 className="text-3xl font-bold text-white relative z-10 text-center">
            Reset Password
          </h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        <p className="text-zinc-400 text-center mb-8">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              className="bg-zinc-900/50 border-zinc-700/50"
            />
            <p className="text-xs text-zinc-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-zinc-900/50 border-zinc-700/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
            ← Back to login
          </Link>
        </div>
      </GlassPanel>
    </div>
  )
}

