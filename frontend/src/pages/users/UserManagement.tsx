import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Shield, UserCheck, Mail, Building, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Staff creation form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.createStaff({
        name,
        email,
        password,
        phone,
      });

      if (res.success) {
        setMessage('Staff member created successfully.');
        setShowStaffModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Error creating staff account.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Control & Staff Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based security enforcement. As required by PDF: Only Admin can create staff accounts.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowStaffModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Staff Member</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">User Identity</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Company / Organization</th>
                <th className="py-3 px-4 font-semibold">Contact Phone</th>
                <th className="py-3 px-4 font-semibold">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => {
                const isUAdmin = u.role === 'ADMIN';
                const isUStaff = u.role === 'STAFF';
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isUAdmin
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                            : isUStaff
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}
                      >
                        {isUAdmin && <Shield className="w-2.5 h-2.5" />}
                        {isUStaff && <UserCheck className="w-2.5 h-2.5" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{u.companyName || 'Brightloop Internal'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Create Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Staff Account (Admin Only)</h3>
            <p className="text-xs text-slate-400">
              Staff members can manage customer quotes, subscriptions, and daily billing operations.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Member Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chirah Operations"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chirah@brightloop.io"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must be >8 chars with A-Z, a-z, special"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
