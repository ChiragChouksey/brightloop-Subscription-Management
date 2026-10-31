import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subscription, Plan, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Repeat,
  Plus,
  Pause,
  Play,
  RotateCcw,
  XCircle,
  History,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const SubscriptionList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [historySub, setHistorySub] = useState<Subscription | null>(null);
  const [closeEarlySubId, setCloseEarlySubId] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState('');

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [discountCode, setDiscountCode] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, pRes] = await Promise.all([
        api.getSubscriptions({ status: statusFilter || undefined }),
        api.getPlans(),
      ]);

      if (subRes.success) setSubscriptions(subRes.subscriptions);
      if (pRes.success) {
        setPlans(pRes.plans);
        if (pRes.plans.length > 0) setPlanId(pRes.plans[0].id);
      }

      if (isAdmin || isStaff) {
        const uRes = await api.getUsers('CUSTOMER');
        if (uRes.success) {
          setCustomers(uRes.users);
          if (uRes.users.length > 0) setCustomerId(uRes.users[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubscription({
        customerId: isAdmin || isStaff ? customerId : undefined,
        planId,
        quantity: Number(quantity),
        discountCode: discountCode || undefined,
        status: 'ACTIVE',
      });

      if (res.success) {
        setMessage('Subscription created and first invoice generated.');
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handlePause = async (id: string) => {
    try {
      const res = await api.pauseSubscription(id, 'Paused via operations dashboard');
      if (res.success) {
        setMessage('Subscription paused successfully.');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleResume = async (id: string) => {
    try {
      const res = await api.resumeSubscription(id);
      if (res.success) {
        setMessage('Subscription resumed successfully.');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const res = await api.renewSubscription(id);
      if (res.success) {
        setMessage('Subscription term renewed successfully.');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCloseEarly = async () => {
    if (!closeEarlySubId) return;
    try {
      const res = await api.closeSubscriptionEarly(closeEarlySubId, closeReason || 'Customer requested termination');
      if (res.success) {
        setMessage('Subscription closed early.');
        setCloseEarlySubId(null);
        setCloseReason('');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const viewHistory = async (sub: Subscription) => {
    try {
      const res = await api.getSubscription(sub.id);
      if (res.success) {
        setHistorySub(res.subscription);
      }
    } catch (err: any) {
      setMessage(`Error fetching history: ${err.message}`);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Subscription Lifecycle Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage contract progression: Draft → Quotation → Confirmed → Active → Closed, with audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="QUOTATION">QUOTATION</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PAUSED">PAUSED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Sub #</th>
                <th className="py-3 px-4 font-semibold">Client Company</th>
                <th className="py-3 px-4 font-semibold">Plan Details</th>
                <th className="py-3 px-4 font-semibold">Next Billing</th>
                <th className="py-3 px-4 font-semibold">Amount / Cycle</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No subscriptions match current criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isActive = sub.status === 'ACTIVE';
                  const isPaused = sub.status === 'PAUSED';
                  const isClosed = sub.status === 'CLOSED';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{sub.subscriptionNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{sub.customer?.companyName || sub.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{sub.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{sub.plan?.name}</div>
                        <div className="text-[10px] text-purple-400 font-mono">{sub.billingInterval} interval</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ₹{sub.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isPaused
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isClosed
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* History modal trigger */}
                        <button
                          onClick={() => viewHistory(sub)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="View Lifecycle Audit History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Lifecycle actions */}
                        {isActive && (
                          <>
                            <button
                              onClick={() => handlePause(sub.id)}
                              className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 transition"
                              title="Pause Subscription"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCloseEarlySubId(sub.id)}
                              className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 transition"
                              title="Early Closure"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isPaused && (
                          <button
                            onClick={() => handleResume(sub.id)}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition"
                            title="Resume Subscription"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isClosed && (
                          <button
                            onClick={() => handleRenew(sub.id)}
                            className="p-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 transition"
                            title="Renew Contract Term"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Audit Trail Modal */}
      {historySub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <span>Audit History: {historySub.subscriptionNumber}</span>
                </h3>
                <p className="text-xs text-slate-400">Chronological lifecycle state transitions & invoices</p>
              </div>
              <button
                onClick={() => setHistorySub(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 text-xs">
              {historySub.history && historySub.history.length > 0 ? (
                historySub.history.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 font-mono text-[11px]">{h.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{h.notes || 'State transition executed.'}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Status: {h.fromStatus || 'INIT'} → <strong className="text-white">{h.toStatus}</strong></span>
                      <span>By: {h.performedBy}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">No audit events logged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Early Closure Modal */}
      {closeEarlySubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Execute Early Contract Closure</h3>
            <p className="text-xs text-slate-400">
              This action will close the subscription immediately and stop subsequent recurring billings.
            </p>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">Cancellation Reason</label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Reason for early cancellation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs h-20 resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCloseEarlySubId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={handleCloseEarly}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs"
              >
                Confirm Early Closure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Initialize New Subscription</h3>
            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              {(isAdmin || isStaff) && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Customer Organization</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price}/{p.billingInterval.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Seats / Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Promotional Discount Code (Optional)</label>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="e.g. EARLYBIRD20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs">
                Activating this subscription will automatically calculate applicable 18% GST and generate the initial confirmed billing invoice.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
