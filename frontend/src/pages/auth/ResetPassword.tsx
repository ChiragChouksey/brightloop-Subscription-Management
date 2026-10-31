import React, { useState } from 'react';
import { api } from '../../services/api';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';

interface ResetPasswordProps {
  token: string;
  onNavigate: (view: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onNavigate }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLength = newPassword.length > 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword);
  const isValidPassword = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword) {
      setError('Password does not fulfill security constraints.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword({ token, newPassword });
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">Create New Password</h1>
          <p className="text-sm text-slate-400 mt-1">Set a new secure credential for your registered account</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white">Password Updated</h3>
              <p className="text-xs text-slate-400">Your password was reset successfully. You can now login.</p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center space-x-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
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
                  New Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={hasLength ? 'text-emerald-400' : 'text-slate-400'}>Longer than 8 characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={hasUpper ? 'text-emerald-400' : 'text-slate-400'}>Uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={hasLower ? 'text-emerald-400' : 'text-slate-400'}>Lowercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={hasSpecial ? 'text-emerald-400' : 'text-slate-400'}>Special character</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValidPassword}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
