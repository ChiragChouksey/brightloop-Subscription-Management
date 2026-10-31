import React, { useState } from 'react';
import { api } from '../../services/api';
import { Zap, Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (view: string, resetToken?: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error processing password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[1px] shadow-xl shadow-purple-500/25 mb-4">
            <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Account Password</h1>
          <p className="text-sm text-slate-400 mt-1">We will dispatch a secure reset token link to your registered email</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          {message ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white">Reset Link Dispatched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{message}</p>

              {resetToken && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Simulated Email Dispatch (Dev/Hackathon Helper):
                  </div>
                  <button
                    onClick={() => onNavigate('reset-password', resetToken)}
                    className="w-full py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-xs font-semibold text-purple-200 transition"
                  >
                    Click to Open Password Reset Screen →
                  </button>
                </div>
              )}

              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center space-x-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@brightloop.io"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Dispatching...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
