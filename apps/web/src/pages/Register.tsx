import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Api } from '../api';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/Glass';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (pwd: string) => pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !familyName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!isStrongPassword(password)) {
      toast.error('Password must be at least 8 characters with 1 uppercase and 1 number');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const r = await Api.registerParent({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        family_name: familyName
      });

      if (r.ok) {
        toast.success('Registration successful! Redirecting to onboarding...');
        // Auto-logged in via cookie, redirect to onboarding
        setTimeout(() => navigate('/onboarding'), 1500);
      } else {
        toast.error(r.error || 'Registration failed');
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
            Create Your Family
          </h1>
          <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
        </div>

        <p className="text-zinc-400 text-center mb-8">
          Start teaching your kids real money skills today
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="parent@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Family Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="The Smith Family"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">
              At least 8 characters, 1 uppercase, 1 number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glass w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Family Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-xs text-zinc-500 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </GlassPanel>
    </div>
  );
}

