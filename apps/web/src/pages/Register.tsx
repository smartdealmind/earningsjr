import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Api } from '../api';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/Glass';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (pwd: string) => pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !firstName || !lastName || !familyName) {
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
      const r = await Api.sendVerification(email);

      if (r.ok) {
        toast.success('Verification code sent to your email!');
        setStep('verify');
      } else {
        toast.error(r.error || 'Failed to send verification code');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify email
      const v = await Api.verifyEmail(email, verificationCode);

      if (!v.ok) {
        toast.error('Invalid or expired code');
        setLoading(false);
        return;
      }

      // Step 2: Register account
      const r = await Api.registerParent({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        family_name: familyName
      });

      if (r.ok) {
        toast.success('Account created! Redirecting to onboarding...');
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

  async function handleResendCode() {
    setLoading(true);
    try {
      const r = await Api.sendVerification(email);

      if (r.ok) {
        toast.success('New code sent to your email!');
      } else {
        toast.error(r.error || 'Failed to resend code');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <GlassPanel className="max-w-md mx-auto w-full">
          <div className="relative mb-8">
            <h1 className="text-3xl font-bold text-white relative z-10 text-center">
              Check Your Email
            </h1>
            <div className="absolute inset-x-0 -top-6 h-20 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
          </div>

          <div className="text-center mb-6">
            <p className="text-zinc-400 mb-2">
              We sent a 6-digit verification code to:
            </p>
            <p className="text-emerald-400 font-medium">{email}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Check your email inbox (and spam folder)
            </p>
          </div>

          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-zinc-100 text-center text-2xl font-mono tracking-widest placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="000000"
                autoFocus
                required
              />
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="btn-glass w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
            >
              Didn't receive it? Resend code
            </button>
            
            <button
              onClick={() => setStep('form')}
              className="block w-full text-sm text-zinc-500 hover:text-zinc-400 transition"
            >
              ← Change email address
            </button>
          </div>
        </GlassPanel>
      </div>
    );
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

        <form onSubmit={handleSendCode} className="space-y-4">
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
              autoComplete="email"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Smith"
                required
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
              autoComplete="new-password"
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
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glass w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending code...' : 'Continue'}
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
