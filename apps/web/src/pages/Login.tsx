import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Api } from '../api';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/Glass';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const r = await Api.login({ email, password });

      if (r.ok) {
        toast.success('Welcome back!');
        // Check user role and redirect appropriately
        const me = await Api.me();
        if (me.user?.role === 'parent') {
          navigate('/balances');
        } else if (me.user?.role === 'kid') {
          navigate('/kid');
        } else {
          navigate('/');
        }
      } else {
        toast.error(r.error || 'Invalid email or password');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <GlassPanel className="max-w-md mx-auto w-full">
        <div className="relative mb-8">
          <h1 className="text-3xl font-bold text-white relative z-10 text-center">
            Welcome Back
          </h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        <p className="text-zinc-400 text-center mb-8">
          Sign in to your EarningsJr account
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="parent@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glass w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition font-medium">
              Create family account
            </Link>
          </p>
          
          <Link to="/" className="block text-sm text-zinc-500 hover:text-zinc-400 transition">
            ← Back to home
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}

