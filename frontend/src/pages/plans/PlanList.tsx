import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plan, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Layers, Plus, Calendar, Check, X, Shield, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export const PlanList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [minQuantity, setMinQuantity] = useState('1');
  const [autoCloseOnEnd, setAutoCloseOnEnd] = useState(true);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes] = await Promise.all([api.getPlans(), api.getProducts()]);
      if (plansRes.success) setPlans(plansRes.plans);
      if (productsRes.success) {
        setProducts(productsRes.products);
        if (productsRes.products.length > 0) {
          setProductId(productsRes.products[0].id);
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPlan({
        name,
        productId,
        price: Number(price),
        billingInterval,
        minQuantity: Number(minQuantity),
        autoCloseOnEnd,
        allowEarlyClosure,
        allowPause,
        allowRenewal,
      });

      if (res.success) {
        setMessage('Plan created successfully.');
        setShowModal(false);
        setName('');
        setPrice('');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete or deactivate this plan?')) return;
    try {
      const res = await api.deletePlan(id);
      if (res.success) {
        setMessage(res.message);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Subscription Plans & Recurring Rules</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure billing cadences (Daily, Weekly, Monthly, Yearly) and early closure / pause permissions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 uppercase tracking-wider">
                  {plan.billingInterval} BILLING
                </span>
                <span className="text-xs text-slate-400">Min Qty: {plan.minQuantity}</span>
              </div>

              <h3 className="text-base font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Product: {plan.product?.name || 'Associated Software'}</p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-400">/{plan.billingInterval.toLowerCase()}</span>
              </div>

              {/* Permissions Checklist as requested by PDF */}
              <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Configured Behaviors:</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Auto-close on expiration:</span>
                  {plan.autoCloseOnEnd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Permit early closure:</span>
                  {plan.allowEarlyClosure ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Permit pause state:</span>
                  {plan.allowPause ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Permit renewal:</span>
                  {plan.allowRenewal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Delete / Deactivate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create Subscription Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Enterprise Monthly Plan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Interval</label>
                  <select
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recurring Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="4999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Behavior checkboxes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block mb-1">Lifecycle Rules</span>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCloseOnEnd}
                    onChange={(e) => setAutoCloseOnEnd(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Close automatically when expiration reached</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowEarlyClosure}
                    onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Allow early contract closure</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Allow subscription pausing</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRenewal}
                    onChange={(e) => setAllowRenewal(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Allow contract renewal</span>
                </label>
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
