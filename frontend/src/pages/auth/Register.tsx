import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap, Lock, Mail, User, Building, Phone, Check, X, ArrowRight, AlertCircle } from 'lucide-react';

interface RegisterProps {
  onNavigate: (view: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live validation checks from PDF specifications
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);
  const isValidPassword = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword) {
      setError('Please fulfill all password security rules before submitting.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        phone,
        companyName,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-xl shadow-purple-500/25 mb-4">
            <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Zap className="h-6 w-6 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Join Brightloop</h1>
          <p className="text-sm text-slate-400 mt-1">Setup your enterprise customer subscription portal</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-1">Create Customer Account</h2>
          <p className="text-xs text-slate-400 mb-6">Manage all your company subscriptions & invoices in one place</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center space-x-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rohan Sharma"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Email (Unique Identity)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rohan@company.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Company
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Apex Ltd"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Password Rule Checklist as specified by Problem Statement */}
              <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                  PDF Security Requirements:
                </div>
                <div className="flex items-center space-x-2">
                  {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  <span className={hasLength ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    More than 8 characters ({password.length}/9+)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  <span className={hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    At least one uppercase letter (A-Z)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  <span className={hasLower ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    At least one lowercase letter (a-z)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  <span className={hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    At least one special character (!@#$%...)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValidPassword}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Sign in to console
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
