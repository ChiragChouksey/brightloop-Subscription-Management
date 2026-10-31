import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Quotation, Plan, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet, Plus, CheckCircle2, ArrowRight, Clock, Building, Zap, Tag } from 'lucide-react';

export const QuotationList: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [discountCode, setDiscountCode] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, pRes] = await Promise.all([
        api.getQuotations(),
        api.getPlans(),
      ]);

      if (qRes.success) setQuotations(qRes.quotations);
      if (pRes.success) {
        setPlans(pRes.plans);
        if (pRes.plans.length > 0) setPlanId(pRes.plans[0].id);
      }

      if (isAdminOrStaff) {
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
  }, []);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createQuotation({
        customerId: isAdminOrStaff ? customerId : undefined,
        planId,
        validityDays: Number(validityDays),
        discountCode: discountCode || undefined,
        notes,
      });

      if (res.success) {
        setMessage('Quotation created successfully.');
        setShowModal(false);
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  // Convert Quotation into active subscription
  const handleConvert = async (id: string) => {
    try {
      const res = await api.convertQuotation(id);
      if (res.success) {
        setMessage('Quotation successfully converted to Active Subscription and first invoice generated!');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Quotations & Pricing Offers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prepare tailored proposals from templates and convert accepted quotes into live subscriptions with 1 click.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation Offer</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Quotations Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Quote #</th>
                <th className="py-3 px-4 font-semibold">Client Company</th>
                <th className="py-3 px-4 font-semibold">Associated Plan</th>
                <th className="py-3 px-4 font-semibold">Validity</th>
                <th className="py-3 px-4 font-semibold">Total (Inc. Tax)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No quotation proposals on record.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const isConverted = q.status === 'CONVERTED';
                  return (
                    <tr key={q.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{q.quotationNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{q.customer?.companyName || q.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{q.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{q.plan?.name || 'Custom Solution'}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(q.validityDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ₹{q.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConverted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isConverted ? (
                          <button
                            onClick={() => handleConvert(q.id)}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-sm transition inline-flex items-center space-x-1"
                          >
                            <span>Convert to Subscription</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">Active Subscription Created ✓</span>
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

      {/* Create Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Draft Quotation Proposal</h3>
            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              {isAdminOrStaff && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName || c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    placeholder="30"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Promo Discount Code (Optional)</label>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="e.g. EARLYBIRD20 or FLAT500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Terms</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Proposal conditions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white h-16 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
