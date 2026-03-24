import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        setEmail('');
        setPassword('');
        setError('');
        alert('Check your email to confirm your account!');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        onAuthSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isSignUp ? 'Creating account...' : 'Signing in...'}
          </>
        ) : (
          isSignUp ? 'Create Account' : 'Sign In'
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError('');
        }}
        className="w-full text-center text-sm text-slate-400 hover:text-slate-300 transition-colors"
      >
        {isSignUp
          ? 'Already have an account? Sign in'
          : "Don't have an account? Create one"}
      </button>
    </form>
  );
}
