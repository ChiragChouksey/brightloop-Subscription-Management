import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginProps {
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-xl shadow-purple-500/25 mb-4">
            <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Zap className="h-6 w-6 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Brightloop Software</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Subscription & Recurring Billing</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials to access the console</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center space-x-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-purple-400 hover:text-purple-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Demo Login Quick Fills for Hackathon Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              Quick Demo Personas (One-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autofill('admin@brightloop.io', 'Admin@Brightloop123')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-purple-900/40 hover:border-purple-500/80 text-[11px] text-slate-300 hover:text-white transition flex flex-col items-center"
              >
                <span className="font-semibold text-purple-400">Admin</span>
                <span className="text-[10px] text-slate-500">Full System</span>
              </button>
              <button
                type="button"
                onClick={() => autofill('staff@brightloop.io', 'Staff@Brightloop123')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-indigo-900/40 hover:border-indigo-500/80 text-[11px] text-slate-300 hover:text-white transition flex flex-col items-center"
              >
                <span className="font-semibold text-indigo-400">Staff</span>
                <span className="text-[10px] text-slate-500">Ops / Billing</span>
              </button>
              <button
                type="button"
                onClick={() => autofill('apex@enterprise.com', 'Customer@Brightloop123')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-900/40 hover:border-cyan-500/80 text-[11px] text-slate-300 hover:text-white transition flex flex-col items-center"
              >
                <span className="font-semibold text-cyan-400">Customer</span>
                <span className="text-[10px] text-slate-500">Self-Service</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link to sign up */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            New customer organization?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Create customer account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
